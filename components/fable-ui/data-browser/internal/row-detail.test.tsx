import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import type { DataBrowserRowAction } from "../data-browser.types"
import { RowDetail } from "./row-detail"

afterEach(cleanup)

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn()
})

const row = { id: "row-1", name: "Ada" }

function renderDetail(
  action: DataBrowserRowAction<typeof row>,
  onRunAction = vi.fn(),
  actionError?: string
) {
  render(
    <RowDetail
      row={row}
      columns={[]}
      actions={[action]}
      actionError={actionError}
      onRunAction={onRunAction}
    />
  )

  return onRunAction
}

async function chooseOption(label: string, option: string) {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: new RegExp(`^${label}`) }),
    {
      key: "ArrowDown",
    }
  )
  fireEvent.click(await screen.findByRole("option", { name: option }))
}

describe("RowDetail actions", () => {
  it("renders typed fields, links required errors, and preserves action values", async () => {
    const action: DataBrowserRowAction<typeof row> = {
      id: "update",
      label: "Update",
      fields: [
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "emptyLimit", label: "Empty limit", type: "number" },
        { name: "reason", label: "Reason", type: "textarea" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Active", value: "active" },
            { label: "Priority 2", value: 2 },
            { label: "Enabled", value: true },
          ],
        },
        { name: "enabled", label: "Enabled flag", type: "toggle" },
        { name: "scheduledFor", label: "Scheduled for", type: "date" },
      ],
    }
    const onRunAction = renderDetail(action)

    fireEvent.click(screen.getByRole("button", { name: "Update" }))

    const amount = screen.getByLabelText(/^Amount/) as HTMLInputElement
    const errorId = amount.getAttribute("aria-describedby")

    expect(onRunAction).not.toHaveBeenCalled()
    expect(amount.getAttribute("aria-invalid")).toBe("true")
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId ?? "")?.textContent).toBe(
      "Amount is required."
    )

    fireEvent.change(amount, { target: { value: "42" } })
    fireEvent.change(screen.getByLabelText(/^Empty limit/), {
      target: { value: "8" },
    })
    fireEvent.change(screen.getByLabelText(/^Empty limit/), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByLabelText(/^Reason/), {
      target: { value: "Approved" },
    })
    fireEvent.click(screen.getByLabelText(/^Enabled flag/))
    fireEvent.change(screen.getByLabelText(/^Scheduled for/), {
      target: { value: "2026-08-11" },
    })

    await chooseOption("Status", "Priority 2")
    fireEvent.click(screen.getByRole("button", { name: "Update" }))

    expect(onRunAction).toHaveBeenLastCalledWith(action, row, {
      amount: 42,
      emptyLimit: "",
      reason: "Approved",
      status: 2,
      enabled: true,
      scheduledFor: "2026-08-11",
    })

    await chooseOption("Status", "Enabled")
    fireEvent.click(screen.getByRole("button", { name: "Update" }))
    expect(onRunAction).toHaveBeenLastCalledWith(
      action,
      row,
      expect.objectContaining({ status: true })
    )

    await chooseOption("Status", "Active")
    fireEvent.click(screen.getByRole("button", { name: "Update" }))
    expect(onRunAction).toHaveBeenLastCalledWith(
      action,
      row,
      expect.objectContaining({ status: "active" })
    )
  })

  it("opens one confirmation dialog and only executes after confirming", () => {
    const action: DataBrowserRowAction<typeof row> = {
      id: "delete",
      label: "Delete",
      requiresConfirmation: true,
      variant: "destructive",
      fields: [
        { name: "reason", label: "Reason", type: "text", required: true },
      ],
    }
    const onRunAction = renderDetail(action)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(onRunAction).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).toBeNull()

    fireEvent.change(screen.getByLabelText(/^Reason/), {
      target: { value: "Duplicate" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.getByRole("dialog").textContent).toContain("Confirm Delete")

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(onRunAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }))

    expect(onRunAction).toHaveBeenCalledWith(action, row, {
      reason: "Duplicate",
    })
  })

  it("disables every action form while another action is pending", () => {
    const runningAction: DataBrowserRowAction<typeof row> = {
      id: "",
      label: "Archive",
    }
    const blockedAction: DataBrowserRowAction<typeof row> = {
      id: "restore",
      label: "Restore",
    }

    render(
      <RowDetail
        row={row}
        columns={[]}
        actions={[runningAction, blockedAction]}
        pendingActionId={runningAction.id}
        onRunAction={vi.fn()}
      />
    )

    const runningForm = screen.getByRole("form", { name: "Archive action" })
    const blockedForm = screen.getByRole("form", { name: "Restore action" })

    expect((runningForm.querySelector("fieldset") as HTMLFieldSetElement).disabled).toBe(true)
    expect((blockedForm.querySelector("fieldset") as HTMLFieldSetElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Running..." }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Restore" }) as HTMLButtonElement).disabled).toBe(true)
    expect(runningForm.getAttribute("aria-busy")).toBe("true")
    expect(blockedForm.getAttribute("aria-busy")).toBeNull()
  })

  it("announces action execution errors", () => {
    const action: DataBrowserRowAction<typeof row> = {
      id: "update",
      label: "Update",
    }

    renderDetail(action, vi.fn(), "Unable to update this row.")

    expect(screen.getByRole("alert").textContent).toBe(
      "Unable to update this row."
    )
  })
})
