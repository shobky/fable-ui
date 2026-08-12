import {
  formatDataCell,
  type DataColumn,
  type DataRow,
} from "@/lib/fable-ui/core"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CellAvatar, isAvatarFieldKey } from "../lib/cell-avatar"
import { getDataBrowserRowId } from "../lib/get-row-id"

function getColumnMinWidth(column: DataColumn, isFirstColumn: boolean) {
  if (typeof column.width === "number") {
    return column.width
  }

  if (typeof column.width === "string") {
    const parsed = column.width.endsWith("px")
      ? Number.parseInt(column.width, 10)
      : Number.NaN
    return Number.isFinite(parsed) ? parsed : 160
  }

  if (isFirstColumn) {
    return 220
  }

  if (column.type === "currency" || column.type === "number") {
    return 132
  }

  if (column.type === "date") {
    return 140
  }

  if (column.type === "datetime") {
    return 180
  }

  if (column.type === "boolean" || column.type === "badge") {
    return 120
  }

  return Math.max(144, Math.min(260, column.label.length * 12 + 72))
}

function getColumnWidth(column: DataColumn, minWidth: number) {
  if (typeof column.width === "number") {
    return `${column.width}px`
  }

  return column.width ?? `${minWidth}px`
}

function getAlignClass(align: DataColumn["align"]) {
  if (align === "right") {
    return "text-end"
  }

  if (align === "center") {
    return "text-center"
  }

  return "text-start"
}

export function TableView<Row extends DataRow>({
  columns,
  rows,
  entityLabel,
  isDisabled,
  onViewRow,
}: {
  columns: DataColumn[]
  rows: Row[]
  entityLabel: string
  isDisabled?: boolean
  onViewRow?: (row: Row) => void
}) {
  const visibleColumns = columns.filter((column) => !column.hidden)
  const columnWidths = visibleColumns.map((column, index) =>
    getColumnMinWidth(column, index === 0)
  )
  const actionColumnWidth = onViewRow ? 112 : 0
  const tableMinWidth = Math.max(
    visibleColumns.length
      ? columnWidths.reduce((total, width) => total + width, actionColumnWidth)
      : 320,
    640
  )
  const colSpan = Math.max(1, visibleColumns.length + (onViewRow ? 1 : 0))

  return (
    <div
      className="min-h-0 overflow-auto rounded-md border scrollbar-pretty max-h-[min(60vh,36rem)]"
      role="region"
      tabIndex={0}
      aria-label={`${entityLabel} table`}
    >
      <table
        className="w-full table-auto text-sm"
        style={{ minWidth: tableMinWidth }}
      >
        <thead className="bg-muted/60">
          <tr>
            {visibleColumns.map((column, index) => (
              <th
                key={column.key}
                className={cn(
                  "px-3 py-2 font-medium whitespace-nowrap",
                  getAlignClass(column.align)
                )}
                data-align={column.align ?? "left"}
                style={{
                  minWidth: columnWidths[index],
                  width: getColumnWidth(column, columnWidths[index]),
                }}
              >
                {column.label}
              </th>
            ))}
            {onViewRow ? (
              <th className="w-28 px-3 py-2 text-end font-medium">View</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-3 py-8 text-center text-muted-foreground"
                colSpan={colSpan}
              >
                No {entityLabel} to display.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getDataBrowserRowId(row, index)} className="border-t">
                {visibleColumns.map((column, columnIndex) => {
                  const rowId = getDataBrowserRowId(row, index)
                  const formattedValue = formatDataCell(row, column)
                  const cellValue =
                    columnIndex === 0 && isAvatarFieldKey(column.key)
                      ? ""
                      : formattedValue

                  return (
                    <td
                      key={`${rowId}-${column.key}`}
                      className={cn(
                        "px-3 py-2 align-middle",
                        getAlignClass(column.align)
                      )}
                      style={{
                        minWidth: columnWidths[columnIndex],
                        width: getColumnWidth(
                          column,
                          columnWidths[columnIndex]
                        ),
                      }}
                    >
                      {columnIndex === 0 ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <CellAvatar row={row} />
                          <span className="min-w-0 truncate" title={cellValue || undefined}>
                            {cellValue}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="block min-w-0 truncate"
                          title={formattedValue || undefined}
                        >
                          {formattedValue}
                        </span>
                      )}
                    </td>
                  )
                })}
                {onViewRow ? (
                  <td className="px-3 py-2 text-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDisabled}
                      onClick={() => onViewRow(row)}
                    >
                      View
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
