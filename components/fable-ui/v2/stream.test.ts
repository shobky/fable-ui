import { describe, expect, it } from "vitest"

import { createFableSpecStream, encodeFableSpecStream } from "./stream"
import type { FableViewSpec } from "./catalog"

const validSpec: FableViewSpec = {
  root: "root",
  elements: {
    root: {
      type: "Stack",
      props: { direction: "vertical", gap: 2 },
      children: ["answer"],
    },
    answer: {
      type: "Text",
      props: { content: "The host owns the data.", level: "body" },
      children: [],
    },
  },
}

describe("Fable UI v2 stream adapter", () => {
  it("compiles split JSONL chunks into validated progressive snapshots", () => {
    const stream = createFableSpecStream()
    const encoded = encodeFableSpecStream(validSpec)
    let visibleSnapshot = null

    for (let cursor = 0; cursor < encoded.length; cursor += 11) {
      const update = stream.push(encoded.slice(cursor, cursor + 11))
      if (update.spec) visibleSnapshot = update.spec
    }

    const complete = stream.finish()
    expect(visibleSnapshot?.root).toBe("root")
    expect(complete.complete).toBe(true)
    expect(complete.spec?.elements.answer.type).toBe("Text")
    expect(complete.acceptedPatches).toBe(3)

    expect(stream.finish()).toEqual(complete)
    expect(stream.push("ignored")).toEqual(complete)
  })

  it("retains the last valid view and rejects unknown props before compilation", () => {
    const stream = createFableSpecStream()
    stream.push(`${JSON.stringify({ op: "add", path: "/root", value: "root" })}\n`)
    const root = {
      type: "Stack",
      props: { direction: "vertical", gap: 2 },
      children: [],
    }
    const valid = stream.push(`${JSON.stringify({ op: "add", path: "/elements/root", value: root })}\n`)
    expect(valid.spec?.root).toBe("root")

    const invalid = stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/answer",
        value: {
          type: "Text",
          props: { content: "Unsafe style", level: "body", style: { color: "red" } },
          children: [],
        },
      })}\n`
    )

    expect(invalid.issue).toBe("invalid_component_schema")
    expect(invalid.spec?.root).toBe("root")
    expect(stream.finish().issue).toBe("invalid_component_schema")
  })

  it("rejects deep patch paths and prototype IDs before touching compiler state", () => {
    const stream = createFableSpecStream()
    const invalidPath = stream.push(
      `${JSON.stringify({ op: "add", path: "/elements/__proto__/polluted", value: {} })}\n`
    )
    expect(invalidPath.issue).toBe("invalid_patch_path")
    expect(invalidPath.spec).toBeNull()
  })

  it("keeps partial content when the completed tree has a dangling reference", () => {
    const stream = createFableSpecStream()
    stream.push(`${JSON.stringify({ op: "add", path: "/root", value: "root" })}\n`)
    const partial = stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/root",
        value: {
          type: "Stack",
          props: { direction: "vertical", gap: 2 },
          children: ["later"],
        },
      })}\n`
    )
    const complete = stream.finish()

    expect(partial.spec?.elements.root.children).toEqual([])
    expect(complete.complete).toBe(false)
    expect(complete.issue).toBe("missing_child")
    expect(complete.spec?.root).toBe("root")
  })

  it("keeps the current snapshot while a replacement root arrives", () => {
    const stream = createFableSpecStream()
    stream.push(`${JSON.stringify({ op: "add", path: "/root", value: "root" })}\n`)
    stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/root",
        value: {
          type: "Text",
          props: { content: "Current answer", level: "body" },
          children: [],
        },
      })}\n`
    )

    const waitingForReplacement = stream.push(
      `${JSON.stringify({ op: "replace", path: "/root", value: "next" })}\n`
    )
    expect(waitingForReplacement.issue).toBeUndefined()
    expect(waitingForReplacement.spec?.root).toBe("root")

    const replacement = stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/next",
        value: {
          type: "Text",
          props: { content: "Updated answer", level: "body" },
          children: [],
        },
      })}\n`
    )
    const complete = stream.finish()

    expect(replacement.spec?.root).toBe("next")
    expect(complete.complete).toBe(true)
    expect(complete.spec?.elements.root).toBeUndefined()
    expect(complete.spec?.elements.next.type).toBe("Text")
  })

  it("bounds the current tree rather than accumulating nodes from prior roots", () => {
    const stream = createFableSpecStream()
    stream.push(`${JSON.stringify({ op: "add", path: "/root", value: "root" })}\n`)
    stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/root",
        value: {
          type: "Text",
          props: { content: "Initial answer", level: "body" },
          children: [],
        },
      })}\n`
    )

    for (let index = 0; index < 40; index += 1) {
      const id = `answer-${index}`
      const rootUpdate = stream.push(
        `${JSON.stringify({ op: "replace", path: "/root", value: id })}\n`
      )
      const elementUpdate = stream.push(
        `${JSON.stringify({
          op: "add",
          path: `/elements/${id}`,
          value: {
            type: "Text",
            props: { content: `Answer ${index}`, level: "body" },
            children: [],
          },
        })}\n`
      )

      expect(rootUpdate.issue).toBeUndefined()
      expect(elementUpdate.issue).toBeUndefined()
    }

    const complete = stream.finish()
    expect(complete.complete).toBe(true)
    expect(Object.keys(complete.spec?.elements ?? {})).toEqual(["answer-39"])
  })

  it("cancels without discarding the last validated snapshot", () => {
    const stream = createFableSpecStream()
    stream.push(`${JSON.stringify({ op: "add", path: "/root", value: "root" })}\n`)
    stream.push(
      `${JSON.stringify({
        op: "add",
        path: "/elements/root",
        value: {
          type: "Text",
          props: { content: "Keep this answer", level: "body" },
          children: [],
        },
      })}\n`
    )

    const cancelled = stream.cancel()

    expect(cancelled.complete).toBe(false)
    expect(cancelled.issue).toBe("stream_cancelled")
    expect(cancelled.spec?.elements.root.type).toBe("Text")
    expect(stream.push("ignored").issue).toBe("stream_cancelled")
  })

  it("rejects oversized and malformed streams", () => {
    const tooLarge = createFableSpecStream().push("x".repeat(64 * 1024 + 1))
    const malformed = createFableSpecStream().push("{not-json}\n")

    expect(tooLarge.issue).toBe("stream_too_large")
    expect(malformed.issue).toBe("malformed_patch_json")
  })
})
