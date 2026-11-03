import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BLOCK_EXAMPLES, LAYOUT_EXAMPLES } from "@/lib/block-examples"

import { FableProvider } from "./provider"
import { FableRenderer } from "./renderer"

beforeAll(() => {
  // jsdom lacks these; recharts and radix expect them.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

describe("FableRenderer", () => {
  it("renders every block example", () => {
    const spec = { blocks: [...Object.values(BLOCK_EXAMPLES), ...Object.values(LAYOUT_EXAMPLES)].slice(0, 24) }
    const { container } = render(
      <FableProvider images={{ allowedHosts: ["images.unsplash.com"] }}>
        <FableRenderer spec={spec} debug />
      </FableProvider>
    )
    const rendered = new Set([...container.querySelectorAll("[data-fable-block]")].map((node) => node.getAttribute("data-fable-block")))
    for (const name of Object.keys(BLOCK_EXAMPLES).slice(0, 21)) expect(rendered, name).toContain(name)
    expect(container.textContent).not.toContain("Skipped")
  })

  it("skips a bad block and keeps the rest", () => {
    render(<FableRenderer spec={{ blocks: [{ type: "markdown", text: "Kept" }, { type: "table" }] }} debug={false} />)
    expect(screen.getByText("Kept")).toBeTruthy()
  })

  it("never renders raw HTML or images from markdown", () => {
    const { container } = render(
      <FableRenderer spec={{ blocks: [{ type: "markdown", text: '<img src=x onerror=alert(1)> ![x](https://evil.io/p.png) [link](javascript:alert(1))' }] }} />
    )
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector('a[href^="javascript"]')).toBeNull()
  })

  it("asks before loading images from unlisted hosts", () => {
    const { container } = render(
      <FableRenderer spec={{ blocks: [{ type: "image", image: { src: "https://tracker.io/pixel.png", alt: "Pixel" } }] }} />
    )
    expect(container.querySelector("img")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Load image" }))
    expect(container.querySelector("img")?.getAttribute("referrerpolicy")).toBe("no-referrer")
  })

  it("sends reply actions and form answers through onReply", () => {
    const onReply = vi.fn()
    render(
      <FableProvider onReply={onReply}>
        <FableRenderer
          spec={{
            blocks: [
              { type: "actions", items: [{ type: "reply", label: "More", message: "Tell me more" }] },
              { type: "form", title: "Trip", fields: [{ name: "city", label: "City", type: "text", required: true }] },
            ],
          }}
        />
      </FableProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    expect(onReply).toHaveBeenCalledWith("Tell me more")

    fireEvent.click(screen.getByRole("button", { name: /Send answers/ }))
    expect(onReply).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Required")).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/City/), { target: { value: "Lisbon" } })
    fireEvent.click(screen.getByRole("button", { name: /Send answers/ }))
    expect(onReply).toHaveBeenLastCalledWith("Trip:\n- City: Lisbon")
    expect(screen.getByText("Answers sent")).toBeTruthy()
  })

  it("disables host actions the app did not register", () => {
    render(<FableRenderer spec={{ blocks: [{ type: "actions", items: [{ type: "host", label: "Delete account", action: "account.delete" }] }] }} />)
    expect((screen.getByRole("button", { name: "Delete account" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("confirms before running a registered host action", async () => {
    const run = vi.fn().mockResolvedValue("Sent")
    render(
      <FableProvider actions={{ "email.send": { confirm: "Send it?", run } }}>
        <FableRenderer spec={{ blocks: [{ type: "actions", items: [{ type: "host", label: "Send", action: "email.send", payload: { to: "a@b.co" } }] }] }} />
      </FableProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(run).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(run).toHaveBeenCalledWith({ to: "a@b.co" })
    expect(await screen.findByText("Sent")).toBeTruthy()
  })

  it("shows skeletons for open non-streamable blocks", () => {
    const { container } = render(<FableRenderer spec={{ blocks: [{ type: "gallery", layout: "grid" }] }} streaming />)
    expect(container.querySelector('[data-fable-skeleton="gallery"]')).toBeTruthy()
  })
})

describe("FableToolPart", () => {
  it("finalizes a part that stopped mid-stream", async () => {
    const { FableToolPart } = await import("./tool-part")
    const part = {
      type: "tool-render_ui",
      toolCallId: "t1",
      state: "input-streaming",
      input: { blocks: [{ type: "markdown", text: "Done part" }, { type: "actions", items: [{ type: "reply", label: "Go", message: "" }] }] },
    }
    const { container, rerender } = render(<FableToolPart part={part} active />)
    expect(container.querySelector("[data-fable-skeleton]")).toBeTruthy()
    rerender(<FableToolPart part={part} active={false} />)
    expect(container.querySelector("[data-fable-skeleton]")).toBeNull()
    expect(screen.getByText("Done part")).toBeTruthy()
    expect(screen.getByText("This answer stopped before it finished.")).toBeTruthy()
  })
})
