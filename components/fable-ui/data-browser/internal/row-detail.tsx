import * as React from "react"

import { formatDataCell, type DataColumn, type DataRow } from "@/lib/fable-ui/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DataBrowserDetail, DataBrowserRowAction } from "../data-browser.types"

export function RowDetail<Row extends DataRow>({
  row,
  columns,
  detail,
  actions,
  actionError,
  pendingActionId,
  renderDetail,
  onRunAction,
}: {
  row: Row
  columns: DataColumn[]
  detail?: DataBrowserDetail<Row>
  actions: DataBrowserRowAction<Row>[]
  actionError?: string | null
  pendingActionId?: string | null
  renderDetail?: (row: Row) => React.ReactNode
  onRunAction: (action: DataBrowserRowAction<Row>, row: Row, values?: Record<string, unknown>) => void
}) {
  const [actionValues, setActionValues] = React.useState<Record<string, Record<string, unknown>>>({})

  if (renderDetail) {
    return <>{renderDetail(row)}</>
  }

  const detailFields = new Set(detail?.fields ?? [])
  const visibleColumns = columns.filter(
    (column) =>
      !column.hidden &&
      (detailFields.size === 0 || detailFields.has(column.key))
  )

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        {visibleColumns.map((column) => {
          const formattedValue = formatDataCell(row, column)

          return (
            <div key={column.key} className="rounded-md border bg-muted/30 p-3">
              <dt className="text-xs font-medium text-muted-foreground">{column.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium leading-6">
                {formattedValue === "" ? "-" : formattedValue}
              </dd>
            </div>
          )
        })}
      </dl>
      {actionError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {actions.map((action) => {
            const values = actionValues[action.id] ?? {}

            return (
              <div key={action.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{action.label}</p>
                  {action.description ? (
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  ) : null}
                  {action.fields?.map((field) => (
                    <label key={field.name} className="flex flex-col gap-1 text-xs font-medium">
                      {field.label}
                      <Input
                        value={String(values[field.name] ?? "")}
                        onChange={(event) =>
                          setActionValues((current) => ({
                            ...current,
                            [action.id]: {
                              ...values,
                              [field.name]: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant={action.variant === "destructive" ? "destructive" : "default"}
                    size="sm"
                    disabled={pendingActionId === action.id}
                    onClick={() => onRunAction(action, row, values)}
                  >
                    {pendingActionId === action.id ? "Running..." : action.label}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
