import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { FableRichContent } from "./rich-content"
import type { FableRichContentBlock } from "./rich-content"
import {
  isSafeFableLinkHref,
  parseSafeFableLinkHref,
} from "./rich-content-utils"

afterEach(cleanup)

describe("FableRichContent", () => {
  it("renders semantic blocks and keeps markup-like text and code inert", () => {
    const code = "const answer = 42;\nconsole.log(answer)\n"
    const blocks: FableRichContentBlock[] = [
      {
        type: "paragraph",
        spans: [
          { type: "text", text: "A careful answer with ", mark: "plain" },
          { type: "text", text: "emphasis", mark: "strong" },
          { type: "text", text: " and <script>run()</script>.", mark: "plain" },
          { type: "text", text: "inline code", mark: "code" },
        ],
      },
      {
        type: "heading",
        level: 2,
        spans: [{ type: "text", text: "A section", mark: "plain" }],
      },
      {
        type: "list",
        ordered: false,
        items: [[{ type: "text", text: "First point", mark: "plain" }]],
      },
      {
        type: "list",
        ordered: true,
        items: [[{ type: "text", text: "First step", mark: "plain" }]],
      },
      {
        type: "quote",
        spans: [
          { type: "text", text: "Quoted text remains text.", mark: "emphasis" },
        ],
      },
      { type: "code", language: "ts", code },
    ]

    const { container } = render(<FableRichContent blocks={blocks} />)

    expect(
      screen.getByRole("heading", { name: "A section", level: 2 })
    ).toBeTruthy()
    expect(container.querySelectorAll("ul")).toHaveLength(1)
    expect(container.querySelectorAll("ol")).toHaveLength(1)
    expect(screen.getByRole("blockquote")).toBeTruthy()
    expect(container.textContent).toContain("<script>run()</script>")
    expect(container.querySelector("script")).toBeNull()
    expect(screen.getByLabelText("ts code sample").textContent).toBe(code)
  })

  it("resolves links only through host labels and destinations", () => {
    const blocks: FableRichContentBlock[] = [
      {
        type: "paragraph",
        spans: [
          { type: "link", linkId: "guide" },
          { type: "text", text: " ", mark: "plain" },
          { type: "link", linkId: "missing" },
          { type: "link", linkId: "unsafe" },
        ],
      },
    ]

    render(
      <FableRichContent
        blocks={blocks}
        links={{
          guide: {
            href: "https://docs.example.com/fable",
            label: "Read the guide",
          },
          unsafe: { href: "/.//evil.example/path", label: "Unsafe destination" },
        }}
      />
    )

    const guide = screen.getByRole("link", { name: "Read the guide" })
    expect(guide.getAttribute("href")).toBe("https://docs.example.com/fable")
    expect(guide.hasAttribute("target")).toBe(false)
    expect(guide.textContent).toContain("docs.example.com")
    expect(screen.getAllByText("Link unavailable")).toHaveLength(2)
    expect(
      screen.queryByRole("link", { name: /unsafe destination/i })
    ).toBeNull()
  })

  it("allows only local absolute paths and credential-free HTTPS destinations", () => {
    const safe = [
      "/docs/components/v2?from=chat#links",
      "https://docs.example.com/components/v2",
    ]
    const unsafe = [
      "javascript:alert(1)",
      "data:text/html,<h1>unsafe</h1>",
      "http://docs.example.com",
      "//docs.example.com/path",
      "/.//evil.example/path",
      "/prefix/..//evil.example/path",
      "/%2e//evil.example/path",
      "/%2e%2e//evil.example/path",
      "/\\\\docs.example.com/path",
      "https://user:secret@docs.example.com/path",
      "https://docs.example.com/path with spaces",
      "https://docs.example.com/path\nnext",
    ]

    for (const href of safe) expect(isSafeFableLinkHref(href)).toBe(true)
    for (const href of unsafe) expect(parseSafeFableLinkHref(href)).toBeNull()
  })
})
