"use client"

import * as React from "react"

import { fableRegistry, type DataSourceRegistry } from "./registry"
import { getDataValue } from "./format"
import type {
  DataActionInput,
  DataCell,
  DataColumn,
  DataQuery,
  DataQueryResult,
  DataRow,
  DataSourceContext,
  RenderedDataQuery,
  RenderedDataResult,
  RenderedDataSnapshot,
  RenderedDataValue,
} from "./types"

const EMPTY_CONTEXT: DataSourceContext = {}
const MAX_CACHE_ENTRIES = 50
const MAX_SNAPSHOT_ROWS = 100
const MAX_SNAPSHOT_COLUMNS = 12
const MAX_SNAPSHOT_BYTES = 64 * 1024

type CachedQuery = {
  resourceId: string
  promise: Promise<DataQueryResult<DataRow>>
}

type PublishRenderedDataInput<Row extends DataRow = DataRow> = {
  token: string
  resourceId: string
  title: string
  entityLabel: string
  query: DataQuery
  columns: DataColumn[]
  filterKeys: string[]
  sortKeys: string[]
  result: DataQueryResult<Row>
}

function serializeQueryValue(
  value: unknown,
  seen = new WeakSet<object>()
): string {
  if (value === undefined) return "undefined"
  if (value === null) return "null"
  if (typeof value === "string") return `string:${JSON.stringify(value)}`
  if (typeof value === "boolean") return `boolean:${value}`
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? `number:${value}`
      : `number:${String(value)}`
  }
  if (typeof value === "bigint") return `bigint:${value}`
  if (value instanceof Date) return `date:${value.toISOString()}`

  if (typeof value !== "object") {
    throw new Error("Fable data query filters must be serializable values.")
  }

  if (seen.has(value)) {
    throw new Error("Fable data query filters cannot contain circular values.")
  }

  seen.add(value)
  let serialized: string

  if (Array.isArray(value)) {
    serialized = `array:[${value
      .map((item) => serializeQueryValue(item, seen))
      .join(",")}]`
  } else {
    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Object.prototype && prototype !== null) {
      seen.delete(value)
      throw new Error("Fable data query filters contain an unsupported value.")
    }

    serialized = `object:{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, item]) =>
          `${JSON.stringify(key)}:${serializeQueryValue(item, seen)}`
      )
      .join(",")}}`
  }
  seen.delete(value)
  return serialized
}

function createDataQueryCacheKey(resourceId: string, query: DataQuery) {
  return [
    serializeQueryValue(resourceId),
    serializeQueryValue(query.search),
    serializeQueryValue(query.filters),
    serializeQueryValue(query.sort),
    serializeQueryValue(query.cursor),
    serializeQueryValue(query.page),
    serializeQueryValue(query.pageSize),
  ].join("|")
}

function toRenderedDataValue(
  value: unknown,
  seen = new WeakSet<object>()
): RenderedDataValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (value === undefined) {
    return null
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value)
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error("Rendered data contains a circular value.")
    }

    seen.add(value)
    const result = value.map((item) => toRenderedDataValue(item, seen))
    seen.delete(value)
    return result
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      throw new Error("Rendered data contains a circular value.")
    }

    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("Rendered data contains an unsupported value.")
    }

    seen.add(value)
    const result = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        toRenderedDataValue(item, seen),
      ])
    )
    seen.delete(value)
    return result
  }

  return String(value)
}

function toRenderedCellValue(value: unknown): DataCell {
  if (value === null || value === undefined) return null
  if (typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value)
  }
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function createRenderedDataSnapshot<Row extends DataRow>({
  resourceId,
  title,
  entityLabel,
  query,
  columns,
  filterKeys,
  sortKeys,
  result,
}: Omit<PublishRenderedDataInput<Row>, "token">): RenderedDataResult {
  const visibleColumns = columns.filter((column) => !column.hidden)

  if (
    result.rows.length > MAX_SNAPSHOT_ROWS ||
    visibleColumns.length > MAX_SNAPSHOT_COLUMNS
  ) {
    return { status: "unavailable", resourceId, reason: "too-large" }
  }

  try {
    const allowedFilterKeys = new Set(filterKeys)
    const allowedSortKeys = new Set(sortKeys)
    const sanitizedQuery: RenderedDataQuery = {
      search: query.search,
      filters: query.filters
        ? Object.fromEntries(
            Object.entries(query.filters)
              .filter(([key]) => allowedFilterKeys.has(key))
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, value]) => [key, toRenderedDataValue(value)])
          )
        : undefined,
      sort:
        query.sort && allowedSortKeys.has(query.sort.key)
          ? query.sort
          : undefined,
      page: result.page ?? query.page ?? 1,
      pageSize: result.pageSize ?? query.pageSize ?? result.rows.length,
    }
    const snapshot: RenderedDataSnapshot = {
      resourceId,
      title,
      entityLabel,
      scope: "current-view",
      capturedAt: new Date().toISOString(),
      query: sanitizedQuery,
      columns: visibleColumns.map(
        ({ key, label, description, type, align }) => ({
          key,
          label,
          description,
          type,
          align,
        })
      ),
      rows: result.rows.map((row) =>
        Object.fromEntries(
          visibleColumns.map((column) => [
            column.key,
            toRenderedCellValue(getDataValue(row, column.key)),
          ])
        )
      ),
      totalRows: result.totalRows ?? result.rows.length,
      page: result.page ?? query.page ?? 1,
      pageSize: result.pageSize ?? query.pageSize ?? result.rows.length,
    }

    if (
      new TextEncoder().encode(JSON.stringify(snapshot)).byteLength >
      MAX_SNAPSHOT_BYTES
    ) {
      return { status: "unavailable", resourceId, reason: "too-large" }
    }

    return { status: "available", data: snapshot }
  } catch {
    return { status: "unavailable", resourceId, reason: "too-large" }
  }
}

function createProviderStore(
  registry: DataSourceRegistry,
  context: DataSourceContext
) {
  const queries = new Map<string, CachedQuery>()
  const resolvedKeys: string[] = []
  const renderedDataByToken = new Map<string, RenderedDataResult>()
  const activeSnapshotTokens = new Map<string, string[]>()
  let tokenCounter = 0

  function removeResolvedKey(key: string) {
    const index = resolvedKeys.indexOf(key)

    if (index >= 0) {
      resolvedKeys.splice(index, 1)
    }
  }

  function rememberResolvedKey(key: string) {
    removeResolvedKey(key)
    resolvedKeys.push(key)

    while (resolvedKeys.length > MAX_CACHE_ENTRIES) {
      const oldest = resolvedKeys.shift()

      if (oldest) {
        queries.delete(oldest)
      }
    }
  }

  function listResource<Row extends DataRow = DataRow>(
    resourceId: string,
    query: DataQuery = {},
    options: { force?: boolean } = {}
  ): Promise<DataQueryResult<Row>> {
    let key: string

    try {
      key = createDataQueryCacheKey(resourceId, query)
    } catch (error) {
      return Promise.reject(error)
    }

    const existing = queries.get(key)

    if (existing && !options.force) {
      return existing.promise as Promise<DataQueryResult<Row>>
    }

    if (existing) {
      queries.delete(key)
      removeResolvedKey(key)
    }

    const promise = Promise.resolve(
      registry.list<Row>(resourceId, query, context)
    )
    const entry: CachedQuery = {
      resourceId,
      promise: promise as Promise<DataQueryResult<DataRow>>,
    }
    queries.set(key, entry)

    promise.then(
      () => {
        if (queries.get(key) === entry) {
          rememberResolvedKey(key)
        }
      },
      () => {
        if (queries.get(key) === entry) {
          queries.delete(key)
          removeResolvedKey(key)
        }
      }
    )

    return promise
  }

  function beginRenderedData(resourceId: string) {
    const token = `${resourceId}:${++tokenCounter}`
    const tokens = activeSnapshotTokens.get(resourceId) ?? []
    activeSnapshotTokens.set(resourceId, [...tokens, token])
    return token
  }

  function endRenderedData(resourceId: string, token: string) {
    const tokens = activeSnapshotTokens.get(resourceId)

    if (!tokens?.includes(token)) {
      return
    }

    const remainingTokens = tokens.filter(
      (currentToken) => currentToken !== token
    )
    renderedDataByToken.delete(token)

    if (remainingTokens.length > 0) {
      activeSnapshotTokens.set(resourceId, remainingTokens)
    } else {
      activeSnapshotTokens.delete(resourceId)
    }
  }

  function invalidateResource(resourceId: string) {
    for (const [key, entry] of queries) {
      if (entry.resourceId === resourceId) {
        queries.delete(key)
        removeResolvedKey(key)
      }
    }

    for (const token of activeSnapshotTokens.get(resourceId) ?? []) {
      renderedDataByToken.delete(token)
    }
    activeSnapshotTokens.delete(resourceId)
  }

  function publishRenderedData<Row extends DataRow>(
    input: PublishRenderedDataInput<Row>
  ) {
    if (!activeSnapshotTokens.get(input.resourceId)?.includes(input.token)) {
      return
    }

    renderedDataByToken.set(input.token, createRenderedDataSnapshot(input))
  }

  function getRenderedData(resourceId: string): RenderedDataResult {
    const tokens = activeSnapshotTokens.get(resourceId) ?? []

    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      const snapshot = renderedDataByToken.get(tokens[index])

      if (snapshot) {
        return snapshot
      }
    }

    return {
      status: "unavailable",
      resourceId,
      reason: "not-rendered",
    }
  }

  return {
    listResource,
    invalidateResource,
    beginRenderedData,
    endRenderedData,
    publishRenderedData,
    getRenderedData,
  }
}

type FableDataContextValue = {
  registry: DataSourceRegistry
  context: DataSourceContext
  listResource: ReturnType<typeof createProviderStore>["listResource"]
  invalidateResource: ReturnType<
    typeof createProviderStore
  >["invalidateResource"]
  beginRenderedData: ReturnType<typeof createProviderStore>["beginRenderedData"]
  endRenderedData: ReturnType<typeof createProviderStore>["endRenderedData"]
  publishRenderedData: ReturnType<
    typeof createProviderStore
  >["publishRenderedData"]
  getRenderedData: ReturnType<typeof createProviderStore>["getRenderedData"]
}

const FableDataContext = React.createContext<FableDataContextValue | null>(null)

export function FableDataProvider({
  registry = fableRegistry,
  context = EMPTY_CONTEXT,
  children,
}: {
  registry?: DataSourceRegistry
  context?: DataSourceContext
  children: React.ReactNode
}) {
  const store = React.useMemo(
    () => createProviderStore(registry, context),
    [context, registry]
  )
  const value = React.useMemo(
    () => ({ registry, context, ...store }),
    [context, registry, store]
  )

  return (
    <FableDataContext.Provider value={value}>
      {children}
    </FableDataContext.Provider>
  )
}

export function useFableDataContext() {
  const value = React.useContext(FableDataContext)

  if (!value) {
    throw new Error(
      "useFableDataContext must be used within FableDataProvider."
    )
  }

  return value
}

export function useOptionalFableDataContext() {
  return React.useContext(FableDataContext)
}

export function useFableResource(resourceId: string) {
  const { registry, context, invalidateResource, listResource } =
    useFableDataContext()
  const resource = registry.getResource(resourceId)

  const list = React.useCallback(
    (query: DataQuery = {}) => listResource(resourceId, query),
    [listResource, resourceId]
  )

  const runAction = React.useCallback(
    async (input: Omit<DataActionInput, "resourceId">) => {
      const result = await registry.executeAction(
        { ...input, resourceId },
        context
      )

      if (result.invalidate) {
        invalidateResource(resourceId)
      }

      return result
    },
    [context, invalidateResource, registry, resourceId]
  )

  return {
    resource,
    list,
    runAction,
  }
}
