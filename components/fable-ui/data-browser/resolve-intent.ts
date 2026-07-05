import {
  fableRegistry,
  type DataColumn,
  type DataFilter,
  type DataRow,
  type DataSort,
  type DataSourceRegistry,
  type SortState,
} from "@/lib/fable-ui/core"
import type { DataBrowserProps } from "./data-browser.types"

export type DataBrowserIntent<Row extends DataRow = DataRow> = {
  title: string
  entityLabel?: string
  description?: string
  resourceId?: string
  searchPlaceholder?: string
  columns?: DataColumn[]
  rows?: Row[]
  filters?: DataFilter[]
  sortOptions?: DataSort[]
  initialFilters?: Record<string, unknown>
  initialSort?: SortState
  initialSearch?: string
  pageSize?: number
  visibleColumns?: string[]
  detail?: DataBrowserProps<Row>["detail"]
}

export function resolveDataBrowserIntent<Row extends DataRow = DataRow>(
  intent: DataBrowserIntent<Row>,
  registry: DataSourceRegistry = fableRegistry,
): DataBrowserProps<Row> {
  if (!intent.resourceId) {
    return {
      title: intent.title,
      description: intent.description,
      entityLabel: intent.entityLabel ?? "rows",
      searchPlaceholder: intent.searchPlaceholder,
      columns: intent.columns ?? [],
      rows: intent.rows ?? [],
      filters: intent.filters,
      sortOptions: intent.sortOptions,
      initialFilters: intent.initialFilters,
      initialSort: intent.initialSort,
      initialSearch: intent.initialSearch,
      pageSize: intent.pageSize,
      detail: intent.detail,
    }
  }

  const resource = registry.getResource(intent.resourceId)

  if (!resource) {
    return {
      title: intent.title || "Data browser",
      entityLabel: intent.entityLabel ?? "rows",
      columns: [],
      rows: [],
      error: {
        title: "Resource unavailable",
        description: `The resource "${intent.resourceId}" is not registered by the host app.`,
      },
    }
  }

  const visibleColumnSet = new Set(intent.visibleColumns ?? [])
  const columns = visibleColumnSet.size
    ? resource.columns.map((column) => ({
        ...column,
        hidden: !visibleColumnSet.has(column.key),
      }))
    : resource.columns

  return {
    title: intent.title || resource.label,
    description: intent.description,
    entityLabel: resource.entityLabel,
    resourceId: resource.id,
    searchPlaceholder: intent.searchPlaceholder,
    columns,
    filters: resource.filters,
    sortOptions: resource.sort,
    rowActions: resource.actions,
    initialFilters: intent.initialFilters,
    initialSort: intent.initialSort,
    initialSearch: intent.initialSearch,
    pageSize: intent.pageSize,
    detail: intent.detail,
  }
}
