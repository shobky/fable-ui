import { formatDataCell, type DataColumn, type DataRow } from "@/lib/fable-ui/core"
import { Button } from "@/components/ui/button"
import { getDataBrowserRowId } from "../lib/get-row-id"

export function TableView<Row extends DataRow>({
  columns,
  rows,
  entityLabel,
  isDisabled,
  onOpenRow,
}: {
  columns: DataColumn[]
  rows: Row[]
  entityLabel: string
  isDisabled?: boolean
  onOpenRow?: (row: Row) => void
}) {
  const visibleColumns = columns.filter((column) => !column.hidden)

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-muted/60">
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className="px-3 py-2 text-left font-medium"
                data-align={column.align ?? "left"}
              >
                {column.label}
              </th>
            ))}
            {onOpenRow ? <th className="w-28 px-3 py-2 text-right font-medium">Detail</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-muted-foreground" colSpan={visibleColumns.length + 1}>
                No {entityLabel} to display.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getDataBrowserRowId(row, index)} className="border-t">
                {visibleColumns.map((column) => (
                  <td
                    key={`${getDataBrowserRowId(row, index)}-${column.key}`}
                    className="truncate px-3 py-2"
                  >
                    {formatDataCell(row, column)}
                  </td>
                ))}
                {onOpenRow ? (
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDisabled}
                      onClick={() => onOpenRow(row)}
                    >
                      Open
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
