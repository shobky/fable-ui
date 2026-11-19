import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FableRenderer } from "../renderer"

let resize: () => void
const observe = vi.fn()
const disconnect = vi.fn()

beforeEach(() => {
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback }
    observe = observe
    disconnect = disconnect
    unobserve() {}
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("table scroll access", () => {
  it.each(["Comparison", undefined])("only adds a named keyboard stop and horizontal hint when needed (%s)", (title) => {
    const { unmount } = render(
      <FableRenderer spec={{ blocks: [{
        type: "table", title, sortable: false, downloadable: false,
        columns: [{ key: "name", label: "Name" }, { key: "notes", label: "Notes" }],
        rows: [{ name: "Northwind", notes: "A long comparison value" }],
      }] }} />
    )
    const table = screen.getByRole("table")
    const scroller = table.parentElement!
    expect(observe).toHaveBeenCalledWith(scroller)
    expect(observe).toHaveBeenCalledWith(table)
    expect(scroller.getAttribute("tabindex")).toBeNull()
    expect(screen.queryByText(/Scroll horizontally/)).toBeNull()

    Object.defineProperties(scroller, {
      clientWidth: { configurable: true, value: 258 },
      scrollWidth: { configurable: true, value: 626 },
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 100 },
    })
    act(() => resize())
    const region = screen.getByRole("region", { name: `${title ?? "Table"} scroll area` })
    expect(region.tabIndex).toBe(0)
    region.focus()
    expect(document.activeElement).toBe(region)
    const hint = screen.getByText(/Scroll horizontally/)
    expect(region.getAttribute("aria-describedby")).toBe(hint.id)

    // A wider host removes the now-unnecessary stop and hint.
    Object.defineProperty(scroller, "clientWidth", { configurable: true, value: 1280 })
    act(() => resize())
    expect(scroller.getAttribute("tabindex")).toBeNull()
    expect(scroller.getAttribute("role")).toBeNull()
    expect(scroller.getAttribute("aria-describedby")).toBeNull()
    expect(screen.queryByText(/Scroll horizontally/)).toBeNull()

    // The max-height scroller remains reachable if only rows overflow.
    Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 900 })
    act(() => resize())
    expect(screen.getByRole("region", { name: `${title ?? "Table"} scroll area` }).tabIndex).toBe(0)
    expect(screen.queryByText(/Scroll horizontally/)).toBeNull()
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})

describe("gallery navigation", () => {
  it.each([
    { reducedMotion: false, direction: "ltr" },
    { reducedMotion: true, direction: "ltr" },
    { reducedMotion: false, direction: "rtl" },
    { reducedMotion: true, direction: "rtl" },
  ])("respects motion preference and direction: $reducedMotion / $direction", ({ reducedMotion, direction }) => {
    let prefersReducedMotion = reducedMotion
    const matchMedia = vi.fn(() => ({ matches: prefersReducedMotion }))
    vi.stubGlobal("matchMedia", matchMedia)
    const { container } = render(
      <FableRenderer spec={{ blocks: [{
        type: "gallery", layout: "carousel",
        images: ["One", "Two", "Three"].map((alt) => ({ alt, src: `https://example.com/${alt}.png` })),
      }] }} />
    )
    const track = container.querySelector<HTMLElement>(".overflow-x-auto")!
    track.style.direction = direction
    Object.defineProperty(track, "clientWidth", { value: 400 })
    const scrollBy = vi.fn()
    track.scrollBy = scrollBy
    const sign = direction === "rtl" ? -1 : 1
    fireEvent.click(screen.getByRole("button", { name: "Scroll forward" }))
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)")
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 320 * sign, behavior: reducedMotion ? "auto" : "smooth" })
    fireEvent.click(screen.getByRole("button", { name: "Scroll back" }))
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -320 * sign, behavior: reducedMotion ? "auto" : "smooth" })

    // Read the live preference at activation, including changes after mount.
    prefersReducedMotion = !reducedMotion
    fireEvent.click(screen.getByRole("button", { name: "Scroll forward" }))
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 320 * sign, behavior: prefersReducedMotion ? "auto" : "smooth" })
  })
})
