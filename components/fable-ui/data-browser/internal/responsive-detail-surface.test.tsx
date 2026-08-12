import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ResponsiveDetailSurface } from "./responsive-detail-surface"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("ResponsiveDetailSurface mobile close action", () => {
  it("renders a visible Close button in the mobile drawer", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(max-width: 767px)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    )
    const onClose = vi.fn()

    render(
      <ResponsiveDetailSurface
        row={{ id: "customer-1", name: "Ada" }}
        title="Customer detail"
        columns={[{ key: "name", label: "Name" }]}
        actions={[]}
        onClose={onClose}
        onRunAction={vi.fn()}
      />
    )

    const close = await screen.findByRole("button", { name: "Close" })

    expect(close.textContent).toBe("Close")
    fireEvent.click(close)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
