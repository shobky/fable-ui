import type { ContentBlockType } from "./schema"

export interface FablePromptOptions {
  /** Name of the render tool. Defaults to "render_ui". */
  toolName?: string
  /** Blocks the tool accepts; the guide only mentions these. */
  include?: readonly ContentBlockType[]
  /** Host actions the app registered, with what they do. */
  hostActions?: Record<string, string>
  /**
   * Where images may come from. Without a source, the model is told not to
   * use image blocks, because invented URLs are always broken.
   */
  imageSource?: string
}

const guide: Partial<Record<ContentBlockType, string>> = {
  markdown: "markdown — prose, the default. Short paragraphs, bold key terms, lists.",
  heading: "heading — titles a multi-part answer. Optional eyebrow and one-line description.",
  callout: "callout — one warning, tip, or key takeaway. Never more than two per answer.",
  metrics: "metrics — 1–8 headline numbers with optional % delta.",
  table: "table — comparisons and records. Typed columns (number, currency, percent, date, badge, link). Use badge for statuses.",
  chart: "chart — trends (line/area), comparisons (bar), shares of a whole (pie/donut, ≤ 6 slices).",
  details: "details — label/value facts about one thing (specs, a booking, an order).",
  list: "list — bullet/numbered/check items, steps (a process, with status), or a timeline (with dates in meta).",
  checklist: "checklist — tasks the user will tick off themselves.",
  code: "code — code or commands, with language.",
  quote: "quote — a notable quotation with attribution.",
  image: "image — one photo or illustration.",
  gallery: "gallery — several images: grid, featured, masonry, or carousel.",
  cards: "cards — 2–12 options to compare or pick from (places, products, plans), optionally with an image and an action each.",
  hero: "hero — a striking opener for a plan, guide, or recommendation: split, cover (needs image), editorial (type-led, no image), spotlight.",
  article: "article — long-form writing (articles, essays, reports, guides) in headed sections; gets a table of contents and export.",
  form: "form — ask for missing details instead of guessing. Submitting sends the answers to you.",
  template: "template — reusable text with {{placeholders}} the user fills in (messages, posts, status updates). Up to 20 variables.",
  email: "email — any email draft: to, subject, body. The user edits and sends it.",
  actions: "actions — 1–4 next steps. reply sends a follow-up message; link opens a URL; copy/download hand over text.",
  file: "file — a downloadable text file (csv, md, json, ics, txt) with its full content.",
  sources: "sources — where facts came from. Only real URLs you were given.",
  faq: "faq — collapsible questions and answers.",
  divider: "divider — separates major parts.",
}

/**
 * The system prompt that teaches a model to answer with Fable. Keep it next
 * to your own instructions; it only covers presentation.
 */
export function fableSystemPrompt(options: FablePromptOptions = {}) {
  const tool = options.toolName ?? "render_ui"
  const blocks = (Object.keys(guide) as ContentBlockType[]).filter((name) => !options.include || options.include.includes(name))
  const images = blocks.some((name) => name === "image" || name === "gallery" || name === "hero" || name === "cards" || name === "article")
  const actions = Object.entries(options.hostActions ?? {})

  return [
    `You can answer with rich, interactive UI by calling the \`${tool}\` tool with a list of blocks.`,
    "",
    "When to use it:",
    `- Use \`${tool}\` for any answer with structure or substance: articles and essays, guides and how-tos, steps, code, comparisons, data, plans, drafts to edit (emails, posts, templates), media, choices, or anything the user will act on.`,
    "- Answer in plain text only for greetings, quick conversational replies, opinions, or a single fact in a sentence or two.",
    "- The requested output decides the block: an email is an email block, an article is an article block, a template is a template block, a file or CSV is a file block.",
    `- When you call \`${tool}\`, put the whole answer in it, including the prose. Do not repeat it in text before or after the call.`,
    "",
    "How to compose:",
    "- Lead with the answer. The first block states the conclusion in one or two sentences; detail follows.",
    "- Pick the block that fits each idea, not one format for the whole reply. Mix prose with at most a few rich blocks.",
    "- Prefer one strong block over several weak ones. No filler headings, no decorative callouts.",
    "- Use columns only for things that belong side by side (e.g. a chart and its key facts). Use tabs for alternatives the user picks between.",
    "- End with an actions block of 2–3 specific next steps when there is an obvious follow-up.",
    "- If you need information to give a good answer, give the best default answer first, then a short form for the missing details.",
    "- Write labels in sentence case. Buttons say exactly what happens (\"Plan day 4\", not \"Submit\").",
    "",
    "Blocks:",
    ...blocks.map((name) => `- ${guide[name]}`),
    "",
    "Rules:",
    "- Never invent facts, numbers, or URLs. Tables and charts show data you have, from the conversation or tools.",
    images
      ? options.imageSource
        ? `- Images: ${options.imageSource} Never invent image URLs.`
        : "- Do not use image, gallery, cover images, or card images: you have no image source and invented URLs are broken."
      : "",
    "- Markdown cannot contain HTML or images.",
    actions.length
      ? `- Host actions you may use (type \"host\"): ${actions.map(([name, description]) => `\`${name}\` (${description})`).join(", ")}. Never invent others.`
      : "- Do not use host actions; this app has none.",
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n(When to use it:|How to compose:|Blocks:|Rules:)/g, "\n\n$1")
}
