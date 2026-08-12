import * as React from "react"

import {
  queryLocalRows,
  useOptionalFableDataContext,
  fableRegistry,
  type DataColumn,
  type DataFilter,
  type DataQuery,
  type DataQueryResult,
  type DataRow,
  type DataSourceContext,
  type DataSort,
  type SortState,
} from "@/lib/fable-ui/core"
import type { DataBrowserQueryState } from "../data-browser.types"

const SEARCH_DEBOUNCE_MS = 250
const emptyContext: DataSourceContext = {}

function normalizePageSize(pageSize: number) {
  return Math.max(1, Math.min(100, Math.floor(pageSize || 10)))
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  )
}

export function useDataBrowserQuery<Row extends DataRow>({
  resourceId,
  title,
  entityLabel,
  rows = [],
  columns,
  filters,
  sortOptions,
  initialFilters = {},
  initialSearch = "",
  initialSort,
  pageSize = 8,
}: {
  resourceId?: string
  title?: string
  entityLabel?: string
  rows?: Row[]
  columns: DataColumn[]
  filters?: DataFilter[]
  sortOptions?: DataSort[]
  initialFilters?: Record<string, unknown>
  initialSearch?: string
  initialSort?: SortState
  pageSize?: number
}) {
  const dataContext = useOptionalFableDataContext()
  const registry = dataContext?.registry ?? fableRegistry
  const context = dataContext?.context ?? emptyContext
  const normalizedPageSize = normalizePageSize(pageSize)
  const [state, setState] = React.useState<DataBrowserQueryState>({
    search: initialSearch,
    filters: initialFilters,
    sort: initialSort,
    page: 1,
    pageSize: normalizedPageSize,
  })
  const [remoteResult, setRemoteResult] =
    React.useState<DataQueryResult<Row> | null>(null)
  const [committedSnapshot, setCommittedSnapshot] = React.useState<{
    token: string
    owner: unknown
    query: DataQuery
    result: DataQueryResult<Row>
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | undefined>()
  const [revision, setRevision] = React.useState(0)
  const lastForcedRevision = React.useRef(0)
  const searchDebounceRef = React.useRef(false)
  const currentResultScopeRef = React.useRef(false)
  const activeSnapshotRef = React.useRef<{
    token: string
    owner: unknown
  } | null>(null)

  const resource = resourceId ? registry.getResource(resourceId) : undefined

  const query = React.useMemo(
    () => ({
      search: state.search,
      filters: state.filters,
      sort: state.sort,
      page: state.page,
      pageSize: state.pageSize,
      cursor: state.cursor,
    }),
    [state]
  )

  React.useEffect(() => {
    searchDebounceRef.current = false
    currentResultScopeRef.current = false
  }, [context, dataContext, registry, resourceId, revision])

  React.useEffect(() => {
    if (!resourceId) {
      let isActive = true
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      activeSnapshotRef.current = null

      queueMicrotask(() => {
        if (isActive) {
          setRemoteResult(null)
          setCommittedSnapshot(null)
          setIsLoading(false)
          setError(undefined)
        }
      })

      return () => {
        isActive = false
      }
    }

    let isActive = true
    currentResultScopeRef.current = false
    const snapshotToken = dataContext?.beginRenderedData(resourceId)
    activeSnapshotRef.current = snapshotToken
      ? { token: snapshotToken, owner: dataContext }
      : null
    const shouldDebounce = searchDebounceRef.current
    searchDebounceRef.current = false
    const force = revision > 0 && revision !== lastForcedRevision.current
    let timer: ReturnType<typeof setTimeout> | undefined
    let abortStartedRequest: (() => void) | undefined
    let detachContextAbort: (() => void) | undefined

    if (force) {
      lastForcedRevision.current = revision
    }

    const startRequest = () => {
      if (!isActive) {
        return
      }

      queueMicrotask(() => {
        if (isActive) {
          setIsLoading(true)
          setError(undefined)
        }
      })

      const listPromise = dataContext
        ? dataContext.listResource<Row>(resourceId, query, { force })
        : (() => {
            const controller = new AbortController()
            const contextSignal = context.signal
            const abortFromContext = () => controller.abort(contextSignal?.reason)

            if (contextSignal?.aborted) {
              abortFromContext()
            } else if (contextSignal) {
              contextSignal.addEventListener("abort", abortFromContext, {
                once: true,
              })
              detachContextAbort = () => {
                contextSignal.removeEventListener("abort", abortFromContext)
              }
            }

            abortStartedRequest = () => {
              detachContextAbort?.()
              controller.abort()
            }

            return registry.list<Row>(resourceId, query, {
              ...context,
              signal: controller.signal,
            })
          })()

      listPromise
        .then((result) => {
          if (isActive) {
            setRemoteResult(result)
            currentResultScopeRef.current = true
            if (snapshotToken) {
              setCommittedSnapshot({
                token: snapshotToken,
                owner: dataContext,
                query,
                result,
              })
            }
          }
        })
        .catch((nextError) => {
          if (isActive && !isAbortError(nextError)) {
            setError(
              nextError instanceof Error
                ? nextError
                : new Error("Unable to load resource.")
            )
          }
        })
        .finally(() => {
          detachContextAbort?.()
          if (isActive) {
            setIsLoading(false)
          }
        })
    }

    if (shouldDebounce) {
      queueMicrotask(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })
      timer = setTimeout(startRequest, SEARCH_DEBOUNCE_MS)
    } else {
      startRequest()
    }

    return () => {
      isActive = false
      if (timer) {
        clearTimeout(timer)
      }
      detachContextAbort?.()
      abortStartedRequest?.()
      if (
        snapshotToken &&
        activeSnapshotRef.current?.token === snapshotToken &&
        activeSnapshotRef.current.owner === dataContext
      ) {
        activeSnapshotRef.current = null
      }
      if (snapshotToken) {
        dataContext?.endRenderedData(resourceId, snapshotToken)
      }
    }
  }, [
    context,
    dataContext,
    query,
    registry,
    resourceId,
    revision,
  ])

  React.useEffect(() => {
    const activeSnapshot = activeSnapshotRef.current

    if (
      !dataContext ||
      !resourceId ||
      !committedSnapshot ||
      !activeSnapshot ||
      activeSnapshot.token !== committedSnapshot.token ||
      activeSnapshot.owner !== dataContext ||
      committedSnapshot.owner !== dataContext
    ) {
      return
    }

    dataContext.publishRenderedData({
      token: committedSnapshot.token,
      resourceId,
      title: title || resource?.label || "Data browser",
      entityLabel: entityLabel || resource?.entityLabel || "rows",
      query: committedSnapshot.query,
      columns,
      filterKeys: filters?.map((filter) => filter.key) ?? [],
      sortKeys: sortOptions?.map((sort) => sort.key) ?? [],
      result: committedSnapshot.result,
    })
  }, [
    columns,
    committedSnapshot,
    dataContext,
    entityLabel,
    filters,
    resource,
    resourceId,
    sortOptions,
    title,
  ])

  const localResult = React.useMemo(() => {
    if (resourceId) {
      return null
    }

    return queryLocalRows(rows, query, columns)
  }, [columns, query, resourceId, rows])

  const result = resourceId ? remoteResult : localResult

  const updateState = React.useCallback(
    (next: Partial<DataBrowserQueryState>) => {
      setState((current) => ({
        ...current,
        ...next,
        page: next.page ?? 1,
        cursor: next.cursor,
      }))
    },
    []
  )

  return {
    resource,
    state,
    setSearch: (search: string) => {
      currentResultScopeRef.current = false
      if (resourceId) {
        searchDebounceRef.current = true
      }
      updateState({ search })
    },
    setFilter: (key: string, value: unknown) => {
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      updateState({ filters: { ...state.filters, [key]: value } })
    },
    clearFilters: () => {
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      updateState({ filters: {} })
    },
    setSort: (sort?: SortState) => {
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      updateState({ sort })
    },
    setPage: (page: number) => {
      const hasCurrentRemoteResult = currentResultScopeRef.current
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      setState((current) => ({
        ...current,
        page,
        cursor:
          resourceId && !hasCurrentRemoteResult
            ? undefined
            : page > current.page
            ? result?.nextCursor
            : page < current.page
              ? result?.previousCursor
              : current.cursor,
      }))
    },
    result,
    rows: result?.rows ?? [],
    totalRows: result?.totalRows ?? 0,
    page: result?.page ?? state.page,
    pageSize: result?.pageSize ?? state.pageSize,
    nextCursor: result?.nextCursor,
    previousCursor: result?.previousCursor,
    isLoading,
    error,
    refetch: () => {
      searchDebounceRef.current = false
      currentResultScopeRef.current = false
      if (resourceId) {
        dataContext?.invalidateResource(resourceId)
      }
      setRevision((value) => value + 1)
    },
  }
}
