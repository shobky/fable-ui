import * as React from "react"

import { formatDataCell, type DataColumn, type DataRow } from "@/lib/fable-ui/core"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DataBrowserDetail, DataBrowserRowAction } from "../data-browser.types"

function getSelectValueToken(
  value: unknown,
  options: NonNullable<DataBrowserRowAction["fields"]>[number]["options"]
) {
  const index =
    options?.findIndex((option) => Object.is(option.value, value)) ?? -1

  return index >= 0 ? String(index) : ""
}

function isRequiredValueMissing(
  field: NonNullable<DataBrowserRowAction["fields"]>[number],
  value: unknown
) {
  if (field.type === "toggle") {
    return value !== true
  }

  return (
    value == null ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  )
}

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
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, Record<string, string>>
  >({})
  const [confirmationActionId, setConfirmationActionId] = React.useState<
    string | null
  >(null)
  const idPrefix = React.useId()
  const resolvedPendingActionId = pendingActionId ?? null

  function setActionValue(actionId: string, fieldName: string, value: unknown) {
    setActionValues((current) => ({
      ...current,
      [actionId]: {
        ...current[actionId],
        [fieldName]: value,
      },
    }))
    setFieldErrors((current) => {
      const actionFieldErrors = current[actionId]

      if (!actionFieldErrors?.[fieldName]) {
        return current
      }

      const remainingErrors = { ...actionFieldErrors }
      delete remainingErrors[fieldName]

      return {
        ...current,
        [actionId]: remainingErrors,
      }
    })
  }

  function validateAction(action: DataBrowserRowAction<Row>) {
    const values = actionValues[action.id] ?? {}
    const nextErrors: Record<string, string> = {}

    for (const field of action.fields ?? []) {
      if (field.required && isRequiredValueMissing(field, values[field.name])) {
        nextErrors[field.name] = `${field.label} is required.`
      }
    }

    setFieldErrors((current) => ({
      ...current,
      [action.id]: nextErrors,
    }))

    return Object.keys(nextErrors).length === 0
  }

  function submitAction(
    event: React.FormEvent<HTMLFormElement>,
    action: DataBrowserRowAction<Row>
  ) {
    event.preventDefault()

    if (resolvedPendingActionId !== null || !validateAction(action)) {
      return
    }

    if (action.requiresConfirmation) {
      setConfirmationActionId(action.id)
      return
    }

    onRunAction(action, row, actionValues[action.id] ?? {})
  }

  const confirmationAction = confirmationActionId
    ? actions.find((action) => action.id === confirmationActionId)
    : undefined

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
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {actions.map((action) => {
            const values = actionValues[action.id] ?? {}
            const actionFieldErrors = fieldErrors[action.id] ?? {}
            const isPending = resolvedPendingActionId === action.id
            const hasPendingAction = resolvedPendingActionId !== null

            return (
              <div key={action.id} className="rounded-md border p-3">
                <form
                  className="flex flex-col gap-3"
                  aria-label={`${action.label} action`}
                  aria-busy={isPending || undefined}
                  onSubmit={(event) => submitAction(event, action)}
                >
                  <p className="text-sm font-medium">{action.label}</p>
                  {action.description ? (
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  ) : null}
                  <fieldset
                    disabled={hasPendingAction}
                    className="flex min-w-0 flex-col gap-3 border-0 p-0"
                  >
                    {action.fields?.map((field) => {
                      const controlId = `${idPrefix}-${action.id}-${field.name}`
                      const labelId = `${controlId}-label`
                      const errorId = `${controlId}-error`
                      const fieldError = actionFieldErrors[field.name]
                      const fieldValue = values[field.name]

                      return (
                        <div
                          key={field.name}
                          className="flex flex-col gap-1"
                          data-invalid={fieldError ? true : undefined}
                        >
                          {field.type === "toggle" ? (
                            <label
                              className="flex items-center gap-2 text-xs font-medium"
                              htmlFor={controlId}
                            >
                              <input
                                id={controlId}
                                type="checkbox"
                                className="size-4"
                                checked={fieldValue === true}
                                aria-invalid={fieldError ? true : undefined}
                                aria-describedby={
                                  fieldError ? errorId : undefined
                                }
                                aria-required={field.required || undefined}
                                onChange={(event) =>
                                  setActionValue(
                                    action.id,
                                    field.name,
                                    event.target.checked
                                  )
                                }
                              />
                              <span>
                                {field.label}
                                {field.required ? (
                                  <span aria-hidden="true"> *</span>
                                ) : null}
                              </span>
                            </label>
                          ) : (
                            <>
                              <label
                                id={labelId}
                                htmlFor={controlId}
                                className="text-xs font-medium"
                              >
                                {field.label}
                                {field.required ? (
                                  <span aria-hidden="true"> *</span>
                                ) : null}
                              </label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  id={controlId}
                                  value={
                                    typeof fieldValue === "string"
                                      ? fieldValue
                                      : ""
                                  }
                                  aria-invalid={fieldError ? true : undefined}
                                  aria-describedby={
                                    fieldError ? errorId : undefined
                                  }
                                  aria-required={field.required || undefined}
                                  onChange={(event) =>
                                    setActionValue(
                                      action.id,
                                      field.name,
                                      event.target.value
                                    )
                                  }
                                />
                              ) : field.type === "select" ? (
                                <Select
                                  value={getSelectValueToken(
                                    fieldValue,
                                    field.options
                                  )}
                                  disabled={hasPendingAction}
                                  onValueChange={(token) => {
                                    const option =
                                      field.options?.[Number(token)]

                                    if (option) {
                                      setActionValue(
                                        action.id,
                                        field.name,
                                        option.value
                                      )
                                    }
                                  }}
                                >
                                  <SelectTrigger
                                    id={controlId}
                                    className="w-full"
                                    aria-labelledby={labelId}
                                    aria-invalid={fieldError ? true : undefined}
                                    aria-describedby={
                                      fieldError ? errorId : undefined
                                    }
                                    aria-required={field.required || undefined}
                                  >
                                    <SelectValue placeholder={field.label} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {field.options?.map((option, index) => (
                                        <SelectItem
                                          key={`${option.label}-${index}`}
                                          value={String(index)}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id={controlId}
                                  type={
                                    field.type === "number"
                                      ? "number"
                                      : field.type === "date"
                                        ? "date"
                                        : "text"
                                  }
                                  step={
                                    field.type === "number" ? "any" : undefined
                                  }
                                  value={
                                    field.type === "number"
                                      ? typeof fieldValue === "number"
                                        ? String(fieldValue)
                                        : fieldValue === ""
                                          ? ""
                                          : ""
                                      : typeof fieldValue === "string"
                                        ? fieldValue
                                        : ""
                                  }
                                  aria-invalid={fieldError ? true : undefined}
                                  aria-describedby={
                                    fieldError ? errorId : undefined
                                  }
                                  aria-required={field.required || undefined}
                                  onChange={(event) => {
                                    const value = event.target.value

                                    setActionValue(
                                      action.id,
                                      field.name,
                                      field.type === "number" && value !== ""
                                        ? Number(value)
                                        : value
                                    )
                                  }}
                                />
                              )}
                            </>
                          )}
                          {fieldError ? (
                            <p
                              id={errorId}
                              className="text-xs text-destructive"
                            >
                              {fieldError}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                    <Button
                      type="submit"
                      disabled={hasPendingAction}
                      variant={
                        action.variant === "destructive"
                          ? "destructive"
                          : "default"
                      }
                      size="sm"
                    >
                      {isPending ? "Running..." : action.label}
                    </Button>
                  </fieldset>
                </form>
              </div>
            )
          })}
        </div>
      ) : null}
      <Dialog
        open={Boolean(confirmationAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmationActionId(null)
          }
        }}
      >
        {confirmationAction ? (
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Confirm {confirmationAction.label}</DialogTitle>
              <DialogDescription>
                Are you sure you want to run {confirmationAction.label} for this
                row?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={resolvedPendingActionId !== null}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant={
                  confirmationAction.variant === "destructive"
                    ? "destructive"
                    : "default"
                }
                disabled={resolvedPendingActionId !== null}
                onClick={() => {
                  if (resolvedPendingActionId !== null) {
                    return
                  }

                  setConfirmationActionId(null)
                  onRunAction(
                    confirmationAction,
                    row,
                    actionValues[confirmationAction.id] ?? {}
                  )
                }}
              >
                Confirm {confirmationAction.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
