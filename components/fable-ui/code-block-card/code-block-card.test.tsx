import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { codeToHtml } = vi.hoisted(() => ({ codeToHtml: vi.fn() }))

vi.mock("shiki", () => ({ codeToHtml }))

import { CodeBlockCard } from "./code-block-card"

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function setClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })
}

describe("CodeBlockCard", () => {
  it("throttles live Shiki highlighting during streaming and shows a raw fallback first", async () => {
    vi.useFakeTimers()
    codeToHtml.mockResolvedValue(
      '<pre class="shiki"><code><span>live source B</span></code></pre>'
    )
    const view = render(
      <CodeBlockCard language="ts" code="live source A" isStreaming />
    )

    expect(codeToHtml).not.toHaveBeenCalled()
    expect(screen.getByText("live source A")).toBeTruthy()

    view.rerender(
      <CodeBlockCard language="ts" code="live source B" isStreaming />
    )
    await act(async () => {
      vi.advanceTimersByTime(149)
    })
    expect(codeToHtml).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(codeToHtml).toHaveBeenCalledWith(
      "live source B",
      expect.objectContaining({ lang: "ts" })
    )
    await vi.waitFor(() =>
      expect(view.container.querySelector(".shiki")?.textContent).toContain(
        "live source B"
      )
    )

    view.rerender(<CodeBlockCard language="ts" code="live source B" />)
    await vi.waitFor(() =>
      expect(view.container.querySelector(".shiki")?.textContent).toContain(
        "live source B"
      )
    )
  })

  it("highlights completed source once and falls back to raw source when highlighting fails", async () => {
    codeToHtml.mockResolvedValue(
      '<pre class="shiki"><code><span class="line" data-line="1">const ready = true</span></code></pre>'
    )
    const view = render(
      <CodeBlockCard language="ts" code="const ready = true" />
    )

    await vi.waitFor(() => expect(codeToHtml).toHaveBeenCalledTimes(1))
    await vi.waitFor(() =>
      expect(view.container.querySelector(".shiki")).toBeTruthy()
    )

    codeToHtml.mockRejectedValueOnce(new Error("unsupported"))
    view.rerender(<CodeBlockCard language="unknown" code="raw fallback" />)
    await vi.waitFor(() =>
      expect(screen.getByText("raw fallback")).toBeTruthy()
    )
  })

  it("bounds successful Shiki results and evicts the oldest cached source", async () => {
    codeToHtml.mockImplementation(
      async (code: string) =>
        `<pre class="shiki"><code><span>${code}</span></code></pre>`
    )
    const firstSource = "cache eviction source 0"
    const view = render(<CodeBlockCard language="cache" code={firstSource} />)

    await vi.waitFor(() => expect(codeToHtml).toHaveBeenCalledTimes(1))

    for (let index = 1; index <= 40; index++) {
      const source = `cache eviction source ${index}`
      view.rerender(<CodeBlockCard language="cache" code={source} />)
      await vi.waitFor(() =>
        expect(view.container.querySelector(".shiki")?.textContent).toContain(
          source
        )
      )
    }

    expect(codeToHtml).toHaveBeenCalledTimes(41)
    view.rerender(<CodeBlockCard language="cache" code={firstSource} />)
    await vi.waitFor(() => expect(codeToHtml).toHaveBeenCalledTimes(42))
  })

  it("ignores a stale streamed highlight after newer code has won the race", async () => {
    vi.useFakeTimers()
    let resolveStaleHighlight: ((html: string) => void) | undefined

    codeToHtml
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveStaleHighlight = resolve
          })
      )
      .mockResolvedValueOnce(
        '<pre class="shiki"><code><span>fresh streamed source</span></code></pre>'
      )

    const view = render(
      <CodeBlockCard language="ts" code="stale streamed source" isStreaming />
    )

    await act(async () => {
      vi.advanceTimersByTime(150)
    })
    expect(codeToHtml).toHaveBeenCalledTimes(1)

    view.rerender(
      <CodeBlockCard language="ts" code="fresh streamed source" isStreaming />
    )
    expect(view.container.querySelector(".shiki")).toBeNull()
    expect(screen.getByText("fresh streamed source")).toBeTruthy()

    await act(async () => {
      vi.advanceTimersByTime(150)
    })
    await vi.waitFor(() =>
      expect(view.container.querySelector(".shiki")?.textContent).toContain(
        "fresh streamed source"
      )
    )

    await act(async () => {
      resolveStaleHighlight?.(
        '<pre class="shiki"><code><span>stale streamed source</span></code></pre>'
      )
    })
    expect(view.container.querySelector(".shiki")?.textContent).toContain(
      "fresh streamed source"
    )
    expect(view.container.textContent).not.toContain("stale streamed source")
  })

  it("keeps metadata in host direction, scopes LTR to code, and places actions in the header", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    codeToHtml.mockResolvedValue(
      '<pre class="shiki"><code>const x = 1</code></pre>'
    )
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:code")
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined
    )

    const source = "const x = 1\n"
    const view = render(
      <div dir="rtl">
        <CodeBlockCard
          language="ts"
          code={source}
          filename="مثال.ts"
          isDisabled
        />
      </div>
    )
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(source))
    fireEvent.click(screen.getByRole("button", { name: "Download مثال.ts" }))

    expect((createObjectURL.mock.calls[0]?.[0] as Blob).size).toBe(
      new Blob([source]).size
    )
    const card = view.container.querySelector(
      '[data-fable-ui="code-block-card"]'
    )
    const codeRegion = view.container.querySelector(".max-h-96")
    const copyButton = screen.getByRole("button", {
      name: /Copy code|Copied code/,
    })

    expect(card?.getAttribute("dir")).toBeNull()
    expect(card?.parentElement?.getAttribute("dir")).toBe("rtl")
    expect(screen.getByText("مثال.ts")).toBeTruthy()
    expect(codeRegion?.getAttribute("dir")).toBe("ltr")
    expect(copyButton.closest('[data-slot="card-action"]')).toBeTruthy()
    expect(
      screen
        .getByRole("button", { name: "Download مثال.ts" })
        .closest('[data-slot="card-action"]')
    ).toBeTruthy()
    expect(screen.getByText("This code block is read-only.")).toBeTruthy()
  })
})
