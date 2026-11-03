import { describe, expect, it } from "vitest"
import { z } from "zod"

import { BLOCK_EXAMPLES, LAYOUT_EXAMPLES } from "@/lib/block-examples"
import { SCENARIOS } from "@/lib/playground/scenarios"

import { fableSystemPrompt } from "./prompt"
import { CONTENT_BLOCKS, ContentBlockSchema, createFableSpecSchema, createFableToolSchema, FableSpecSchema } from "./schema"
import { specToMarkdown } from "./to-markdown"

describe("catalog", () => {
  it("has a valid example for every content block", () => {
    for (const name of Object.keys(CONTENT_BLOCKS)) {
      const example = BLOCK_EXAMPLES[name as keyof typeof BLOCK_EXAMPLES]
      expect(example, name).toBeDefined()
      const parsed = ContentBlockSchema.safeParse(example)
      expect(parsed.success, `${name}: ${parsed.error?.issues[0]?.message}`).toBe(true)
    }
  })

  it("accepts every layout example and every playground scenario", () => {
    for (const [name, block] of Object.entries(LAYOUT_EXAMPLES)) {
      expect(FableSpecSchema.safeParse({ blocks: [block] }).success, name).toBe(true)
    }
    for (const scenario of SCENARIOS) {
      if (!scenario.spec) continue
      const parsed = FableSpecSchema.safeParse(scenario.spec)
      expect(parsed.success, `${scenario.id}: ${JSON.stringify(parsed.error?.issues[0])}`).toBe(true)
    }
  })

  it("strips unknown keys instead of failing", () => {
    const parsed = ContentBlockSchema.parse({ type: "markdown", text: "Hi", style: "color:red", onClick: "alert(1)" })
    expect(parsed).toEqual({ type: "markdown", text: "Hi" })
  })

  it("rejects layouts nested inside layouts", () => {
    const nested = {
      blocks: [{ type: "section", blocks: [{ type: "tabs", tabs: [{ label: "A", blocks: [] }, { label: "B", blocks: [] }] }] }],
    }
    expect(FableSpecSchema.safeParse(nested).success).toBe(false)
  })

  it("enforces bounds", () => {
    expect(ContentBlockSchema.safeParse({ type: "markdown", text: "x".repeat(12_001) }).success).toBe(false)
    expect(
      ContentBlockSchema.safeParse({ type: "actions", items: Array.from({ length: 7 }, () => ({ type: "copy", label: "a", text: "b" })) })
        .success
    ).toBe(false)
    expect(
      ContentBlockSchema.safeParse({ type: "actions", items: [{ type: "host", label: "Run", action: "rm -rf /" }] }).success
    ).toBe(false)
    expect(FableSpecSchema.safeParse({ blocks: Array.from({ length: 25 }, () => ({ type: "divider" })) }).success).toBe(false)
  })

  it("builds a non-recursive JSON Schema that providers accept", () => {
    const schema = z.toJSONSchema(createFableToolSchema()) as Record<string, unknown>
    const text = JSON.stringify(schema)
    expect(text).not.toContain('"$ref"')
    expect(schema.type).toBe("object")
    // Keep the tool definition affordable: roughly 4 characters per token.
    expect(text.length / 4).toBeLessThan(8_000)
  })

  it("narrows the catalog with include", () => {
    const small = createFableSpecSchema(["markdown", "table"])
    expect(small.safeParse({ blocks: [{ type: "markdown", text: "ok" }] }).success).toBe(true)
    expect(small.safeParse({ blocks: [{ type: "chart", kind: "bar", xKey: "x", series: [{ key: "y", label: "Y" }], data: [{ x: "a", y: 1 }] }] }).success).toBe(false)
    const size = (include?: Parameters<typeof createFableToolSchema>[0]) => JSON.stringify(z.toJSONSchema(createFableToolSchema(include))).length
    expect(size(["markdown", "table"])).toBeLessThan(size() / 3)
  })
})

describe("specToMarkdown", () => {
  it("produces a readable fallback for every scenario", () => {
    for (const scenario of SCENARIOS) {
      if (!scenario.spec) continue
      const markdown = specToMarkdown(scenario.spec)
      expect(markdown.length, scenario.id).toBeGreaterThan(40)
    }
  })

  it("renders tables as GFM", () => {
    const markdown = specToMarkdown({ blocks: [BLOCK_EXAMPLES.table] })
    expect(markdown).toContain("| Client | Amount | Due | Status |")
    expect(markdown).toContain("€4,200")
  })

  it("returns an empty string for invalid specs", () => {
    expect(specToMarkdown({ blocks: "nope" })).toBe("")
  })
})

describe("fableSystemPrompt", () => {
  it("forbids images without a source and lists host actions", () => {
    const prompt = fableSystemPrompt({ hostActions: { "email.send": "sends email" } })
    expect(prompt).toContain("`render_ui`")
    expect(prompt).toContain("Do not use image")
    expect(prompt).toContain("`email.send`")
  })

  it("only mentions included blocks", () => {
    const prompt = fableSystemPrompt({ include: ["markdown", "table"], imageSource: "use the CDN." })
    expect(prompt).toContain("table —")
    expect(prompt).not.toContain("gallery —")
    expect(prompt).not.toContain("Images:")
  })
})

describe("render_ui tool", () => {
  it("acknowledges and reports skipped nested blocks to the model", async () => {
    const { createFableTool } = await import("./tool")
    const tool = createFableTool()
    const run = (input: unknown) => tool.execute!(input as never, { toolCallId: "t", messages: [] } as never)
    expect(await run({ blocks: [{ type: "markdown", text: "Hi" }] })).toEqual({ status: "displayed", blocks: 1 })
    const result = (await run({ blocks: [{ type: "section", blocks: [{ type: "table", rows: [] }] }] })) as { skipped?: string[] }
    expect(result.skipped?.[0]).toMatch(/^block 0\.0 \(table\)/)
  })
})
