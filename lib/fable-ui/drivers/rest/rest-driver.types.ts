import type { DataSourceContext } from "@/lib/fable-ui/core"

export type RestResourceSource = {
  endpoint: string
  rowEndpoint?: (rowId: string) => string
  actionEndpoint?: (actionId: string, rowId?: string) => string
}

export type RestDriverConfig = {
  baseUrl?: string
  headers?:
    | Record<string, string>
    | ((ctx: DataSourceContext) => Promise<Record<string, string>> | Record<string, string>)
}

export type RestListResponse<Row> =
  | Row[]
  | {
      rows?: Row[]
      data?: Row[]
      totalRows?: number
      total?: number
      page?: number
      pageSize?: number
      nextCursor?: string
      previousCursor?: string
    }
