import { parsePartialJson } from "ai"
import { describe, expect, it } from "vitest"

import { SCENARIOS } from "@/lib/playground/scenarios"

import { dropOpenTail, resolveSpec, type Resolved } from "./resolve"

const kinds = (items: Resolved[]) => items.map((item) => (item.kind === "content" ? `${item.kind}:${item.block.type}` : item.kind))

describe("resolveSpec", () => {
  it("validates closed blocks independently", () => {
    const resolved = resolveSpec({
      blocks: [
        { type: "markdown", text: "fine" },
        { type: "table", columns: "broken" },
        { type: "callout", tone: "info", text: "also fine" },
      ],
    })
    expect(kinds(resolved.items)).toEqual(["content:markdown", "invalid", "content:callout"])
    expect(resolved.invalidCount).toBe(1)
  })

  it("streams text blocks and holds non-streamable ones", () => {
    const text = resolveSpec({ blocks: [{ type: "markdown", text: "Partial sent" }] }, true)
    expect(text.items[0]).toMatchObject({ kind: "content", open: true })

    const image = resolveSpec({ blocks: [{ type: "image", image: { src: "https://images.unsplash.com/pho", alt: "" } }] }, true)
    expect(image.items[0]).toEqual({ kind: "pending", key: "0", type: "image" })

    const form = resolveSpec({ blocks: [{ type: "form", fields: [{ name: "a", label: "A", type: "text" }] }] }, true)
    expect(form.items[0].kind).toBe("pending")
  })

  it("drops the half-written last item of a streaming list", () => {
    const resolved = resolveSpec(
      {
        blocks: [
          {
            type: "list",
            style: "steps",
            items: [{ title: "One" }, { title: "Two" }, {}],
          },
        ],
      },
      true
    )
    const item = resolved.items[0]
    expect(item.kind).toBe("content")
    if (item.kind === "content" && item.block.type === "list") expect(item.block.items).toHaveLength(2)
  })

  it("shows a placeholder before the first block arrives", () => {
    expect(resolveSpec({}, true).items).toEqual([{ kind: "pending", key: "0" }])
    expect(resolveSpec({}, false).items).toEqual([])
  })

  it("resolves partial layouts child by child", () => {
    const resolved = resolveSpec(
      {
        blocks: [
          {
            type: "columns",
            columns: [{ blocks: [{ type: "markdown", text: "left" }] }, { blocks: [{ type: "chart", kind: "bar" }] }],
          },
        ],
      },
      true
    )
    const columns = resolved.items[0]
    expect(columns.kind).toBe("columns")
    if (columns.kind === "columns") {
      expect(kinds(columns.columns[0])).toEqual(["content:markdown"])
      expect(kinds(columns.columns[1])).toEqual(["pending"])
    }
  })

  it("never throws and keeps keys stable across every prefix of a real stream", async () => {
    for (const scenario of SCENARIOS) {
      if (!scenario.spec) continue
      const json = JSON.stringify(scenario.spec)
      const seen = new Map<string, string>()
      for (let end = 1; end <= json.length; end += 37) {
        const { value } = await parsePartialJson(json.slice(0, end))
        const resolved = resolveSpec(value, true)
        for (const item of resolved.items) {
          if (item.kind !== "content" || item.open) continue
          const previous = seen.get(item.key)
          if (previous) expect(previous, `${scenario.id} ${item.key}`).toBe(item.block.type)
          seen.set(item.key, item.block.type)
        }
      }
      const final = resolveSpec(scenario.spec)
      expect(final.invalidCount, scenario.id).toBe(0)
      expect(final.items.every((item) => item.kind !== "pending")).toBe(true)
    }
  })
})

describe("dropOpenTail", () => {
  it("removes the deepest trailing element", () => {
    expect(dropOpenTail({ a: [1, { b: [1, 2] }] })).toEqual({ a: [1, { b: [1] }] })
    expect(dropOpenTail([{}])).toEqual([])
    expect(dropOpenTail("text")).toBeUndefined()
  })
})

describe("repair", () => {
  it("trims oversized strings and arrays instead of dropping the block", () => {
    const resolved = resolveSpec({
      blocks: [
        { type: "actions", items: [{ type: "reply", label: "A label that is definitely longer than forty-eight characters", message: "Go" }] },
        { type: "list", style: "bullet", items: Array.from({ length: 35 }, (_, index) => ({ title: `Item ${index}` })) },
      ],
    })
    expect(resolved.invalidCount).toBe(0)
    const [actions, list] = resolved.items
    if (actions.kind === "content" && actions.block.type === "actions") {
      expect(actions.block.items[0].label.length).toBeLessThanOrEqual(48)
      expect(actions.block.items[0].label.endsWith("…")).toBe(true)
    }
    if (list.kind === "content" && list.block.type === "list") expect(list.block.items).toHaveLength(30)
  })

  it("still rejects blocks with structural problems", () => {
    expect(resolveSpec({ blocks: [{ type: "chart", kind: "radar", xKey: "x", series: [], data: [] }] }).invalidCount).toBe(1)
  })
})
