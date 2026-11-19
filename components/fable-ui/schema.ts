import { z } from "zod"

/**
 * The Fable catalog: every block the model may write, with hard bounds.
 *
 * Server-safe (no React). Objects strip unknown keys instead of failing so a
 * slightly-off model still renders; bounds are strict so a runaway model
 * cannot render unbounded content. Layout blocks contain content blocks and
 * never nest, which keeps the JSON Schema non-recursive for every provider.
 */

const text = (max: number) => z.string().max(max)
const label = (max = 80) => z.string().min(1).max(max)
const markdown = (max = 12_000) =>
  z.string().max(max).describe("GitHub-flavored Markdown. No HTML, no images.")

const tone = z.enum(["neutral", "info", "success", "warning", "danger"])
const scalar = z.union([z.string().max(400), z.number(), z.boolean(), z.null()])

export const FABLE_ICONS = [
  "arrow-right",
  "calendar",
  "check",
  "copy",
  "download",
  "edit",
  "external-link",
  "file",
  "heart",
  "info",
  "mail",
  "map-pin",
  "phone",
  "play",
  "plus",
  "refresh",
  "search",
  "send",
  "share",
  "sparkles",
  "star",
] as const

export const FABLE_DOWNLOAD_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/calendar",
] as const

const icon = z.enum(FABLE_ICONS)
const buttonStyle = z.enum(["primary", "secondary", "outline", "ghost"])

// ---------------------------------------------------------------- actions

const actionBase = {
  label: label(48),
  style: buttonStyle.optional(),
  icon: icon.optional(),
}

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    ...actionBase,
    type: z.literal("reply"),
    message: label(600).describe("Sent as the user's next message."),
  }),
  z.object({
    ...actionBase,
    type: z.literal("link"),
    url: label(2048).describe("https:// or mailto: only."),
  }),
  z.object({
    ...actionBase,
    type: z.literal("copy"),
    text: label(20_000),
  }),
  z.object({
    ...actionBase,
    type: z.literal("download"),
    filename: label(100),
    mimeType: z.enum(FABLE_DOWNLOAD_TYPES).optional(),
    content: label(60_000),
  }),
  z.object({
    ...actionBase,
    type: z.literal("host"),
    action: z
      .string()
      .regex(/^[a-z][a-z0-9_.-]{0,63}$/)
      .describe("Name of an action the app registered. Never invent names."),
    payload: z.record(z.string().max(64), scalar).optional(),
  }),
])

// ---------------------------------------------------------------- media

export const ImageSchema = z.object({
  src: label(2048).describe("Absolute https URL of an image."),
  alt: text(240),
  caption: text(240).optional(),
  credit: text(120).optional(),
})

// ---------------------------------------------------------------- content blocks

const MarkdownBlock = z.object({
  type: z.literal("markdown"),
  text: markdown(),
})

const HeadingBlock = z.object({
  type: z.literal("heading"),
  text: label(160),
  eyebrow: text(60).optional(),
  description: text(400).optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
})

const CalloutBlock = z.object({
  type: z.literal("callout"),
  tone: z.enum(["info", "success", "warning", "danger", "tip"]),
  title: text(120).optional(),
  text: markdown(2_000),
})

const MetricsBlock = z.object({
  type: z.literal("metrics"),
  items: z
    .array(
      z.object({
        label: label(60),
        value: z.union([z.number(), z.string().max(40)]),
        format: z.enum(["number", "currency", "percent", "compact"]).optional(),
        currency: z.string().regex(/^[A-Z]{3}$/).optional(),
        delta: z.number().optional().describe("Change, in percent."),
        deltaLabel: text(40).optional(),
        invertDelta: z.boolean().optional().describe("True when lower is better."),
        hint: text(80).optional(),
      })
    )
    .min(1)
    .max(8),
})

const columnType = z.enum([
  "text",
  "number",
  "currency",
  "percent",
  "date",
  "badge",
  "link",
])

const TableBlock = z.object({
  type: z.literal("table"),
  title: text(120).optional(),
  description: text(300).optional(),
  columns: z
    .array(
      z.object({
        key: z.string().min(1).max(40),
        label: label(60),
        type: columnType.optional(),
        currency: z.string().regex(/^[A-Z]{3}$/).optional(),
        align: z.enum(["start", "end", "center"]).optional(),
      })
    )
    .min(1)
    .max(12),
  rows: z.array(z.record(z.string().max(40), scalar)).max(200),
  footer: z.record(z.string().max(40), scalar).optional(),
  sortable: z.boolean().optional(),
  searchable: z.boolean().optional(),
  downloadable: z.boolean().optional().describe("Shows a CSV download button."),
})

const ChartBlock = z.object({
  type: z.literal("chart"),
  kind: z.enum(["bar", "line", "area", "pie", "donut"]),
  title: text(120).optional(),
  description: text(300).optional(),
  xKey: z.string().min(1).max(40).describe("Key of the category field in data."),
  series: z
    .array(z.object({ key: z.string().min(1).max(40), label: label(60) }))
    .min(1)
    .max(5),
  data: z.array(z.record(z.string().max(40), z.union([z.string().max(60), z.number(), z.null()]))).min(1).max(60),
  format: z.enum(["number", "currency", "percent", "compact"]).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  stacked: z.boolean().optional(),
  horizontal: z.boolean().optional(),
})

const DetailsBlock = z.object({
  type: z.literal("details"),
  title: text(120).optional(),
  items: z
    .array(z.object({ label: label(60), value: text(400), tone: tone.optional() }))
    .min(1)
    .max(24),
  columns: z.union([z.literal(1), z.literal(2)]).optional(),
})

const ListBlock = z.object({
  type: z.literal("list"),
  title: text(120).optional(),
  style: z.enum(["bullet", "numbered", "check", "steps", "timeline"]),
  items: z
    .array(
      z.object({
        title: label(160),
        description: text(600).optional(),
        meta: text(60).optional().describe("Date for timelines, duration for steps."),
        status: z.enum(["done", "current", "upcoming"]).optional(),
      })
    )
    .min(1)
    .max(30),
})

const ChecklistBlock = z.object({
  type: z.literal("checklist"),
  title: text(120).optional(),
  items: z
    .array(z.object({ label: label(200), checked: z.boolean().optional(), note: text(200).optional() }))
    .min(1)
    .max(40),
})

const CodeBlock = z.object({
  type: z.literal("code"),
  code: label(20_000),
  language: z.string().regex(/^[A-Za-z0-9+#.-]{1,24}$/).optional(),
  filename: text(100).optional(),
})

const QuoteBlock = z.object({
  type: z.literal("quote"),
  text: label(800),
  author: text(80).optional(),
  source: text(120).optional(),
})

const ImageBlock = z.object({
  type: z.literal("image"),
  image: ImageSchema,
  aspect: z.enum(["auto", "square", "landscape", "portrait", "wide"]).optional(),
})

const GalleryBlock = z.object({
  type: z.literal("gallery"),
  title: text(120).optional(),
  layout: z
    .enum(["grid", "featured", "masonry", "carousel"])
    .describe("grid: even tiles. featured: one large + small. masonry: mixed heights. carousel: swipeable row."),
  images: z.array(ImageSchema).min(1).max(24),
})

const CardsBlock = z.object({
  type: z.literal("cards"),
  title: text(120).optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  items: z
    .array(
      z.object({
        title: label(120),
        description: text(400).optional(),
        image: ImageSchema.optional(),
        badge: text(32).optional(),
        meta: text(80).optional(),
        action: ActionSchema.optional(),
      })
    )
    .min(1)
    .max(12),
})

const HeroBlock = z.object({
  type: z.literal("hero"),
  variant: z
    .enum(["split", "cover", "editorial", "spotlight"])
    .describe("split: text beside image. cover: text over image. editorial: big type, no image. spotlight: centered, accent background."),
  eyebrow: text(60).optional(),
  title: label(160),
  description: text(600).optional(),
  image: ImageSchema.optional(),
  stats: z.array(z.object({ label: label(40), value: label(24) })).max(4).optional(),
  actions: z.array(ActionSchema).max(3).optional(),
})

const ArticleBlock = z.object({
  type: z.literal("article"),
  title: label(200),
  subtitle: text(400).optional(),
  byline: text(120).optional(),
  readingTime: text(32).optional(),
  cover: ImageSchema.optional(),
  sections: z
    .array(z.object({ heading: text(160).optional(), body: markdown(8_000) }))
    .min(1)
    .max(20),
})

const fieldType = z.enum([
  "text",
  "textarea",
  "email",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "toggle",
])

const FormBlock = z.object({
  type: z.literal("form"),
  title: text(120).optional(),
  description: text(400).optional(),
  fields: z
    .array(
      z.object({
        name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,39}$/),
        label: label(80),
        type: fieldType,
        placeholder: text(120).optional(),
        helper: text(200).optional(),
        required: z.boolean().optional(),
        options: z.array(label(80)).max(20).optional().describe("For select and radio."),
        defaultValue: z.union([z.string().max(400), z.number(), z.boolean()]).optional(),
      })
    )
    .min(1)
    .max(16),
  submitLabel: text(40).optional(),
})

const TemplateBlock = z.object({
  type: z.literal("template"),
  title: text(120).optional(),
  description: text(300).optional(),
  body: label(20_000).describe("Text with {{variable}} placeholders the user can fill."),
  variables: z
    .array(z.object({ name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,39}$/), label: label(60), value: text(200).optional() }))
    .max(20)
    .optional(),
  filename: text(100).optional(),
})

const EmailBlock = z.object({
  type: z.literal("email"),
  to: z.array(z.string().max(254)).max(10).optional(),
  cc: z.array(z.string().max(254)).max(10).optional(),
  subject: text(200),
  body: label(20_000),
  sendAction: z
    .string()
    .regex(/^[a-z][a-z0-9_.-]{0,63}$/)
    .optional()
    .describe("Host action that sends the email, only if the app registered one."),
})

const ActionsBlock = z.object({
  type: z.literal("actions"),
  items: z.array(ActionSchema).min(1).max(6),
})

const FileBlock = z.object({
  type: z.literal("file"),
  filename: label(100),
  description: text(200).optional(),
  mimeType: z.enum(FABLE_DOWNLOAD_TYPES).optional(),
  content: label(60_000),
})

const SourcesBlock = z.object({
  type: z.literal("sources"),
  items: z
    .array(z.object({ title: label(200), url: label(2048), publisher: text(80).optional(), snippet: text(300).optional() }))
    .min(1)
    .max(12),
})

const FaqBlock = z.object({
  type: z.literal("faq"),
  title: text(120).optional(),
  items: z.array(z.object({ question: label(200), answer: markdown(3_000) })).min(1).max(20),
})

const DividerBlock = z.object({
  type: z.literal("divider"),
  label: text(60).optional(),
})

export const CONTENT_BLOCKS = {
  markdown: MarkdownBlock,
  heading: HeadingBlock,
  callout: CalloutBlock,
  metrics: MetricsBlock,
  table: TableBlock,
  chart: ChartBlock,
  details: DetailsBlock,
  list: ListBlock,
  checklist: ChecklistBlock,
  code: CodeBlock,
  quote: QuoteBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  cards: CardsBlock,
  hero: HeroBlock,
  article: ArticleBlock,
  form: FormBlock,
  template: TemplateBlock,
  email: EmailBlock,
  actions: ActionsBlock,
  file: FileBlock,
  sources: SourcesBlock,
  faq: FaqBlock,
  divider: DividerBlock,
} as const

export type ContentBlockType = keyof typeof CONTENT_BLOCKS
export type LayoutBlockType = "columns" | "section" | "tabs"
export type FableBlockType = ContentBlockType | LayoutBlockType

/**
 * Blocks whose partial content is meaningful while streaming. Others show a
 * size-reserving skeleton until they close, so a half-written image URL or
 * a form without all its fields never renders.
 */
export const STREAMABLE_BLOCKS = new Set<FableBlockType>([
  "markdown",
  "heading",
  "callout",
  "metrics",
  "table",
  "details",
  "list",
  "code",
  "quote",
  "article",
  "faq",
  "sources",
  "divider",
  "columns",
  "section",
  "tabs",
])

export const LAYOUT_BLOCKS = new Set<FableBlockType>(["columns", "section", "tabs"])

const ALL_CONTENT = [
  MarkdownBlock, HeadingBlock, CalloutBlock, MetricsBlock, TableBlock, ChartBlock, DetailsBlock, ListBlock,
  ChecklistBlock, CodeBlock, QuoteBlock, ImageBlock, GalleryBlock, CardsBlock, HeroBlock, ArticleBlock,
  FormBlock, TemplateBlock, EmailBlock, ActionsBlock, FileBlock, SourcesBlock, FaqBlock, DividerBlock,
] as const

function buildSchemas(include?: readonly ContentBlockType[], mode: "strict" | "model" = "strict") {
  const entries = ALL_CONTENT.filter((schema) => !include || include.includes(schema.shape.type.value))
  if (entries.length === 0) throw new Error("Fable catalog needs at least one block.")

  // A subset is still one of these shapes at runtime; the static type is the full union.
  const content = z.discriminatedUnion("type", entries as unknown as typeof ALL_CONTENT)
  const names = entries.map((schema) => schema.shape.type.value) as [ContentBlockType, ...ContentBlockType[]]

  // The model-facing schema describes layout children by reference to the
  // top-level shapes instead of repeating the whole union three more times
  // (that would quadruple the tool definition). Children are still validated
  // strictly, one by one, before they render.
  const child =
    mode === "model"
      ? (z
          .looseObject({ type: z.enum(names) })
          .describe("A content block with exactly the same shape as a top-level block of this type.") as unknown as typeof content)
      : content
  const children = z.array(child).min(1).max(12)

  const layout = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("columns"),
      ratio: z
        .enum(["equal", "wide-left", "wide-right"])
        .optional()
        .describe("Column width ratio. Two or three columns; stacks on phones."),
      columns: z.array(z.object({ blocks: children })).min(2).max(3),
    }),
    z.object({
      type: z.literal("section"),
      title: text(120).optional(),
      description: text(300).optional(),
      variant: z.enum(["plain", "card", "muted"]).optional(),
      blocks: children,
    }),
    z.object({
      type: z.literal("tabs"),
      tabs: z.array(z.object({ label: label(40), blocks: children })).min(2).max(6),
    }),
  ])

  const block = z.union([content, layout])
  const spec = z.object({
    title: text(120).optional().describe("Short title used for copy/export. Not displayed."),
    blocks: z.array(block).min(1).max(24),
  })

  return { content, layout, block, spec }
}

const defaultSchemas = buildSchemas()

export const ContentBlockSchema = defaultSchemas.content
export const LayoutBlockSchema = defaultSchemas.layout
export const BlockSchema = defaultSchemas.block
/** Strict: every nested block is validated. Use it to check a spec. */
export const FableSpecSchema = defaultSchemas.spec

/**
 * The compact schema sent to the model as the tool input. Smaller catalogs
 * (`include`) mean a shorter definition and fewer wrong picks.
 */
export function createFableToolSchema(include?: readonly ContentBlockType[]) {
  return buildSchemas(include, "model").spec
}

/** Strict schema for a subset of blocks. */
export function createFableSpecSchema(include?: readonly ContentBlockType[]) {
  return include ? buildSchemas(include).spec : FableSpecSchema
}

export type FableAction = z.infer<typeof ActionSchema>
export type FableImage = z.infer<typeof ImageSchema>
export type ContentBlock = z.infer<typeof ContentBlockSchema>
export type LayoutBlock = z.infer<typeof LayoutBlockSchema>
export type FableBlock = z.infer<typeof BlockSchema>
export type FableSpec = z.infer<typeof FableSpecSchema>
export type BlockOf<T extends FableBlockType> = Extract<FableBlock, { type: T }>
