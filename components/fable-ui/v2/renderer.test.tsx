import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { demoData, demoSpec } from "../../../app/(app)/v2/playground/fixture"
import { FableSpecRenderer } from "./renderer"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("Fable UI v2 renderer", () => {
  it("renders a composed response and filters host-owned entities locally", () => {
    render(<FableSpecRenderer spec={demoSpec} data={demoData} />)

    expect(screen.getByRole("heading", { name: /coral house leads direct bookings/i })).toBeTruthy()
    expect(screen.getByText("Direct bookings · 30 days")).toBeTruthy()
    expect(screen.getByText("Filter properties by destination")).toBeTruthy()
    expect(screen.getByText("2,194")).toBeTruthy()
    expect(screen.getByText("Blue Dune Studio")).toBeTruthy()
    expect(screen.getByText("Cedar Town Hotel")).toBeTruthy()
    expect(screen.getAllByText("Direct bookings").length).toBeGreaterThan(0)
    expect(screen.getByRole("img", { name: "Direct bookings by week" })).toBeTruthy()
    expect(screen.getByText("691", { exact: true })).toBeTruthy()
    expect(screen.getByText("345.5", { exact: true })).toBeTruthy()

    fireEvent.change(screen.getByRole("combobox", { name: "Filter properties by destination" }), {
      target: { value: "cairo" },
    })

    expect(screen.queryByText("Coral House")).toBeNull()
    expect(screen.getByText("Cedar Town Hotel")).toBeTruthy()
  })

  it("preserves the local filter selection when the same view receives an update", () => {
    const { rerender } = render(<FableSpecRenderer spec={demoSpec} data={demoData} />)
    const filter = screen.getByRole("combobox", { name: "Filter properties by destination" })
    fireEvent.change(filter, { target: { value: "dahab" } })
    expect(screen.getByText("Blue Dune Studio")).toBeTruthy()
    expect(screen.queryByText("Cedar Town Hotel")).toBeNull()

    const updatedSpec = structuredClone(demoSpec) as unknown as {
      root: string
      elements: Record<string, { type: string; props: Record<string, unknown>; children: string[] }>
    }
    updatedSpec.elements.headline.props.content = "Coral House remains ahead."
    rerender(<FableSpecRenderer spec={updatedSpec} data={demoData} />)

    expect((screen.getByRole("combobox", { name: "Filter properties by destination" }) as HTMLSelectElement).value).toBe("dahab")
    expect(screen.getByText("Coral House remains ahead.")).toBeTruthy()
    expect(screen.queryByText("Cedar Town Hotel")).toBeNull()
  })

  it("preserves the focused filter when its stable stack changes direction", () => {
    const { rerender } = render(<FableSpecRenderer spec={demoSpec} data={demoData} />)
    const filter = screen.getByRole("combobox", {
      name: "Filter properties by destination",
    }) as HTMLSelectElement
    fireEvent.change(filter, { target: { value: "cairo" } })
    filter.focus()

    const updatedSpec = structuredClone(demoSpec) as unknown as {
      root: string
      elements: Record<string, { type: string; props: Record<string, unknown>; children: string[] }>
    }
    updatedSpec.elements.response.props.direction = "horizontal"
    rerender(<FableSpecRenderer spec={updatedSpec} data={demoData} />)

    const updatedFilter = screen.getByRole("combobox", {
      name: "Filter properties by destination",
    }) as HTMLSelectElement
    expect(updatedFilter).toBe(filter)
    expect(document.activeElement).toBe(filter)
    expect(updatedFilter.value).toBe("cairo")
  })

  it("fails closed on invalid specs or missing host result IDs without fetching", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const invalidSpec = structuredClone(demoSpec) as unknown as {
      root: string
      elements: Record<string, { type: string; props: Record<string, unknown>; children: string[] }>
    }
    invalidSpec.elements.headline.props.style = { color: "red" }
    const invalidRender = render(<FableSpecRenderer spec={invalidSpec} data={demoData} />)
    expect(screen.getByText("This response layout could not be displayed safely.")).toBeTruthy()
    invalidRender.unmount()

    const missingDataSpec = structuredClone(demoSpec) as unknown as {
      root: string
      elements: Record<string, { type: string; props: Record<string, unknown>; children: string[] }>
    }
    missingDataSpec.elements.metric.props.resultId = "not-authorized"
    render(<FableSpecRenderer spec={missingDataSpec} data={demoData} />)
    expect(screen.getByText("Metric data is unavailable.")).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
