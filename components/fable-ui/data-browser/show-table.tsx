import type { DataColumn, DataRow } from "@/lib/fable-ui/core"
import { DataBrowser } from "./data-browser"

export function ShowTable({
  title,
  description,
  columns,
  rows,
  pageSize = 8,
  isLoading,
  isDisabled,
  error,
}: {
  title: string
  description?: string
  columns: DataColumn[]
  rows: DataRow[]
  pageSize?: number
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
}) {
  return (
    <DataBrowser
      title={title}
      description={description}
      entityLabel="rows"
      columns={columns}
      rows={rows}
      pageSize={pageSize}
      isLoading={isLoading}
      isDisabled={isDisabled}
      error={error}
      searchPlaceholder="Search rows"
    />
  )
}
