import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ConfirmationCard } from "@/components/fable-ui/confirmation-card/confirmation-card"
import { FormCard } from "@/components/fable-ui/form-card/form-card"
import { MetricCard } from "@/components/fable-ui/metric-card/metric-card"
import { SuggestedActions } from "@/components/fable-ui/suggested-actions/suggested-actions"

afterEach(cleanup)

const confirmationProps = {
  id: "archive-project",
  title: "Archive project",
  description: "This hides the project from the active list.",
}

describe("ConfirmationCard accessibility states", () => {
  it("disables unavailable actions and announces loading and errors", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const view = render(<ConfirmationCard {...confirmationProps} onConfirm={onConfirm} />)

    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(false)

    view.rerender(<ConfirmationCard {...confirmationProps} isLoading onConfirm={onConfirm} onCancel={onCancel} />)

    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole("status").textContent).toContain("Preparing confirmation")

    view.rerender(
      <ConfirmationCard
        {...confirmationProps}
        error={{ title: "Unable to archive" }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole("alert").textContent).toContain("Unable to archive")

    view.rerender(<ConfirmationCard {...confirmationProps} isDisabled onConfirm={onConfirm} onCancel={onCancel} />)

    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("claims one action synchronously and excludes the other action", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(<ConfirmationCard {...confirmationProps} onConfirm={onConfirm} onCancel={onCancel} />)

    const confirm = screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement
    const cancel = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement

    fireEvent.click(confirm)
    fireEvent.click(confirm)
    fireEvent.click(cancel)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
    expect(confirm.disabled).toBe(true)
    expect(cancel.disabled).toBe(true)
  })

  it("keys claimed actions to the current confirmation id", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const view = render(<ConfirmationCard {...confirmationProps} onConfirm={onConfirm} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))

    onConfirm.mockClear()
    view.rerender(
      <ConfirmationCard
        {...confirmationProps}
        id="restore-project"
        title="Restore project"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    const confirm = screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement
    const cancel = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement

    expect(confirm.disabled).toBe(false)
    expect(cancel.disabled).toBe(false)

    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith({ id: "restore-project", label: "Confirm" })
  })
})

describe("FormCard accessibility states", () => {
  const fields = [
    { name: "name", label: "Name", type: "text" as const },
    {
      name: "plan",
      label: "Plan",
      type: "select" as const,
      options: [{ label: "Pro", value: "pro" }],
    },
    { name: "terms", label: "Accept terms", type: "toggle" as const },
  ]

  it("disables every control and exposes an unavailable status without a submit handler", () => {
    const view = render(<FormCard title="Create account" fields={fields} />)

    expect((screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByRole("combobox", { name: "Plan" }) as HTMLSelectElement).disabled).toBe(true)
    expect((screen.getByRole("checkbox", { name: "Accept terms" }) as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole("status").textContent).toContain("Form submission is unavailable")

    view.rerender(<FormCard title="Create account" fields={fields} isLoading onSubmit={vi.fn()} />)

    expect(screen.getByRole("status").textContent).toContain("Preparing form")

    view.rerender(
      <FormCard
        title="Create account"
        fields={fields}
        error={{ title: "Unable to submit" }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert").textContent).toContain("Unable to submit")
  })

  it("uses native required validation for toggles and submits the checked value", () => {
    const onSubmit = vi.fn()
    const view = render(
      <FormCard
        title="Consent"
        fields={[{ name: "terms", label: "Accept terms", type: "toggle", required: true }]}
        onSubmit={onSubmit}
      />,
    )
    const form = view.container.querySelector("form") as HTMLFormElement
    const toggle = screen.getByRole("checkbox", { name: "Accept terms" }) as HTMLInputElement

    expect(toggle.required).toBe(true)
    expect(form.checkValidity()).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(toggle)

    expect(toggle.checked).toBe(true)
    expect(form.checkValidity()).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    expect(onSubmit).toHaveBeenCalledWith({ terms: true })
  })
})

describe("SuggestedActions and MetricCard announcements", () => {
  it("uses status and alert roles for loading and errors", () => {
    const suggestedActions = render(
      <SuggestedActions title="Next steps" actions={[]} isLoading />,
    )

    expect(screen.getByRole("status").textContent).toContain("Preparing suggestions")

    suggestedActions.rerender(
      <SuggestedActions
        title="Next steps"
        actions={[]}
        error={{ title: "Suggestions unavailable" }}
      />,
    )

    expect(screen.getByRole("alert").textContent).toContain("Suggestions unavailable")

    suggestedActions.unmount()

    const metric = render(<MetricCard label="Revenue" value="$12,000" isLoading />)
    const metricCard = metric.container.querySelector('[data-fable-ui="metric-card"]') as HTMLElement

    expect(screen.getByRole("status").textContent).toContain("Loading metric")
    expect(metricCard.className).toContain("motion-reduce:transition-none")
    for (const skeleton of metric.container.querySelectorAll("[data-slot=skeleton]")) {
      expect(skeleton.className).toContain("motion-reduce:animate-none")
    }

    metric.rerender(
      <MetricCard
        label="Revenue"
        value="$12,000"
        error={{ title: "Metric unavailable" }}
      />,
    )

    expect(screen.getByRole("alert").textContent).toContain("Metric unavailable")
  })
})
