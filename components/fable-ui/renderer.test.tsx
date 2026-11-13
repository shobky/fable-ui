import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BLOCK_EXAMPLES, LAYOUT_EXAMPLES } from "@/lib/block-examples"

import { FableProvider, FableScope, useFableState } from "./provider"
import { FableRenderer } from "./renderer"

function ScopedStateProbe() {
  const [value, setValue] = useFableState("value", "initial")
  return <button onClick={() => setValue("edited")}>{value}</button>
}

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

  it("keeps state independent for default renderer instances", () => {
    const spec = {
      blocks: [
        {
          type: "tabs",
          tabs: [
            { label: "Monthly", blocks: [{ type: "markdown", text: "Monthly view" }] },
            { label: "Details", blocks: [{ type: "markdown", text: "Details view" }] },
          ],
        },
      ],
    }
    const { container, rerender } = render(
      <FableProvider>
        <FableRenderer spec={spec} />
      </FableProvider>
    )

    const first = () => container.querySelector<HTMLElement>("[data-fable-ui]")!
    fireEvent.mouseDown(within(first()).getByRole("tab", { name: "Details" }), { button: 0 })
    expect(within(first()).getByRole("tab", { name: "Details" }).getAttribute("aria-selected")).toBe("true")

    rerender(
      <FableProvider>
        <FableRenderer spec={spec} />
        <FableRenderer spec={spec} />
      </FableProvider>
    )
    const surfaces = [...container.querySelectorAll<HTMLElement>("[data-fable-ui]")]
    expect(surfaces).toHaveLength(2)
    expect(within(surfaces[0]).getByRole("tab", { name: "Details" }).getAttribute("aria-selected")).toBe("true")
    expect(within(surfaces[1]).getByRole("tab", { name: "Monthly" }).getAttribute("aria-selected")).toBe("true")
  })

  it("switches state with an explicit surface id and restores it when remounted", () => {
    const spec = {
      blocks: [
        {
          type: "tabs",
          tabs: [
            { label: "Monthly", blocks: [{ type: "markdown", text: "Monthly view" }] },
            { label: "Details", blocks: [{ type: "markdown", text: "Details view" }] },
          ],
        },
      ],
    }
    const { container, rerender } = render(
      <FableProvider>
        <FableRenderer id="surface-a" spec={spec} />
      </FableProvider>
    )
    const surface = () => container.querySelector<HTMLElement>("[data-fable-ui]")!

    fireEvent.mouseDown(within(surface()).getByRole("tab", { name: "Details" }), { button: 0 })
    rerender(
      <FableProvider>
        <FableRenderer id="surface-b" spec={spec} />
      </FableProvider>
    )
    expect(within(surface()).getByRole("tab", { name: "Monthly" }).getAttribute("aria-selected")).toBe("true")

    rerender(
      <FableProvider>
        <FableRenderer id="surface-a" spec={spec} />
      </FableProvider>
    )
    expect(within(surface()).getByRole("tab", { name: "Details" }).getAttribute("aria-selected")).toBe("true")
  })

  it("switches direct scope state and restores the previous scope", () => {
    const { rerender } = render(
      <FableProvider>
        <FableScope id="scope-a">
          <ScopedStateProbe />
        </FableScope>
      </FableProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "initial" }))
    expect(screen.getByRole("button", { name: "edited" })).toBeTruthy()

    rerender(
      <FableProvider>
        <FableScope id="scope-b">
          <ScopedStateProbe />
        </FableScope>
      </FableProvider>
    )
    expect(screen.getByRole("button", { name: "initial" })).toBeTruthy()

    rerender(
      <FableProvider>
        <FableScope id="scope-a">
          <ScopedStateProbe />
        </FableScope>
      </FableProvider>
    )
    expect(screen.getByRole("button", { name: "edited" })).toBeTruthy()
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

  it("shows a safe error when a tool part failed before producing input", async () => {
    const { FableToolPart } = await import("./tool-part")
    const { container } = render(
      <FableToolPart
        active={false}
        part={{ type: "tool-render_ui", toolCallId: "failed", state: "output-error", errorText: "upstream failed" }}
      />
    )

    expect(screen.getByRole("alert").textContent).toContain("could not be displayed")
    expect(container.querySelector("[data-fable-ui]")).toBeNull()
  })

  it("renders captured input for a failed part without calling it interrupted", async () => {
    const { FableToolPart } = await import("./tool-part")
    const { container } = render(
      <FableToolPart
        active={false}
        part={{
          type: "tool-render_ui",
          toolCallId: "failed-with-input",
          state: "output-error",
          input: { blocks: [{ type: "markdown", text: "Partial answer" }] },
          errorText: "upstream failed",
        }}
      />
    )

    expect(screen.getByText("Partial answer")).toBeTruthy()
    expect(container.textContent).not.toContain("This answer stopped before it finished.")
    expect(container.querySelector("[data-fable-skeleton]")).toBeNull()
  })

  it("replays an idle tool part as settled history", async () => {
    const { FableToolPart } = await import("./tool-part")
    const { container } = render(
      <FableToolPart
        active={false}
        part={{
          type: "tool-render_ui",
          toolCallId: "history",
          state: "output-available",
          input: { blocks: [{ type: "markdown", text: "Replayed answer" }] },
        }}
      />
    )

    expect(screen.getByText("Replayed answer")).toBeTruthy()
    expect(container.textContent).not.toContain("This answer stopped before it finished.")
  })
})
