import { formatValue } from "./format"
import { FableSpecSchema, type ContentBlock, type FableBlock, type FableSpec } from "./schema"

/**
 * Deterministic Markdown for any spec: used for "copy response", exports,
 * emails, and clients that cannot render Fable blocks.
 */

const escapeCell = (value: unknown) => formatValue(value).replace(/\|/g, "\\|").replace(/\n/g, " ")

function content(block: ContentBlock): string {
  switch (block.type) {
    case "markdown":
      return block.text
    case "heading":
      return [
        block.eyebrow ? `_${block.eyebrow}_` : "",
        `${"#".repeat(block.level ?? 2)} ${block.text}`,
        block.description ?? "",
      ]
        .filter(Boolean)
        .join("\n\n")
    case "callout":
      return `> **${block.title ?? block.tone.toUpperCase()}**\n> ${block.text.replace(/\n/g, "\n> ")}`
    case "metrics":
      return block.items
        .map((item) => {
          const value = typeof item.value === "number" ? formatValue(item.value, { format: item.format, currency: item.currency }) : item.value
          const delta = item.delta !== undefined ? ` (${item.delta > 0 ? "+" : ""}${item.delta}%${item.deltaLabel ? ` ${item.deltaLabel}` : ""})` : ""
          return `- **${item.label}:** ${value}${delta}`
        })
        .join("\n")
    case "table": {
      const head = `| ${block.columns.map((column) => escapeCell(column.label)).join(" | ")} |`
      const rule = `| ${block.columns.map(() => "---").join(" | ")} |`
      const cell = (column: (typeof block.columns)[number], value: unknown) =>
        escapeCell(
          typeof value === "number" && (column.type === "currency" || column.type === "percent")
            ? formatValue(value, { format: column.type, currency: column.currency })
            : value
        )
      const rows = block.rows.map((row) => `| ${block.columns.map((column) => cell(column, row[column.key])).join(" | ")} |`)
      return [block.title ? `**${block.title}**` : "", [head, rule, ...rows].join("\n")].filter(Boolean).join("\n\n")
    }
    case "chart": {
      const head = `| ${[block.xKey, ...block.series.map((series) => series.label)].join(" | ")} |`
      const rule = `| ${[block.xKey, ...block.series].map(() => "---").join(" | ")} |`
      const rows = block.data.map((row) => `| ${[block.xKey, ...block.series.map((series) => series.key)].map((key) => escapeCell(row[key])).join(" | ")} |`)
      return [`**${block.title ?? "Chart"}**`, [head, rule, ...rows].join("\n")].join("\n\n")
    }
    case "details":
      return [block.title ? `**${block.title}**` : "", block.items.map((item) => `- **${item.label}:** ${item.value}`).join("\n")]
        .filter(Boolean)
        .join("\n\n")
    case "list": {
      const marker = (index: number) =>
        block.style === "numbered" || block.style === "steps" ? `${index + 1}.` : block.style === "check" ? "- [x]" : "-"
      return [
        block.title ? `**${block.title}**` : "",
        block.items
          .map((item, index) => `${marker(index)} ${item.meta && block.style === "timeline" ? `${item.meta} — ` : ""}**${item.title}**${item.description ? ` — ${item.description}` : ""}`)
          .join("\n"),
      ]
        .filter(Boolean)
        .join("\n\n")
    }
    case "checklist":
      return [block.title ? `**${block.title}**` : "", block.items.map((item) => `- [${item.checked ? "x" : " "}] ${item.label}`).join("\n")]
        .filter(Boolean)
        .join("\n\n")
    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.code}\n\`\`\``
    case "quote":
      return `> ${block.text}${block.author ? `\n>\n> — ${block.author}${block.source ? `, ${block.source}` : ""}` : ""}`
    case "image":
      return `[Image: ${block.image.alt}](${block.image.src})`
    case "gallery":
      return block.images.map((image) => `- [Image: ${image.alt}](${image.src})`).join("\n")
    case "cards":
      return block.items.map((item) => `- **${item.title}**${item.description ? ` — ${item.description}` : ""}`).join("\n")
    case "hero":
      return [block.eyebrow ? `_${block.eyebrow}_` : "", `## ${block.title}`, block.description ?? ""].filter(Boolean).join("\n\n")
    case "article":
      return [
        `# ${block.title}`,
        block.subtitle ?? "",
        ...block.sections.map((section) => [section.heading ? `## ${section.heading}` : "", section.body].filter(Boolean).join("\n\n")),
      ]
        .filter(Boolean)
        .join("\n\n")
    case "form":
      return [block.title ? `**${block.title}**` : "", block.fields.map((field) => `- ${field.label}${field.required ? " (required)" : ""}`).join("\n")]
        .filter(Boolean)
        .join("\n\n")
    case "template":
      return block.body
    case "email":
      return [`**To:** ${(block.to ?? []).join(", ")}`, `**Subject:** ${block.subject}`, "", block.body].join("\n")
    case "actions":
      return block.items.map((action) => `- ${action.label}`).join("\n")
    case "file":
      return `📄 ${block.filename}${block.description ? ` — ${block.description}` : ""}`
    case "sources":
      return block.items.map((item, index) => `${index + 1}. [${item.title}](${item.url})`).join("\n")
    case "faq":
      return block.items.map((item) => `**${item.question}**\n\n${item.answer}`).join("\n\n")
    case "divider":
      return "---"
  }
}

function block(item: FableBlock): string {
  if (item.type === "columns") return item.columns.map((column) => column.blocks.map(content).join("\n\n")).join("\n\n")
  if (item.type === "section") return [item.title ? `### ${item.title}` : "", ...item.blocks.map(content)].filter(Boolean).join("\n\n")
  if (item.type === "tabs") return item.tabs.map((tab) => [`### ${tab.label}`, ...tab.blocks.map(content)].join("\n\n")).join("\n\n")
  return content(item)
}

export function specToMarkdown(input: FableSpec | unknown): string {
  const parsed = FableSpecSchema.safeParse(input)
  if (!parsed.success) return ""
  return parsed.data.blocks.map(block).filter(Boolean).join("\n\n")
}
