import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TextEditorCard } from "./text-editor-card"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })
}

describe("TextEditorCard", () => {
  it("keeps ready text uncontrolled and only commits a draft on blur", () => {
    const onContentChange = vi.fn()

    render(
      <TextEditorCard
        label="Note"
        content="Start"
        onContentChange={onContentChange}
      />
    )

    const editor = screen.getByRole("textbox", {
      name: "Content",
    }) as HTMLTextAreaElement
    expect(editor.getAttribute("value")).toBeNull()

    fireEvent.input(editor, { target: { value: "Edited text" } })
    expect(editor.value).toBe("Edited text")
    expect(onContentChange).not.toHaveBeenCalled()

    fireEvent.blur(editor)
    expect(onContentChange).toHaveBeenCalledWith("Edited text")
  })

  it("hands a growing read-only streaming view to an editable textarea only when complete", () => {
    const view = render(
      <TextEditorCard content="مرحبا" direction="auto" isStreaming />
    )

    expect(screen.queryByRole("textbox", { name: "Content" })).toBeNull()
    expect(screen.getByRole("status").textContent).toContain("Generating text")
    expect(screen.getByText("مرحبا")).toBeTruthy()

    view.rerender(<TextEditorCard content="مرحبا" direction="auto" />)

    const editor = screen.getByRole("textbox", {
      name: "Content",
    }) as HTMLTextAreaElement
    expect(editor.value).toBe("مرحبا")
    expect(editor.dir).toBe("auto")
    const copyButton = screen.getByRole("button", { name: "Copy text" })
    const downloadButton = screen.getByRole("button", {
      name: "Download .txt",
    })

    expect(copyButton.closest('[data-slot="card-action"]')).toBeTruthy()
    expect(downloadButton.closest('[data-slot="card-action"]')).toBeTruthy()
    expect(copyButton.getAttribute("data-variant")).toBe("ghost")
    expect(copyButton.getAttribute("data-size")).toBe("icon-sm")
  })

  it("retains partial content after an error and keeps disabled text selectable with copy available", () => {
    const view = render(
      <TextEditorCard
        content="partial draft"
        error={{
          title: "Stopped",
          description: "The response was interrupted.",
        }}
      />
    )

    expect(screen.getByRole("alert").textContent).toContain("Stopped")
    expect(screen.getByText("partial draft")).toBeTruthy()
    expect(
      (screen.getByRole("button", { name: "Copy text" }) as HTMLButtonElement)
        .disabled
    ).toBe(false)

    view.rerender(
      <TextEditorCard
        content="past draft"
        isDisabled
        maxLength={3}
        direction="auto"
      />
    )

    const editor = screen.getByRole("textbox", {
      name: "Content",
    }) as HTMLTextAreaElement
    expect(editor.readOnly).toBe(true)
    expect(editor.className).toContain("max-h-80")
    expect(editor.className).toContain("resize-none")
    expect(screen.getByText("10 / 3 characters")).toBeTruthy()
    expect(
      (screen.getByRole("button", { name: "Copy text" }) as HTMLButtonElement)
        .disabled
    ).toBe(false)
  })

  it("uses unique label and textarea IDs across multiple cards", () => {
    const view = render(
      <>
        <TextEditorCard label="First" content="One" />
        <TextEditorCard label="Second" content="Two" />
      </>
    )
    const editors = screen.getAllByRole("textbox", { name: "Content" })
    const ids = editors.map((editor) => editor.id)

    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
    expect(ids[0]).not.toBe(ids[1])
    for (const id of ids) {
      expect(view.container.querySelector(`label[for="${id}"]`)).toBeTruthy()
    }
  })

  it("copies the current uncontrolled edit and selects new source content after a prop change", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    const view = render(<TextEditorCard content="Original" />)
    const editor = screen.getByRole("textbox", {
      name: "Content",
    }) as HTMLTextAreaElement

    fireEvent.input(editor, { target: { value: "Edited exactly\n" } })
    fireEvent.click(screen.getByRole("button", { name: "Copy text" }))
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Edited exactly\n")
    )

    view.rerender(<TextEditorCard content="Replacement" />)
    expect(
      (screen.getByRole("textbox", { name: "Content" }) as HTMLTextAreaElement)
        .value
    ).toBe("Replacement")
    fireEvent.click(
      screen.getByRole("button", { name: /Copy text|Copied text/ })
    )
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Replacement")
    )
  })

  it("disables header actions when an uncontrolled draft is emptied and restores them without a blur", () => {
    const view = render(<TextEditorCard content="Draft" />)

    const editor = screen.getByRole("textbox", {
      name: "Content",
    }) as HTMLTextAreaElement
    const copyButton = screen.getByRole("button", {
      name: "Copy text",
    }) as HTMLButtonElement
    const downloadButton = screen.getByRole("button", {
      name: "Download .txt",
    }) as HTMLButtonElement

    fireEvent.input(editor, { target: { value: "" } })
    expect(copyButton.disabled).toBe(true)
    expect(downloadButton.disabled).toBe(true)

    fireEvent.input(editor, { target: { value: "Restored" } })
    expect(copyButton.disabled).toBe(false)
    expect(downloadButton.disabled).toBe(false)

    fireEvent.input(editor, { target: { value: "" } })
    expect(copyButton.disabled).toBe(true)
    expect(downloadButton.disabled).toBe(true)

    view.rerender(<TextEditorCard content="Replacement" />)
    expect(
      (screen.getByRole("textbox", { name: "Content" }) as HTMLTextAreaElement)
        .value
    ).toBe("Replacement")
    expect(copyButton.disabled).toBe(false)
    expect(downloadButton.disabled).toBe(false)
  })

  it("shows loading and empty states and reports clipboard success or failure", async () => {
    const view = render(<TextEditorCard content="" isLoading />)
    expect(screen.getByRole("status").textContent).toContain(
      "Preparing text editor"
    )

    view.rerender(<TextEditorCard content="" />)
    expect(screen.getByText("No text yet")).toBeTruthy()

    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    view.rerender(<TextEditorCard content="exact text" direction="auto" />)
    fireEvent.click(screen.getByRole("button", { name: "Copy text" }))

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("exact text"))
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Copied text" })).toBeTruthy()
    )

    setClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    })
    fireEvent.click(screen.getByRole("button", { name: "Copied text" }))

    await vi.waitFor(() =>
      expect(
        screen.getByText(
          "Could not copy. Select the text and copy it manually."
        )
      ).toBeTruthy()
    )
  })

  it("downloads an untrimmed text payload with a format-appropriate filename", () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:download")
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined)

    render(
      <TextEditorCard
        label="Arabic note"
        content={"line one\n"}
        format="markdown"
      />
    )
    fireEvent.input(screen.getByRole("textbox", { name: "Content" }), {
      target: { value: "line one edited\n" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Download .md" }))

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.size).toBe(new Blob(["line one edited\n"]).size)
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download")
  })
})
