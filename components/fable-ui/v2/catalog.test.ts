import { describe, expect, it } from "vitest"

import {
  FableAssetCatalogSchema,
  FableElementSchema,
  FableLinkCatalogSchema,
  FableViewDataSchema,
  validateFableViewSpec,
} from "./catalog"
import { MAX_FABLE_RICH_CONTENT_TOTAL_CHARS } from "./rich-content-utils"

const validSpec = {
  root: "root",
  elements: {
    root: {
      type: "Stack",
      props: { direction: "vertical", gap: 2 },
      children: ["answer"],
    },
    answer: {
      type: "Text",
      props: { content: "All values are shown as text.", level: "body" },
      children: [],
    },
  },
}

type MutableTestSpec = {
  root: string
  elements: Record<
    string,
    { type: string; props: Record<string, unknown>; children: string[] }
  >
}

function mutableSpec(): MutableTestSpec {
  return structuredClone(validSpec) as unknown as MutableTestSpec
}

describe("Fable UI v2 strict catalog", () => {
  it("accepts a bounded composed view", () => {
    expect(validateFableViewSpec(validSpec).success).toBe(true)
  })

  it("rejects unknown component props and component names", () => {
    const unknownProp = mutableSpec()
    unknownProp.elements.answer.props.style = { color: "red" }
    const unknownComponent = mutableSpec()
    unknownComponent.elements.answer.type = "ArbitraryComponent"

    expect(validateFableViewSpec(unknownProp).success).toBe(false)
    expect(validateFableViewSpec(unknownComponent).success).toBe(false)
  })

  it("accepts bounded semantic rich content and rejects model-authored link destinations", () => {
    const valid = {
      type: "RichContent",
      props: {
        blocks: [
          {
            type: "paragraph",
            spans: [{ type: "text", text: "A safe answer.", mark: "plain" }],
          },
          {
            type: "list",
            ordered: true,
            items: [[{ type: "text", text: "First step", mark: "strong" }]],
          },
          {
            type: "code",
            language: "ts",
            code: "const safe = true",
          },
        ],
      },
      children: [],
    }
    const modelHref = {
      type: "RichContent",
      props: {
        blocks: [
          {
            type: "paragraph",
            spans: [
              {
                type: "link",
                linkId: "guide",
                href: "https://untrusted.example",
              },
            ],
          },
        ],
      },
      children: [],
    }

    expect(FableElementSchema.safeParse(valid).success).toBe(true)
    expect(FableElementSchema.safeParse(modelHref).success).toBe(false)
  })

  it("enforces aggregate text and encoded-byte bounds for rich content", () => {
    const longParagraph = {
      type: "RichContent",
      props: {
        blocks: Array.from({ length: 4 }, () => ({
          type: "paragraph",
          spans: Array.from({ length: 16 }, () => ({
            type: "text",
            text: "x".repeat(240),
            mark: "plain",
          })),
        })),
      },
      children: [],
    }
    const escapedCode = {
      type: "RichContent",
      props: {
        blocks: [{ type: "code", code: "\u0001".repeat(3000) }],
      },
      children: [],
    }

    expect(MAX_FABLE_RICH_CONTENT_TOTAL_CHARS).toBeLessThan(4 * 16 * 240)
    expect(FableElementSchema.safeParse(longParagraph).success).toBe(false)
    expect(FableElementSchema.safeParse(escapedCode).success).toBe(false)
  })

  it("does not accept model-authored factual labels or asset descriptions", () => {
    const labeledMetric = {
      root: "metric",
      elements: {
        metric: {
          type: "Metric",
          props: { resultId: "bookings", label: "Net profit" },
          children: [],
        },
      },
    }
    const labeledMedia = {
      root: "image",
      elements: {
        image: {
          type: "Media",
          props: { assetId: "hero", alt: "A misleading image description" },
          children: [],
        },
      },
    }

    expect(validateFableViewSpec(labeledMetric).success).toBe(false)
    expect(validateFableViewSpec(labeledMedia).success).toBe(false)
  })

  it("rejects missing children, cycles, orphans, and excessive depth", () => {
    const missingChild = mutableSpec()
    missingChild.elements.root.children = ["missing"]

    const cycle = mutableSpec()
    cycle.elements.answer = {
      type: "Stack",
      props: { direction: "vertical", gap: 2 },
      children: ["root"],
    }

    const orphan = mutableSpec()
    orphan.elements.unused = {
      type: "Text",
      props: { content: "Not reachable.", level: "body" },
      children: [],
    }

    const deep = {
      root: "node-0",
      elements: Object.fromEntries(
        Array.from({ length: 8 }, (_, index) => [
          `node-${index}`,
          {
            type: "Stack",
            props: { direction: "vertical", gap: 1 },
            children: index < 7 ? [`node-${index + 1}`] : [],
          },
        ])
      ),
    }

    expect(validateFableViewSpec(missingChild).success).toBe(false)
    expect(validateFableViewSpec(cycle).success).toBe(false)
    expect(validateFableViewSpec(orphan).success).toBe(false)
    expect(validateFableViewSpec(deep).success).toBe(false)
  })

  it("rejects arbitrary asset URLs and protocol-relative paths", () => {
    expect(
      FableAssetCatalogSchema.safeParse({
        hero: { src: "/images/hero.webp", alt: "A beach hotel" },
      }).success
    ).toBe(true)
    expect(
      FableAssetCatalogSchema.safeParse({
        hero: { src: "https://example.com/hero.webp", alt: "A beach hotel" },
      }).success
    ).toBe(false)
    expect(
      FableAssetCatalogSchema.safeParse({
        hero: { src: "//example.com/hero.webp", alt: "A beach hotel" },
      }).success
    ).toBe(false)
  })

  it("accepts only bounded host-approved local paths or HTTPS links", () => {
    expect(
      FableLinkCatalogSchema.safeParse({
        guide: { href: "/docs/components/v2", label: "Fable UI guide" },
        reference: {
          href: "https://docs.example.com/api",
          label: "API reference",
        },
      }).success
    ).toBe(true)
    for (const href of [
      "javascript:alert(1)",
      "http://docs.example.com",
      "//docs.example.com",
      "https://user:pass@docs.example.com",
    ]) {
      expect(
        FableLinkCatalogSchema.safeParse({ link: { href, label: "Link" } })
          .success
      ).toBe(false)
    }
    expect(
      FableLinkCatalogSchema.safeParse({ link: { href: "/safe", label: " " } })
        .success
    ).toBe(false)
  })

  it("rejects invalid host-provided number locales", () => {
    expect(
      FableViewDataSchema.safeParse({
        metric: {
          kind: "metric",
          label: "Bookings",
          value: 1,
          format: "number",
          locale: "not_a_locale",
        },
      }).success
    ).toBe(false)
  })
})
