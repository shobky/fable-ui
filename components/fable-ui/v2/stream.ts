import { createSpecStreamCompiler } from "@json-render/core"
import { z } from "zod"

import {
  FableElementSchema,
  FableIdSchema,
  validateFableViewSpec,
  type FableElement,
  type FableViewSpec,
} from "./catalog"

const MAX_STREAM_BYTES = 64 * 1024
const MAX_PATCH_LINE_BYTES = 16 * 1024
const MAX_ELEMENTS = 32

const patchEnvelopeSchema = z.discriminatedUnion("op", [
  z
    .object({
      op: z.literal("add"),
      path: z.string().max(160),
      value: z.unknown(),
    })
    .strict(),
  z
    .object({
      op: z.literal("replace"),
      path: z.string().max(160),
      value: z.unknown(),
    })
    .strict(),
])

export interface FableStreamUpdate {
  spec: FableViewSpec | null
  acceptedPatches: number
  complete: boolean
  issue?: string
}

type CompilerState = {
  root?: unknown
  elements?: unknown
}

type SafePatch = {
  op: "add" | "replace"
  path: "/root"
  value: string
} | {
  op: "add" | "replace"
  path: `/elements/${string}`
  value: FableElement
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

/**
 * Validates each JSONL patch before the third-party compiler sees it. Only a
 * root ID or one complete, strict Fable element can be added or replaced.
 */
export class FableSpecStream {
  private compiler = createSpecStreamCompiler<CompilerState>({})
  private lineBuffer = ""
  private totalBytes = 0
  private acceptedPatches = 0
  private lastValidSpec: FableViewSpec | null = null
  private issue: string | undefined
  private closed = false
  private complete = false

  push(chunk: string): FableStreamUpdate {
    if (this.closed) return this.closedSnapshot()

    this.totalBytes += byteLength(chunk)
    if (this.totalBytes > MAX_STREAM_BYTES) {
      return this.fail("stream_too_large")
    }

    this.lineBuffer += chunk
    if (byteLength(this.lineBuffer) > MAX_PATCH_LINE_BYTES && !this.lineBuffer.includes("\n")) {
      return this.fail("patch_line_too_large")
    }

    while (true) {
      const newline = this.lineBuffer.indexOf("\n")
      if (newline < 0) break

      const line = this.lineBuffer.slice(0, newline)
      this.lineBuffer = this.lineBuffer.slice(newline + 1)
      if (byteLength(line) > MAX_PATCH_LINE_BYTES) {
        return this.fail("patch_line_too_large")
      }
      if (!this.processLine(line)) return this.snapshot(this.issue)
    }

    if (byteLength(this.lineBuffer) > MAX_PATCH_LINE_BYTES) {
      return this.fail("patch_line_too_large")
    }

    return this.snapshot()
  }

  finish(): FableStreamUpdate {
    if (this.closed) return this.closedSnapshot()

    if (this.lineBuffer.trim().length > 0) {
      const lastLine = this.lineBuffer
      this.lineBuffer = ""
      if (!this.processLine(lastLine)) return this.snapshot(this.issue)
    }

    const projected = this.projectPartialSpec(this.compiler.getResult(), false)
    if (projected.issue || !projected.spec) {
      return this.fail(projected.issue ?? "incomplete_tree")
    }

    this.lastValidSpec = projected.spec
    this.closed = true
    this.complete = true
    return this.snapshot(undefined, true)
  }

  cancel(): FableStreamUpdate {
    if (this.closed) return this.closedSnapshot()

    this.lineBuffer = ""
    this.issue = "stream_cancelled"
    this.closed = true
    return this.snapshot(this.issue)
  }

  private processLine(line: string): boolean {
    if (line.trim().length === 0) return true

    let decoded: unknown
    try {
      decoded = JSON.parse(line)
    } catch {
      this.issue = "malformed_patch_json"
      this.closed = true
      return false
    }

    const envelope = patchEnvelopeSchema.safeParse(decoded)
    if (!envelope.success) {
      this.issue = "invalid_patch_envelope"
      this.closed = true
      return false
    }

    const patch = this.validatePatch(envelope.data)
    if (!patch) {
      this.closed = true
      return false
    }

    if (patch.path === "/root" && patch.op === "replace") {
      return this.replaceRoot(patch.value)
    }

    try {
      const compiled = this.compiler.push(`${JSON.stringify(patch)}\n`)
      this.acceptedPatches += compiled.newPatches.length

      const elements = isRecord(compiled.result.elements)
        ? compiled.result.elements
        : {}
      if (Object.keys(elements).length > MAX_ELEMENTS) {
        this.issue = "too_many_elements"
        this.closed = true
        return false
      }

      const projected = this.projectPartialSpec(compiled.result)
      if (projected.issue) {
        this.issue = projected.issue
        this.closed = true
        return false
      }
      if (projected.spec) this.lastValidSpec = projected.spec
      return true
    } catch {
      this.issue = "patch_compile_failed"
      this.closed = true
      return false
    }
  }

  private validatePatch(
    patch: z.infer<typeof patchEnvelopeSchema>
  ): SafePatch | null {
    if (patch.path === "/root") {
      const id = FableIdSchema.safeParse(patch.value)
      if (!id.success) {
        this.issue = "invalid_root_id"
        return null
      }

      const currentRoot = this.compiler.getResult().root
      if (patch.op === "add" && currentRoot !== undefined) {
        this.issue = "duplicate_root_add"
        return null
      }
      if (patch.op === "replace" && currentRoot === undefined) {
        this.issue = "replace_missing_root"
        return null
      }
      return { op: patch.op, path: "/root", value: id.data }
    }

    const match = /^\/elements\/([A-Za-z0-9][A-Za-z0-9_-]{0,63})$/.exec(patch.path)
    if (!match) {
      this.issue = "invalid_patch_path"
      return null
    }

    const id = FableIdSchema.safeParse(match[1])
    const element = FableElementSchema.safeParse(patch.value)
    if (!id.success || !element.success) {
      this.issue = "invalid_component_schema"
      return null
    }

    const elements = this.compiler.getResult().elements
    const existingElements = isRecord(elements) ? elements : {}
    const exists = Object.hasOwn(existingElements, id.data)
    if (patch.op === "add" && exists) {
      this.issue = "duplicate_element_add"
      return null
    }
    if (patch.op === "replace" && !exists) {
      this.issue = "replace_missing_element"
      return null
    }
    if (!exists && Object.keys(existingElements).length >= MAX_ELEMENTS) {
      this.issue = "too_many_elements"
      return null
    }

    return {
      op: patch.op,
      path: `/elements/${id.data}` as `/elements/${string}`,
      value: element.data,
    }
  }

  private replaceRoot(rootId: string): boolean {
    const current = this.compiler.getResult()
    const currentElements = isRecord(current.elements) ? current.elements : {}
    const nextCompiler = createSpecStreamCompiler<CompilerState>({})
    const pending = [rootId]
    const copied = new Set<string>()

    try {
      nextCompiler.push(`${JSON.stringify({ op: "add", path: "/root", value: rootId })}\n`)

      while (pending.length > 0) {
        const id = pending.pop()
        if (!id || copied.has(id) || !Object.hasOwn(currentElements, id)) continue

        const parsed = FableElementSchema.safeParse(currentElements[id])
        if (!parsed.success) {
          this.issue = "invalid_compiled_element"
          this.closed = true
          return false
        }

        copied.add(id)
        nextCompiler.push(
          `${JSON.stringify({ op: "add", path: `/elements/${id}`, value: parsed.data })}\n`
        )
        pending.push(...parsed.data.children)
      }
    } catch {
      this.issue = "patch_compile_failed"
      this.closed = true
      return false
    }

    this.compiler = nextCompiler
    this.acceptedPatches += 1

    const projected = this.projectPartialSpec(this.compiler.getResult())
    if (projected.issue) {
      this.issue = projected.issue
      this.closed = true
      return false
    }
    if (projected.spec) this.lastValidSpec = projected.spec
    return true
  }

  private projectPartialSpec(
    state: CompilerState,
    allowMissingChildren = true
  ): {
    spec: FableViewSpec | null
    issue?: string
  } {
    const rootResult = FableIdSchema.safeParse(state.root)
    if (!rootResult.success || !isRecord(state.elements)) {
      return { spec: null }
    }

    const available = new Map<string, FableElement>()
    for (const [id, value] of Object.entries(state.elements)) {
      const parsedId = FableIdSchema.safeParse(id)
      const parsedElement = FableElementSchema.safeParse(value)
      if (!parsedId.success || !parsedElement.success) {
        return { spec: null, issue: "invalid_compiled_element" }
      }
      available.set(parsedId.data, parsedElement.data)
    }

    // Root swaps can arrive before their replacement element. Keep the last
    // complete snapshot visible until the new root becomes available.
    if (!available.has(rootResult.data)) return { spec: null }

    const visibleElements: Record<string, FableElement> = {}
    const active = new Set<string>()
    const parentCount = new Map<string, number>()
    let issue: string | undefined

    const visit = (id: string, depth: number) => {
      if (issue) return
      if (depth > 6) {
        issue = "maximum_depth_exceeded"
        return
      }
      if (active.has(id)) {
        issue = "cyclic_tree"
        return
      }
      if (Object.hasOwn(visibleElements, id)) return

      const element = available.get(id)
      if (!element) return
      active.add(id)
      const knownChildren = element.children.filter((childId) => available.has(childId))
      if (!allowMissingChildren && knownChildren.length !== element.children.length) {
        issue = "missing_child"
        active.delete(id)
        return
      }
      visibleElements[id] = { ...element, children: knownChildren }

      for (const childId of knownChildren) {
        const nextParentCount = (parentCount.get(childId) ?? 0) + 1
        parentCount.set(childId, nextParentCount)
        if (nextParentCount > 1) {
          issue = "multiple_parents"
          break
        }
        visit(childId, depth + 1)
      }
      active.delete(id)
    }

    visit(rootResult.data, 1)
    if (issue) return { spec: null, issue }

    const validation = validateFableViewSpec({
      root: rootResult.data,
      elements: visibleElements,
    })
    if (!validation.success) return { spec: null, issue: validation.issues[0] }
    return { spec: validation.data }
  }

  private fail(issue: string): FableStreamUpdate {
    this.issue = issue
    this.closed = true
    return this.snapshot(issue)
  }

  private closedSnapshot(): FableStreamUpdate {
    return this.snapshot(
      this.issue ?? (this.complete ? undefined : "stream_closed"),
      this.complete
    )
  }

  private snapshot(issue?: string, complete = false): FableStreamUpdate {
    return {
      spec: this.lastValidSpec,
      acceptedPatches: this.acceptedPatches,
      complete,
      ...(issue ? { issue } : {}),
    }
  }
}

export function createFableSpecStream(): FableSpecStream {
  return new FableSpecStream()
}

export function encodeFableSpecStream(spec: FableViewSpec): string {
  const validation = validateFableViewSpec(spec)
  if (!validation.success) {
    throw new Error(`Cannot encode invalid Fable spec: ${validation.issues[0]}`)
  }

  const patches = [
    { op: "add", path: "/root", value: validation.data.root },
    ...Object.entries(validation.data.elements).map(([id, element]) => ({
      op: "add",
      path: `/elements/${id}`,
      value: element,
    })),
  ]
  return `${patches.map((patch) => JSON.stringify(patch)).join("\n")}\n`
}
