import { getRowId as getCoreRowId, type DataRow } from "@/lib/fable-ui/core"

export function getDataBrowserRowId(row: DataRow, index = 0) {
  return getCoreRowId(row) ?? String(index)
}
