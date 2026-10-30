import { z } from "zod"

import { isSafeLocalAssetPath } from "@/components/fable-ui/v2/asset-utils"
import {
  isSafeFableLinkHref,
  MAX_FABLE_HOST_LINKS,
  MAX_FABLE_LINK_HREF_CHARS,
  MAX_FABLE_RICH_CONTENT_BLOCKS,
  MAX_FABLE_RICH_CONTENT_CODE_CHARS,
  MAX_FABLE_RICH_CONTENT_ELEMENT_BYTES,
  MAX_FABLE_RICH_CONTENT_LIST_ITEMS,
  MAX_FABLE_RICH_CONTENT_SPANS,
  MAX_FABLE_RICH_CONTENT_TEXT_CHARS,
  MAX_FABLE_RICH_CONTENT_TOTAL_CHARS,
} from "./rich-content-utils"

const reservedIds = new Set(["__proto__", "prototype", "constructor"])

export const FableIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/)
  .refine((value) => !reservedIds.has(value))

const shortText = (max: number) => z.string().trim().min(1).max(max)
const localeSchema = z
  .string()
  .max(32)
  .refine((locale) => {
    try {
      Intl.getCanonicalLocales(locale)
      return true
    } catch {
      return false
    }
  })
const gapSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(6),
  z.literal(8),
])
const childrenSchema = z.array(FableIdSchema).max(24)
const leafChildrenSchema = z.array(FableIdSchema).max(0)

const textPropsSchema = z
  .object({
    content: z.string().max(2000),
    level: z.enum(["body", "heading", "caption"]),
  })
  .strict()

const richTextPropsSchema = z
  .object({
    spans: z
      .array(
        z
          .object({
            text: z.string().max(240),
            mark: z.enum(["plain", "strong", "emphasis", "code"]),
          })
          .strict()
      )
      .max(16),
  })
  .strict()

const richContentInlineSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("text"),
      text: z.string().max(MAX_FABLE_RICH_CONTENT_TEXT_CHARS),
      mark: z.enum(["plain", "strong", "emphasis", "code"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("link"),
      linkId: FableIdSchema,
    })
    .strict(),
])

const richContentSpansSchema = z
  .array(richContentInlineSchema)
  .min(1)
  .max(MAX_FABLE_RICH_CONTENT_SPANS)

const richContentBlockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("paragraph"),
      spans: richContentSpansSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3)]),
      spans: richContentSpansSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z
        .array(richContentSpansSchema)
        .min(1)
        .max(MAX_FABLE_RICH_CONTENT_LIST_ITEMS),
    })
    .strict(),
  z
    .object({
      type: z.literal("quote"),
      spans: richContentSpansSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("code"),
      code: z.string().min(1).max(MAX_FABLE_RICH_CONTENT_CODE_CHARS),
      language: z
        .string()
        .regex(/^[A-Za-z0-9+#.-]{1,24}$/)
        .optional(),
    })
    .strict(),
])

const richContentPropsSchema = z
  .object({
    blocks: z
      .array(richContentBlockSchema)
      .min(1)
      .max(MAX_FABLE_RICH_CONTENT_BLOCKS),
  })
  .strict()
  .superRefine((props, context) => {
    const totalChars = props.blocks.reduce((total, block) => {
      if (block.type === "code") return total + block.code.length
      const spans = block.type === "list" ? block.items.flat() : block.spans
      return (
        total +
        spans.reduce(
          (spanTotal, span) =>
            spanTotal + (span.type === "text" ? span.text.length : 0),
          0
        )
      )
    }, 0)

    if (totalChars > MAX_FABLE_RICH_CONTENT_TOTAL_CHARS) {
      context.addIssue({
        code: "custom",
        message: "rich_content_total_text_too_large",
        path: ["blocks"],
      })
    }
  })

const metricPropsSchema = z
  .object({
    resultId: FableIdSchema,
  })
  .strict()

const entityListPropsSchema = z
  .object({
    resultId: FableIdSchema,
    filterId: FableIdSchema.optional(),
  })
  .strict()

const chartPropsSchema = z
  .object({
    resultId: FableIdSchema,
  })
  .strict()

const filterPropsSchema = z
  .object({
    filterId: FableIdSchema,
  })
  .strict()

const mediaPropsSchema = z
  .object({
    assetId: FableIdSchema,
  })
  .strict()

const stackPropsSchema = z
  .object({
    direction: z.enum(["vertical", "horizontal"]),
    gap: gapSchema,
  })
  .strict()

const gridPropsSchema = z
  .object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    gap: gapSchema,
  })
  .strict()

const sectionPropsSchema = z
  .object({
    title: shortText(120).optional(),
    gap: gapSchema,
  })
  .strict()

const surfacePropsSchema = z
  .object({
    variant: z.enum(["plain", "outlined", "subtle"]),
    padding: gapSchema,
  })
  .strict()

const fableElementSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("Text"),
      props: textPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("RichText"),
      props: richTextPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("RichContent"),
      props: richContentPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Metric"),
      props: metricPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("EntityList"),
      props: entityListPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Chart"),
      props: chartPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Filter"),
      props: filterPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Media"),
      props: mediaPropsSchema,
      children: leafChildrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Stack"),
      props: stackPropsSchema,
      children: childrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Grid"),
      props: gridPropsSchema,
      children: childrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Section"),
      props: sectionPropsSchema,
      children: childrenSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("Surface"),
      props: surfacePropsSchema,
      children: childrenSchema,
    })
    .strict(),
])

export const FableElementSchema = fableElementSchema.superRefine(
  (element, context) => {
    if (element.type !== "RichContent") return

    const elementBytes = new TextEncoder().encode(
      JSON.stringify(element)
    ).byteLength
    if (elementBytes > MAX_FABLE_RICH_CONTENT_ELEMENT_BYTES) {
      context.addIssue({
        code: "custom",
        message: "rich_content_element_too_large",
        path: ["props", "blocks"],
      })
    }
  }
)

export const FableViewSpecSchema = z
  .object({
    root: FableIdSchema,
    elements: z.record(FableIdSchema, FableElementSchema),
  })
  .strict()

const metricResultSchema = z
  .object({
    kind: z.literal("metric"),
    label: shortText(120),
    value: z.number().finite(),
    format: z.enum(["number", "currency", "percent"]),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    unit: z.string().max(40).optional(),
    locale: localeSchema.optional(),
  })
  .strict()
  .refine(
    (result) => result.format !== "currency" || result.currency !== undefined
  )

const entityItemSchema = z
  .object({
    id: FableIdSchema,
    name: shortText(120),
    location: shortText(80),
    description: z.string().max(240),
    value: z.number().finite(),
    unit: z.string().max(40).optional(),
    changePercent: z.number().finite().optional(),
    filterValues: z.record(FableIdSchema, shortText(80)).optional(),
  })
  .strict()

const entityListResultSchema = z
  .object({
    kind: z.literal("entity-list"),
    label: shortText(120),
    valueLabel: shortText(80).optional(),
    locale: localeSchema.optional(),
    items: z.array(entityItemSchema).max(20),
  })
  .strict()
  .superRefine((result, context) => {
    const ids = new Set<string>()
    for (const item of result.items) {
      if (ids.has(item.id)) {
        context.addIssue({ code: "custom", message: "duplicate_entity_id" })
      }
      ids.add(item.id)
    }
  })

const chartResultSchema = z
  .object({
    kind: z.literal("chart"),
    label: shortText(120),
    points: z
      .array(
        z
          .object({
            label: shortText(40),
            value: z.number().finite(),
          })
          .strict()
      )
      .min(1)
      .max(12),
    format: z.enum(["number", "currency", "percent"]).default("number"),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    locale: localeSchema.optional(),
  })
  .strict()
  .refine(
    (result) => result.format !== "currency" || result.currency !== undefined
  )

const filterResultSchema = z
  .object({
    kind: z.literal("filter"),
    label: shortText(80),
    allValue: FableIdSchema,
    options: z
      .array(
        z
          .object({
            label: shortText(80),
            value: FableIdSchema,
          })
          .strict()
      )
      .min(1)
      .max(12),
  })
  .strict()
  .superRefine((filter, context) => {
    const values = new Set<string>()
    for (const option of filter.options) {
      if (values.has(option.value)) {
        context.addIssue({ code: "custom", message: "duplicate_filter_value" })
      }
      values.add(option.value)
    }
    if (!values.has(filter.allValue)) {
      context.addIssue({ code: "custom", message: "missing_all_filter_value" })
    }
  })

export const FableViewDataResultSchema = z.discriminatedUnion("kind", [
  metricResultSchema,
  entityListResultSchema,
  chartResultSchema,
  filterResultSchema,
])

export const FableViewDataSchema = z
  .record(FableIdSchema, FableViewDataResultSchema)
  .superRefine((results, context) => {
    if (Object.keys(results).length > 64) {
      context.addIssue({ code: "custom", message: "too_many_results" })
    }
  })

const hostAssetSchema = z
  .object({
    src: z.string().max(240),
    alt: z.string().max(200),
    decorative: z.boolean().default(false),
  })
  .strict()
  .refine((asset) => asset.decorative || asset.alt.trim().length > 0)

export const FableAssetCatalogSchema = z
  .record(FableIdSchema, hostAssetSchema)
  .superRefine((assets, context) => {
    if (Object.keys(assets).length > 24) {
      context.addIssue({ code: "custom", message: "too_many_assets" })
    }
    for (const [assetId, asset] of Object.entries(assets)) {
      if (!isSafeLocalAssetPath(asset.src)) {
        context.addIssue({
          code: "custom",
          message: "unsafe_asset_path",
          path: [assetId],
        })
      }
    }
  })

const hostLinkSchema = z
  .object({
    href: z.string().max(MAX_FABLE_LINK_HREF_CHARS).refine(isSafeFableLinkHref),
    label: shortText(120),
  })
  .strict()

export const FableLinkCatalogSchema = z
  .record(FableIdSchema, hostLinkSchema)
  .superRefine((links, context) => {
    if (Object.keys(links).length > MAX_FABLE_HOST_LINKS) {
      context.addIssue({ code: "custom", message: "too_many_host_links" })
    }
  })

export type FableElement = z.infer<typeof FableElementSchema>
export type FableViewSpec = z.infer<typeof FableViewSpecSchema>
export type FableViewDataResult = z.infer<typeof FableViewDataResultSchema>
export type FableViewData = z.infer<typeof FableViewDataSchema>
export type FableAssetCatalog = z.infer<typeof FableAssetCatalogSchema>
export type FableHostLinkCatalog = z.infer<typeof FableLinkCatalogSchema>
export type FableMetricResult = z.infer<typeof metricResultSchema>
export type FableEntityListResult = z.infer<typeof entityListResultSchema>
export type FableChartResult = z.infer<typeof chartResultSchema>
export type FableFilterResult = z.infer<typeof filterResultSchema>
export type FableEntityItem = z.infer<typeof entityItemSchema>

export type FableSpecValidation =
  { success: true; data: FableViewSpec } | { success: false; issues: string[] }

export function validateFableViewSpec(input: unknown): FableSpecValidation {
  const parsed = FableViewSpecSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, issues: ["invalid_component_schema"] }
  }

  const { root, elements } = parsed.data
  const elementIds = Object.keys(elements)
  if (elementIds.length === 0 || elementIds.length > 32) {
    return { success: false, issues: ["invalid_element_count"] }
  }
  if (!Object.hasOwn(elements, root)) {
    return { success: false, issues: ["root_not_found"] }
  }

  const visited = new Set<string>()
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
    if (visited.has(id)) return

    const element = elements[id]
    if (!element) {
      issue = "missing_child"
      return
    }

    visited.add(id)
    active.add(id)
    for (const childId of element.children) {
      if (!Object.hasOwn(elements, childId)) {
        issue = "missing_child"
        break
      }
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

  visit(root, 1)
  if (issue) return { success: false, issues: [issue] }
  if (visited.size !== elementIds.length) {
    return { success: false, issues: ["orphaned_element"] }
  }

  return { success: true, data: parsed.data }
}
