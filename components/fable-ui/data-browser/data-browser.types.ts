import type {
  DataActionConfig,
  DataColumn,
  DataFilter,
  DataQueryResult,
  DataRow,
  DataSort,
  SortState,
} from "@/lib/fable-ui/core"
import type { ReactNode } from "react"

export type DataBrowserVariant = "default" | "elevated" | "subtle"
export type DataBrowserSize = "sm" | "md" | "lg"

export type DataBrowserRowAction<Row extends DataRow = DataRow> = DataActionConfig & {
  run?: (row: Row, values?: Record<string, unknown>) => Promise<unknown> | unknown
}

export type DataBrowserDetail<Row extends DataRow = DataRow> = {
  title?: string
  description?: string
  fields?: string[]
  row?: Row
}

export type DataBrowserProps<Row extends DataRow = DataRow> = {
  title: string
  entityLabel: string
  description?: string
  resourceId?: string
  searchPlaceholder?: string
  columns: DataColumn[]
  rows?: Row[]
  filters?: DataFilter[]
  sortOptions?: DataSort[]
  initialFilters?: Record<string, unknown>
  initialSearch?: string
  initialSort?: SortState
  pageSize?: number
  rowActions?: DataBrowserRowAction<Row>[]
  onRowAction?: (
    action: DataBrowserRowAction<Row>,
    row: Row,
    values?: Record<string, unknown>,
  ) => Promise<unknown> | unknown
  onRowActionSuccess?: (result: unknown, action: DataBrowserRowAction<Row>, row: Row) => void
  renderDetail?: (row: Row) => ReactNode
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  variant?: DataBrowserVariant
  size?: DataBrowserSize
}

export type DataBrowserQueryState = {
  search: string
  filters: Record<string, unknown>
  sort?: SortState
  page: number
  pageSize: number
  cursor?: string
}

export type DataBrowserQueryResult<Row extends DataRow = DataRow> = DataQueryResult<Row> & {
  isLoading: boolean
  error?: Error
}
