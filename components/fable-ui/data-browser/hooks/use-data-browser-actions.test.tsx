import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { DataBrowserRowAction } from "../data-browser.types"
import { useDataBrowserActions } from "./use-data-browser-actions"

afterEach(cleanup)

const row = { id: "row-1", name: "Ada" }
const action: DataBrowserRowAction<typeof row> = {
  id: "archive",
  label: "Archive",
}

function renderActions(result: unknown) {
  const onRowAction = vi.fn(() => result)
  const onRowActionSuccess = vi.fn()
  const refetch = vi.fn()
  const hook = renderHook(() =>
    useDataBrowserActions({
      onRowAction,
      onRowActionSuccess,
      refetch,
    })
  )

  return { ...hook, onRowAction, onRowActionSuccess, refetch }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

describe("useDataBrowserActions", () => {
  it("exposes a failed action message and skips success and refetch", async () => {
    const hook = renderActions({ ok: false, message: "Not allowed" })

    await act(async () => {
      await hook.result.current.runAction(action, row)
    })

    expect(hook.result.current.actionError).toBe("Not allowed")
    expect(hook.onRowActionSuccess).not.toHaveBeenCalled()
    expect(hook.refetch).not.toHaveBeenCalled()
  })

  it("uses the fallback message for a failed action without one", async () => {
    const hook = renderActions({ ok: false })

    await act(async () => {
      await hook.result.current.runAction(action, row)
    })

    expect(hook.result.current.actionError).toBe("The action failed.")
    expect(hook.onRowActionSuccess).not.toHaveBeenCalled()
    expect(hook.refetch).not.toHaveBeenCalled()
  })

  it("only refetches successful DataActionResults that request invalidation", async () => {
    const withoutInvalidation = renderActions({ ok: true })

    await act(async () => {
      await withoutInvalidation.result.current.runAction(action, row)
    })

    expect(withoutInvalidation.onRowActionSuccess).toHaveBeenCalledWith(
      { ok: true },
      action,
      row
    )
    expect(withoutInvalidation.refetch).not.toHaveBeenCalled()

    const withInvalidation = renderActions({ ok: true, invalidate: true })

    await act(async () => {
      await withInvalidation.result.current.runAction(action, row)
    })

    expect(withInvalidation.onRowActionSuccess).toHaveBeenCalledTimes(1)
    expect(withInvalidation.refetch).toHaveBeenCalledTimes(1)
  })

  it("preserves legacy action success and refetch behavior", async () => {
    const legacyResult = { archived: true }
    const hook = renderActions(legacyResult)

    await act(async () => {
      await hook.result.current.runAction(action, row)
    })

    expect(hook.onRowActionSuccess).toHaveBeenCalledWith(
      legacyResult,
      action,
      row
    )
    expect(hook.refetch).toHaveBeenCalledTimes(1)
  })

  it("does not overlap actions while the owning action is pending", async () => {
    const deferred = createDeferred<unknown>()
    const firstAction: DataBrowserRowAction<typeof row> = {
      id: "",
      label: "Archive",
    }
    const secondAction: DataBrowserRowAction<typeof row> = {
      id: "restore",
      label: "Restore",
    }
    const onRowAction = vi.fn(
      (nextAction: DataBrowserRowAction<typeof row>) =>
        nextAction.id === firstAction.id
          ? deferred.promise
          : { restored: true }
    )
    const hook = renderHook(() => useDataBrowserActions({ onRowAction }))
    let firstRun!: Promise<unknown>

    act(() => {
      firstRun = hook.result.current.runAction(firstAction, row)
    })

    expect(hook.result.current.pendingActionId).toBe(firstAction.id)
    expect(onRowAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      await hook.result.current.runAction(secondAction, row)
    })

    expect(onRowAction).toHaveBeenCalledTimes(1)
    expect(hook.result.current.pendingActionId).toBe(firstAction.id)

    await act(async () => {
      deferred.resolve({ archived: true })
      await firstRun
    })

    expect(hook.result.current.pendingActionId).toBeNull()

    await act(async () => {
      await hook.result.current.runAction(secondAction, row)
    })

    expect(onRowAction).toHaveBeenCalledTimes(2)
    expect(hook.result.current.pendingActionId).toBeNull()
  })
})
