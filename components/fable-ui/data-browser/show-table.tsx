import type { DataColumn, DataRow } from "@/lib/fable-ui/core"
import { DataBrowser } from "./data-browser"

export function ShowTable({
  title,
  description,
  columns,
  rows,
  isLoading,
  isDisabled,
  error,
}: {
  title: string
  description?: string
  columns: DataColumn[]
  rows: DataRow[]
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
      pageSize={Math.max(rows.length, 10)}
      isLoading={isLoading}
      isDisabled={isDisabled}
      error={error}
      searchPlaceholder="Search rows"
    />
  )
}
