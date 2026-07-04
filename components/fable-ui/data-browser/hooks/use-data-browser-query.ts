import * as React from "react"

import {
  queryLocalRows,
  useOptionalFableDataContext,
  fableRegistry,
  type DataColumn,
  type DataFilter,
  type DataQueryResult,
  type DataRow,
  type DataSort,
  type SortState,
} from "@/lib/fable-ui/core"
import type { DataBrowserQueryState } from "../data-browser.types"

const emptyContext: Record<string, unknown> = {}

function normalizePageSize(pageSize: number) {
  return Math.max(1, Math.min(100, Math.floor(pageSize || 10)))
}

export function useDataBrowserQuery<Row extends DataRow>({
  resourceId,
  rows = [],
  columns,
  initialFilters = {},
  initialSearch = "",
  initialSort,
  pageSize = 10,
}: {
  resourceId?: string
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
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | undefined>()
  const [revision, setRevision] = React.useState(0)

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
    if (!resourceId) {
      return
    }

    let isActive = true

    queueMicrotask(() => {
      if (isActive) {
        setIsLoading(true)
        setError(undefined)
      }
    })

    registry
      .list<Row>(resourceId, query, context)
      .then((result) => {
        if (isActive) {
          setRemoteResult(result)
        }
      })
      .catch((nextError) => {
        if (isActive) {
          setError(
            nextError instanceof Error
              ? nextError
              : new Error("Unable to load resource.")
          )
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [context, query, registry, resourceId, revision])

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
    setSearch: (search: string) => updateState({ search }),
    setFilter: (key: string, value: unknown) =>
      updateState({ filters: { ...state.filters, [key]: value } }),
    clearFilters: () => updateState({ filters: {} }),
    setSort: (sort?: SortState) => updateState({ sort }),
    setPage: (page: number) =>
      setState((current) => ({
        ...current,
        page,
        cursor:
          page > current.page
            ? result?.nextCursor
            : page < current.page
              ? result?.previousCursor
              : current.cursor,
      })),
    result,
    rows: result?.rows ?? [],
    totalRows: result?.totalRows ?? 0,
    page: result?.page ?? state.page,
    pageSize: result?.pageSize ?? state.pageSize,
    nextCursor: result?.nextCursor,
    previousCursor: result?.previousCursor,
    isLoading,
    error,
    refetch: () => setRevision((value) => value + 1),
  }
}
