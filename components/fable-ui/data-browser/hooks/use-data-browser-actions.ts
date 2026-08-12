import * as React from "react"

import { getDataBrowserRowId } from "../lib/get-row-id"
import type { DataBrowserRowAction } from "../data-browser.types"
import {
  useOptionalFableDataContext,
  fableRegistry,
  type DataActionResult,
  type DataRow,
} from "@/lib/fable-ui/core"

function isDataActionResult(result: unknown): result is DataActionResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    typeof result.ok === "boolean"
  )
}

export function useDataBrowserActions<Row extends DataRow>({
  resourceId,
  onRowAction,
  onRowActionSuccess,
  refetch,
}: {
  resourceId?: string
  onRowAction?: (
    action: DataBrowserRowAction<Row>,
    row: Row,
    values?: Record<string, unknown>
  ) => Promise<unknown> | unknown
  onRowActionSuccess?: (
    result: unknown,
    action: DataBrowserRowAction<Row>,
    row: Row
  ) => void
  refetch?: () => void
}) {
  const dataContext = useOptionalFableDataContext()
  const registry = dataContext?.registry ?? fableRegistry
  const context = dataContext?.context
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null
  )
  const pendingActionRef = React.useRef<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const runAction = React.useCallback(
    async (
      action: DataBrowserRowAction<Row>,
      row: Row,
      values?: Record<string, unknown>
    ) => {
      if (pendingActionRef.current !== null) {
        return undefined
      }

      pendingActionRef.current = action.id
      setError(null)
      setPendingActionId(action.id)

      try {
        const result = action.run
          ? await action.run(row, values)
          : onRowAction
            ? await onRowAction(action, row, values)
            : resourceId
              ? await registry.executeAction(
                  {
                    actionId: action.id,
                    resourceId,
                    rowId: getDataBrowserRowId(row),
                    values,
                  },
                  context ?? {}
                )
              : undefined

        if (isDataActionResult(result)) {
          if (!result.ok) {
            setError(result.message || "The action failed.")
            return result
          }

          onRowActionSuccess?.(result, action, row)

          if (result.invalidate) {
            refetch?.()
          }

          return result
        }

        onRowActionSuccess?.(result, action, row)
        refetch?.()
        return result
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : "The action failed."
        setError(message)
        return undefined
      } finally {
        if (pendingActionRef.current === action.id) {
          pendingActionRef.current = null
          setPendingActionId((current) =>
            current === action.id ? null : current
          )
        }
      }
    },
    [context, onRowAction, onRowActionSuccess, refetch, registry, resourceId]
  )

  return {
    runAction,
    pendingActionId,
    actionError: error,
  }
}
