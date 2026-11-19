import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { BLOCK_EXAMPLES, LAYOUT_EXAMPLES } from "@/lib/block-examples"

import { FableProvider, FableScope, useFableState } from "./provider"
import { FableRenderer } from "./renderer"
import { CONTENT_BLOCKS, type ContentBlockType } from "./schema"

const contentAssertions: Record<ContentBlockType, () => void> = {
  markdown: () => expect(screen.getByText("Short answer:")).toBeTruthy(),
  heading: () => expect(screen.getByRole("heading", { name: "Signups are up, activation is flat" })).toBeTruthy(),
  callout: () => expect(screen.getByText("Before you migrate")).toBeTruthy(),
  metrics: () => expect(screen.getByText("Monthly revenue")).toBeTruthy(),
  table: () => expect(screen.getByRole("cell", { name: "Northwind" })).toBeTruthy(),
  chart: () => {
    fireEvent.click(screen.getByRole("button", { name: "Show data table" }))
    expect(screen.getByRole("table")).toBeTruthy()
    expect(screen.getByRole("rowheader", { name: "W1" })).toBeTruthy()
  },
  details: () => expect(screen.getByText("Sam Rivera")).toBeTruthy(),
  list: () => expect(screen.getByText("Install Fable UI")).toBeTruthy(),
  checklist: () => expect(screen.getByRole("checkbox", { name: "Write release notes" }).getAttribute("aria-checked")).toBe("true"),
  code: () => expect(screen.getByLabelText("bash code").textContent).toContain("pnpm dlx shadcn@latest add"),
  quote: () => expect(screen.getByRole("blockquote").textContent).toContain("Make the common case fast and the rare case possible."),
  image: () => expect(screen.getByRole("img", { name: "A wooden boat on a turquoise mountain lake" })).toBeTruthy(),
  gallery: () => expect(screen.getByRole("button", { name: "Open Long living room with a low sofa" })).toBeTruthy(),
  cards: () => expect(screen.getByRole("button", { name: "Choose Starter" })).toBeTruthy(),
  hero: () => expect(screen.getByRole("heading", { name: "Ship the boring version first" })).toBeTruthy(),
  article: () => expect(screen.getByRole("heading", { name: "The pattern" })).toBeTruthy(),
  form: () => expect(screen.getByRole("textbox", { name: /Project name/ })).toBeTruthy(),
  template: () => expect(screen.getByRole("textbox", { name: "Their name" })).toBeTruthy(),
  email: () => expect((screen.getByRole("textbox", { name: "Subject" }) as HTMLInputElement).value).toBe("Quick question about the Q4 roadmap"),
  actions: () => expect(screen.getByRole("link", { name: "Open docs" }).getAttribute("href")).toBe("https://nextjs.org/docs"),
  file: () => {
    expect(screen.getByText("contacts.csv")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy()
  },
  sources: () => expect(screen.getByRole("link", { name: /Route Handlers/ })).toBeTruthy(),
  faq: () => {
    fireEvent.click(screen.getByRole("button", { name: "Can I use my own components?" }))
    expect(screen.getByText(/Every block is source code in your repo/)).toBeTruthy()
  },
  divider: () => expect(screen.getByRole("separator", { name: "Appendix" })).toBeTruthy(),
}

const contentTypes = Object.keys(CONTENT_BLOCKS) as ContentBlockType[]
const layoutTypes = ["columns", "section", "tabs"] as const

afterEach(cleanup)

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
  it("has exactly one fixture for every supported content and layout type", () => {
    expect(Object.keys(BLOCK_EXAMPLES).sort()).toEqual([...contentTypes].sort())
    expect(Object.keys(LAYOUT_EXAMPLES).sort()).toEqual([...layoutTypes].sort())
  })

  it.each(contentTypes)("renders the %s fixture with meaningful content", (name) => {
    // Each spec stays within the schema and resolver's 24-block limit.
    const block = BLOCK_EXAMPLES[name]
    expect(block.type).toBe(name)
    const { container } = render(
      <FableProvider images={{ allowedHosts: ["images.unsplash.com"] }}>
        <FableRenderer spec={{ blocks: [block] }} debug />
      </FableProvider>
    )
    expect(container.querySelector(`[data-fable-block="${name}"]`)).toBeTruthy()
    contentAssertions[name]()
    expect(container.textContent).not.toContain("Skipped")
    expect(container.textContent).not.toContain("failed to render")
  })

  it.each(layoutTypes)("renders the %s layout fixture", (name) => {
    expect(LAYOUT_EXAMPLES[name].type).toBe(name)
    const { container } = render(<FableRenderer spec={{ blocks: [LAYOUT_EXAMPLES[name]] }} debug />)
    if (name === "tabs") {
      const tablist = screen.getByRole("tablist")
      expect(within(tablist).getByRole("tab", { name: "Monthly" }).getAttribute("aria-selected")).toBe("true")
      const details = within(tablist).getByRole("tab", { name: "Details" })
      fireEvent.mouseDown(details, { button: 0 })
      expect(details.getAttribute("aria-selected")).toBe("true")
      const panel = screen.getByRole("tabpanel", { name: "Details" })
      expect(within(panel).getByRole("table")).toBeTruthy()
      expect(within(panel).getByRole("cell", { name: "Northwind" })).toBeTruthy()
    } else {
      expect(container.querySelector(`[data-fable-block="${name}"]`)).toBeTruthy()
      if (name === "columns") {
        expect(screen.getByRole("heading", { name: "Weekly active users" })).toBeTruthy()
        expect(screen.getByText("Sam Rivera")).toBeTruthy()
      } else {
        expect(screen.getByRole("region", { name: "Recommendation" })).toBeTruthy()
        expect(screen.getByRole("link", { name: "Open docs" })).toBeTruthy()
      }
    }
    expect(container.textContent).not.toContain("Skipped")
    expect(container.textContent).not.toContain("failed to render")
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
