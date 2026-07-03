export type DataCell = string | number | boolean | null

export type DataRow = {
  id?: string
  _id?: string
  uid?: string
  [key: string]: unknown
}

export type DataColumn = {
  key: string
  label: string
  description?: string
  type?: "text" | "number" | "currency" | "date" | "datetime" | "boolean" | "badge"
  align?: "left" | "center" | "right"
  sortable?: boolean
  filterable?: boolean
  hidden?: boolean
}

export type DataFilterOption = {
  label: string
  value: string | number | boolean
}

export type DataFilter = {
  key: string
  label: string
  type: "text" | "select" | "multi-select" | "date" | "date-preset" | "number" | "boolean"
  options?: Array<DataFilterOption | string>
}

export type DataSortDirection = "asc" | "desc"

export type DataSort = {
  key: string
  label: string
  directions?: DataSortDirection[]
}

export type SortState = {
  key: string
  direction: DataSortDirection
}

export type DataQuery = {
  search?: string
  filters?: Record<string, unknown>
  sort?: SortState
  cursor?: string
  page?: number
  pageSize?: number
}

export type DataQueryResult<Row extends DataRow = DataRow> = {
  rows: Row[]
  columns?: DataColumn[]
  totalRows?: number
  page?: number
  pageSize?: number
  nextCursor?: string
  previousCursor?: string
}

export type DataSourceContext = {
  orgId?: string
  tenantId?: string
  locale?: string
  signal?: AbortSignal
  auth?: {
    userId?: string
    getAccessToken?: () => Promise<string | null | undefined> | string | null | undefined
  }
  [key: string]: unknown
}

export type DataActionField = {
  name: string
  label: string
  type: "text" | "number" | "textarea" | "select" | "date" | "toggle"
  required?: boolean
  options?: DataFilterOption[]
}

export type DataActionInput = {
  actionId: string
  resourceId: string
  rowId?: string
  values?: Record<string, unknown>
}

export type DataActionResult = {
  ok: boolean
  message?: string
  data?: unknown
  invalidate?: boolean
}

export type DataActionConfig = {
  id: string
  label: string
  description?: string
  variant?: "default" | "warning" | "destructive"
  requiresConfirmation?: boolean
  fields?: DataActionField[]
}

export type ResourceConfig<TSource = unknown, Row extends DataRow = DataRow> = {
  id: string
  label: string
  entityLabel: string
  driver: string
  source: TSource
  columns: DataColumn[]
  filters?: DataFilter[]
  sort?: DataSort[]
  actions?: DataActionConfig[]
  search?: {
    mode?: "client" | "exact" | "prefix"
    fields?: string[]
  }
  agent?: {
    description?: string
    aliases?: string[]
    useWhen?: string[]
    avoidWhen?: string[]
  }
  transformRows?: (rows: Row[]) => Row[]
}

export type ResourceRuntime<Row extends DataRow = DataRow, TSource = unknown> = {
  list?: (
    resource: ResourceConfig<TSource, Row>,
    query: DataQuery,
    ctx: DataSourceContext,
  ) => Promise<DataQueryResult<Row>> | DataQueryResult<Row>
  get?: (
    resource: ResourceConfig<TSource, Row>,
    rowId: string,
    ctx: DataSourceContext,
  ) => Promise<Row | null> | Row | null
  executeAction?: (
    input: DataActionInput,
    resource: ResourceConfig<TSource, Row>,
    ctx: DataSourceContext,
  ) => Promise<DataActionResult> | DataActionResult
}

export type DataSourceDriver<TSource = unknown, Row extends DataRow = DataRow> = {
  list: (
    resource: ResourceConfig<TSource, Row>,
    query: DataQuery,
    ctx: DataSourceContext,
    runtime?: ResourceRuntime<Row, TSource>,
  ) => Promise<DataQueryResult<Row>> | DataQueryResult<Row>
  get?: (
    resource: ResourceConfig<TSource, Row>,
    rowId: string,
    ctx: DataSourceContext,
    runtime?: ResourceRuntime<Row, TSource>,
  ) => Promise<Row | null> | Row | null
  executeAction?: (
    input: DataActionInput,
    resource: ResourceConfig<TSource, Row>,
    ctx: DataSourceContext,
    runtime?: ResourceRuntime<Row, TSource>,
  ) => Promise<DataActionResult> | DataActionResult
}

export type AgentResourceManifest = {
  resources: Array<{
    id: string
    label: string
    entityLabel: string
    description?: string
    aliases?: string[]
    useWhen?: string[]
    avoidWhen?: string[]
    columns: Array<Pick<DataColumn, "key" | "label" | "type" | "description">>
    filters?: Array<Pick<DataFilter, "key" | "label" | "type" | "options">>
    sort?: DataSort[]
    actions?: Array<Pick<DataActionConfig, "id" | "label" | "description" | "variant" | "requiresConfirmation" | "fields">>
  }>
}
