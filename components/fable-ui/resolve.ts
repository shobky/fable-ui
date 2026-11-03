import { z } from "zod"

import {
  ContentBlockSchema,
  LAYOUT_BLOCKS,
  STREAMABLE_BLOCKS,
  type ContentBlock,
  type FableBlockType,
} from "./schema"

/**
 * Turns a possibly-partial spec (from a streaming tool call) into a tree the
 * renderer can draw without guessing:
 *
 * - closed blocks are validated on their own; a bad block never takes the
 *   rest of the answer down with it;
 * - the one open block streams its content when that is meaningful, or
 *   becomes a skeleton that reserves its footprint;
 * - keys are positional, so local state survives every new chunk.
 */

export type Resolved =
  | { kind: "content"; key: string; block: ContentBlock; open: boolean }
  | { kind: "pending"; key: string; type?: string }
  | { kind: "invalid"; key: string; type?: string; issue: string }
  | {
      kind: "columns"
      key: string
      ratio: "equal" | "wide-left" | "wide-right"
      columns: Resolved[][]
    }
  | {
      kind: "section"
      key: string
      title?: string
      description?: string
      variant: "plain" | "card" | "muted"
      children: Resolved[]
    }
  | { kind: "tabs"; key: string; tabs: { label: string; children: Resolved[] }[] }

export interface ResolvedSpec {
  title?: string
  items: Resolved[]
  /** Blocks dropped because they failed validation. */
  invalidCount: number
}

const MAX_TOP_LEVEL = 24
const MAX_CHILDREN = 12

const str = (max: number) =>
  z
    .string()
    .transform((value) => value.slice(0, max))
    .optional()
    .catch(undefined)

const sectionHeader = z.object({
  title: str(120),
  description: str(300),
  variant: z.enum(["plain", "card", "muted"]).optional().catch(undefined),
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Removes the trailing, most deeply nested array element (the one still being written). */
export function dropOpenTail(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined
    const last = value[value.length - 1]
    const trimmed = typeof last === "object" && last !== null ? dropOpenTail(last) : undefined
    return trimmed === undefined ? value.slice(0, -1) : [...value.slice(0, -1), trimmed]
  }
  if (isRecord(value)) {
    const keys = Object.keys(value)
    for (let index = keys.length - 1; index >= 0; index--) {
      const child = value[keys[index]]
      if (typeof child === "object" && child !== null) {
        const trimmed = dropOpenTail(child)
        if (trimmed !== undefined) return { ...value, [keys[index]]: trimmed }
      }
    }
  }
  return undefined
}

/**
 * Trims strings and arrays that are over their limit, which is the most
 * common way a good block fails (a button label a few characters too long).
 * Returns null when nothing could be repaired.
 */
function trimOversized(raw: unknown, issues: z.core.$ZodIssue[]): unknown {
  const fixable = issues.filter((issue) => issue.code === "too_big" && typeof issue.maximum === "number")
  if (!fixable.length || fixable.length !== issues.length) return null
  const copy = structuredClone(raw)
  for (const issue of fixable) {
    const parentPath = issue.path.slice(0, -1)
    const last = issue.path[issue.path.length - 1]
    let parent: unknown = copy
    for (const segment of parentPath) parent = (parent as Record<PropertyKey, unknown>)?.[segment as PropertyKey]
    if (!parent || typeof parent !== "object" || last === undefined) return null
    const record = parent as Record<PropertyKey, unknown>
    const value = record[last as PropertyKey]
    const max = Number((issue as { maximum: number | bigint }).maximum)
    if (typeof value === "string") record[last as PropertyKey] = `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`.slice(0, max)
    else if (Array.isArray(value)) record[last as PropertyKey] = value.slice(0, max)
    else return null
  }
  return copy
}

function parseContent(raw: unknown) {
  let parsed = ContentBlockSchema.safeParse(raw)
  for (let attempt = 0; attempt < 2 && !parsed.success; attempt++) {
    const repaired = trimOversized(raw, parsed.error.issues)
    if (repaired === null) break
    raw = repaired
    parsed = ContentBlockSchema.safeParse(raw)
  }
  return parsed
}

function parseOpen(raw: unknown) {
  let candidate: unknown = raw
  for (let attempt = 0; attempt < 4 && candidate !== undefined; attempt++) {
    const parsed = parseContent(candidate)
    if (parsed.success) return parsed.data
    candidate = dropOpenTail(candidate)
  }
  return null
}

function typeOf(raw: unknown): string | undefined {
  return isRecord(raw) && typeof raw.type === "string" ? raw.type : undefined
}

function resolveContent(raw: unknown, key: string, open: boolean): Resolved {
  const type = typeOf(raw)

  if (open) {
    if (!type || !STREAMABLE_BLOCKS.has(type as FableBlockType)) return { kind: "pending", key, type }
    const block = parseOpen(raw)
    return block ? { kind: "content", key, block, open: true } : { kind: "pending", key, type }
  }

  const parsed = parseContent(raw)
  if (parsed.success) return { kind: "content", key, block: parsed.data, open: false }
  const issue = parsed.error.issues[0]
  return {
    kind: "invalid",
    key,
    type,
    issue: issue ? `${issue.path.join(".") || "block"}: ${issue.message}` : "invalid block",
  }
}

function resolveChildren(raw: unknown, key: string, open: boolean): Resolved[] {
  if (!Array.isArray(raw)) return open ? [{ kind: "pending", key: `${key}.0` }] : []
  const list = raw.slice(0, MAX_CHILDREN)
  return list.map((child, index) =>
    resolveContent(child, `${key}.${index}`, open && index === list.length - 1)
  )
}

function resolveBlock(raw: unknown, key: string, open: boolean): Resolved {
  const type = typeOf(raw)
  if (!type || !LAYOUT_BLOCKS.has(type as FableBlockType) || !isRecord(raw)) {
    return resolveContent(raw, key, open)
  }

  if (type === "columns") {
    const columns = Array.isArray(raw.columns) ? raw.columns.slice(0, 3) : []
    const ratio = raw.ratio === "wide-left" || raw.ratio === "wide-right" ? raw.ratio : "equal"
    if (columns.length === 0) {
      return open ? { kind: "pending", key, type } : { kind: "invalid", key, type, issue: "columns: empty" }
    }
    return {
      kind: "columns",
      key,
      ratio,
      columns: columns.map((column, index) =>
        resolveChildren(
          isRecord(column) ? column.blocks : undefined,
          `${key}.${index}`,
          open && index === columns.length - 1
        )
      ),
    }
  }

  if (type === "section") {
    const header = sectionHeader.parse(raw)
    return {
      kind: "section",
      key,
      title: header.title,
      description: header.description,
      variant: header.variant ?? "plain",
      children: resolveChildren(raw.blocks, key, open),
    }
  }

  const tabs = Array.isArray(raw.tabs) ? raw.tabs.slice(0, 6) : []
  const usable = tabs
    .map((tab, index) => ({ tab, index }))
    .filter(({ tab }) => isRecord(tab) && typeof tab.label === "string" && tab.label.length > 0)
  if (usable.length === 0) {
    return open ? { kind: "pending", key, type } : { kind: "invalid", key, type, issue: "tabs: empty" }
  }
  return {
    kind: "tabs",
    key,
    tabs: usable.map(({ tab, index }) => {
      const record = tab as Record<string, unknown>
      return {
        label: String(record.label).slice(0, 40),
        children: resolveChildren(record.blocks, `${key}.${index}`, open && index === tabs.length - 1),
      }
    }),
  }
}

/** Every skipped block with its position, e.g. "block 2.1 (table): rows: Required". */
export function listIssues(items: Resolved[]): string[] {
  return items.flatMap((item) => {
    if (item.kind === "invalid") return [`block ${item.key} (${item.type ?? "unknown"}): ${item.issue}`]
    if (item.kind === "columns") return item.columns.flatMap(listIssues)
    if (item.kind === "section") return listIssues(item.children)
    if (item.kind === "tabs") return item.tabs.flatMap((tab) => listIssues(tab.children))
    return []
  })
}

function countInvalid(items: Resolved[]): number {
  return items.reduce((total, item) => {
    if (item.kind === "invalid") return total + 1
    if (item.kind === "columns") return total + item.columns.reduce((sum, column) => sum + countInvalid(column), 0)
    if (item.kind === "section") return total + countInvalid(item.children)
    if (item.kind === "tabs") return total + item.tabs.reduce((sum, tab) => sum + countInvalid(tab.children), 0)
    return total
  }, 0)
}

export function resolveSpec(input: unknown, streaming = false): ResolvedSpec {
  const spec = isRecord(input) ? input : {}
  const blocks = Array.isArray(spec.blocks) ? spec.blocks.slice(0, MAX_TOP_LEVEL) : []
  const items = blocks.map((block, index) =>
    resolveBlock(block, String(index), streaming && index === blocks.length - 1)
  )
  if (streaming && items.length === 0) items.push({ kind: "pending", key: "0" })
  return {
    title: typeof spec.title === "string" ? spec.title.slice(0, 120) : undefined,
    items,
    invalidCount: countInvalid(items),
  }
}
