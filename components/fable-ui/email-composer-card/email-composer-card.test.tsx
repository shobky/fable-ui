import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  buildOutlookComposeUrl,
  createPlainTextEmailPackage,
  EmailComposerCard,
  openDefaultEmailApp,
} from "./email-composer-card"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })
}

describe("EmailComposerCard", () => {
  it("copies one deterministic current email package from a top inline-end icon action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    render(
      <EmailComposerCard
        to={["reader@example.com"]}
        subject="Hello"
        body="Body"
      />
    )

    const subject = screen.getByRole("textbox", { name: "Subject" })
    const body = screen.getByRole("textbox", { name: "Body" })
    fireEvent.keyDown(subject, { key: "Enter" })
    expect(document.activeElement).toBe(body)

    fireEvent.input(subject, { target: { value: "Updated subject" } })
    fireEvent.input(body, { target: { value: "Updated body" } })
    const copyButton = screen.getByRole("button", {
      name: "Copy email package",
    })
    const sendButton = screen.getByRole("button", {
      name: "Choose email app",
    })

    expect(copyButton.closest('[data-slot="card-action"]')).toBeTruthy()
    expect(sendButton.closest('[data-slot="card-action"]')).toBeTruthy()
    expect(copyButton.getAttribute("data-variant")).toBe("ghost")
    expect(copyButton.getAttribute("data-size")).toBe("icon-sm")

    fireEvent.click(copyButton)
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "To: reader@example.com\nSubject: Updated subject\n\nUpdated body"
      )
    )
  })

  it("builds URLSearchParams compose links and opens the fixed app choices synchronously", async () => {
    const draft = {
      recipients: ["a+b@example.com", "second@example.com"],
      subject: "A & B",
      body: "first\nsecond",
    }
    const mailto = new URL(buildMailtoUrl(draft))

    expect(mailto.protocol).toBe("mailto:")
    expect(mailto.pathname).toBe("a%2Bb%40example.com,second%40example.com")
    expect(mailto.searchParams.get("subject")).toBe("A & B")
    expect(mailto.searchParams.get("body")).toBe("first\r\nsecond")
    expect(
      createPlainTextEmailPackage({
        to: draft.recipients,
        subject: draft.subject,
        body: draft.body,
      })
    ).toBe(
      "To: a+b@example.com, second@example.com\nSubject: A & B\n\nfirst\nsecond"
    )

    const replace = vi.fn()
    const popup = {
      opener: window,
      location: { replace },
    } as unknown as Window
    const open = vi.spyOn(window, "open").mockReturnValue(popup)
    render(
      <EmailComposerCard
        to={draft.recipients}
        subject={draft.subject}
        body={draft.body}
      />
    )

    function openEmailMenu() {
      fireEvent.pointerDown(
        screen.getByRole("button", { name: "Choose email app" }),
        { button: 0, ctrlKey: false }
      )
    }

    openEmailMenu()

    const gmail = await screen.findByRole("menuitem", {
      name: "Open in Gmail",
    })
    const outlook = screen.getByRole("menuitem", { name: "Open in Outlook" })
    const defaultApp = screen.getByRole("menuitem", {
      name: "Open default email app",
    })

    expect(gmail.querySelector("svg")).toBeTruthy()
    expect(outlook.querySelector("svg")).toBeTruthy()
    expect(defaultApp.querySelector("svg")).toBeTruthy()

    fireEvent.click(gmail)
    expect(open).toHaveBeenLastCalledWith("about:blank", "_blank")
    expect(popup.opener).toBeNull()
    expect(replace).toHaveBeenLastCalledWith(buildGmailComposeUrl(draft))
    openEmailMenu()
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Open in Outlook" })
    )
    expect(open).toHaveBeenLastCalledWith("about:blank", "_blank")
    expect(replace).toHaveBeenLastCalledWith(buildOutlookComposeUrl(draft))

    const location = { href: "" }
    openDefaultEmailApp(buildMailtoUrl(draft), location)
    expect(location.href).toBe(buildMailtoUrl(draft))
  })

  it("reports a visible status when the browser blocks a provider compose window", async () => {
    const draft = {
      recipients: ["reader@example.com"],
      subject: "Welcome",
      body: "Thanks for reading.",
    }
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )

    render(
      <EmailComposerCard
        to={draft.recipients}
        subject={draft.subject}
        body={draft.body}
      />
    )

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Choose email app" }),
      { button: 0, ctrlKey: false }
    )
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Open in Gmail" })
    )

    expect(open).toHaveBeenCalledWith("about:blank", "_blank")
    expect((await screen.findByRole("status")).textContent).toContain(
      "Could not open Gmail. Allow popups and try again, or copy the email package instead."
    )
  })

  it("keeps copy available but disables the app menu with clear invalid, long, disabled, and partial statuses", () => {
    const oversizedBody = "x".repeat(1900)
    const view = render(
      <EmailComposerCard subject="Large" body={oversizedBody} />
    )

    expect(
      (
        screen.getByRole("button", {
          name: "Choose email app",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      (
        screen.getByRole("button", {
          name: "Copy email package",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
    expect(screen.getByText(/too long for a reliable mailto link/)).toBeTruthy()

    view.rerender(
      <EmailComposerCard subject="Normal" body="Short body" isDisabled />
    )
    expect(
      screen.getByText(/unavailable because this draft is read-only/)
    ).toBeTruthy()
    expect(screen.queryByText(/too long for a reliable mailto link/)).toBeNull()
    expect(
      (
        screen.getByRole("button", {
          name: "Choose email app",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)

    view.rerender(
      <EmailComposerCard
        to={["not an address"]}
        subject="Normal"
        body="Short body"
      />
    )
    expect(
      screen.getByText(/Fix invalid recipients before sending/)
    ).toBeTruthy()
    expect(
      (
        screen.getByRole("button", {
          name: "Choose email app",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)

    view.rerender(
      <EmailComposerCard
        subject="Partial subject"
        body="Partial body"
        error={{ title: "Stopped", description: "Retry from the chat." }}
      />
    )
    expect(screen.getByRole("alert").textContent).toContain("Stopped")
    expect(screen.getByText("Partial body")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Copy email package" })
    ).toBeTruthy()
    expect(
      screen.getByText(/unavailable for this incomplete draft/)
    ).toBeTruthy()
    expect(
      (
        screen.getByRole("button", {
          name: "Choose email app",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it("keeps streaming content read-only until complete and only reports drafts after blur", () => {
    const onDraftChange = vi.fn()
    const view = render(
      <EmailComposerCard
        subject="Growing"
        body="partial"
        isStreaming
        onDraftChange={onDraftChange}
      />
    )

    expect(screen.queryByRole("textbox", { name: "Body" })).toBeNull()
    expect(screen.getByText("Generating email...")).toBeTruthy()
    expect(
      (
        screen.getByRole("button", {
          name: "Copy email package",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
    expect(
      screen.getByText(/unavailable for this incomplete draft/)
    ).toBeTruthy()
    expect(
      (
        screen.getByRole("button", {
          name: "Choose email app",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)

    view.rerender(
      <EmailComposerCard
        subject="Ready"
        body="body"
        onDraftChange={onDraftChange}
      />
    )
    const body = screen.getByRole("textbox", { name: "Body" })
    fireEvent.input(body, { target: { value: "changed" } })
    expect(onDraftChange).not.toHaveBeenCalled()
    fireEvent.blur(body)
    expect(onDraftChange).toHaveBeenCalledWith({
      to: [],
      subject: "Ready",
      body: "changed",
    })
  })

  it("derives an Arabic read-only draft direction from the subject and body, not the recipient", () => {
    const view = render(
      <EmailComposerCard
        to={["reader@example.com"]}
        subject="مرحبا"
        body="هذه رسالة عربية"
        direction="auto"
        isStreaming
      />
    )

    const readOnlyDraft = screen.getByText("مرحبا").parentElement
    const recipient = screen.getByText("To: reader@example.com")

    expect(readOnlyDraft?.getAttribute("dir")).toBe("rtl")
    expect(recipient.getAttribute("dir")).toBe("ltr")
    expect(view.container.textContent).toContain("هذه رسالة عربية")

    view.rerender(
      <EmailComposerCard
        to={["reader@example.com"]}
        subject="مرحبا"
        body="هذه رسالة عربية"
        direction="rtl"
        editable={false}
      />
    )
    expect(
      (screen.getByRole("textbox", { name: "To" }) as HTMLInputElement).dir
    ).toBe("ltr")
    expect(
      (screen.getByRole("textbox", { name: "Body" }) as HTMLTextAreaElement).dir
    ).toBe("rtl")
    expect(
      (screen.getByRole("textbox", { name: "Body" }) as HTMLTextAreaElement)
        .readOnly
    ).toBe(true)
  })

  it("uses unique IDs and label associations across multiple composers", () => {
    const view = render(
      <>
        <EmailComposerCard subject="First" body="One" />
        <EmailComposerCard subject="Second" body="Two" />
      </>
    )
    const controls = [
      ...screen.getAllByRole("textbox", { name: "To" }),
      ...screen.getAllByRole("textbox", { name: "Subject" }),
      ...screen.getAllByRole("textbox", { name: "Body" }),
    ]
    const ids = controls.map((control) => control.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toBeTruthy()
      expect(view.container.querySelector(`label[for="${id}"]`)).toBeTruthy()
    }
  })
})
