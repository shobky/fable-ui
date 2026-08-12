import { tool } from "ai"
import { z } from "zod"

import {
  TextEditorCard,
  type TextEditorCardProps,
} from "@/components/fable-ui/text-editor-card"
import { defineFableComponent } from "@/lib/fable-ui/core/definitions"

const textEditorFormatSchema = z.enum(["plain", "markdown"])
const textDirectionSchema = z.enum(["ltr", "rtl", "auto"])

export const showTextEditorInputSchema = z.object({
  label: z.string().min(1).optional(),
  content: z.string(),
  format: textEditorFormatSchema.default("plain"),
  filename: z.string().min(1).optional(),
  editable: z.boolean().default(true),
  direction: textDirectionSchema.default("auto"),
  maxLength: z.number().int().positive().optional(),
})

export type ShowTextEditorInput = z.infer<typeof showTextEditorInputSchema>

function getPartialTextEditorProps(input: unknown): TextEditorCardProps {
  const partial =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {}

  return {
    label: typeof partial.label === "string" ? partial.label : "Text editor",
    content: typeof partial.content === "string" ? partial.content : "",
    format: partial.format === "markdown" ? "markdown" : "plain",
    filename:
      typeof partial.filename === "string" ? partial.filename : undefined,
    editable: typeof partial.editable === "boolean" ? partial.editable : true,
    direction:
      partial.direction === "ltr" ||
      partial.direction === "rtl" ||
      partial.direction === "auto"
        ? partial.direction
        : "auto",
    maxLength:
      typeof partial.maxLength === "number" &&
      Number.isInteger(partial.maxLength) &&
      partial.maxLength > 0
        ? partial.maxLength
        : undefined,
    isStreaming: true,
  }
}

export function createShowTextEditorTool() {
  return tool({
    description:
      "Show one plain-text or Markdown draft for review, local editing, copying, or download. Use for a self-contained document or note, not rich text, multi-recipient email, code, forms, or host-side file editing.",
    inputSchema: showTextEditorInputSchema,
    execute: async (input) => input,
  })
}

export const showTextEditor = defineFableComponent({
  name: "show_text_editor",
  schema: showTextEditorInputSchema,
  tool: createShowTextEditorTool(),
  renderer: {
    Component: TextEditorCard,
    loadingProps: { label: "Text editor", content: "", isLoading: true },
    streamingProps: getPartialTextEditorProps,
    emptyProps: { label: "Text editor", content: "" },
    errorProps: (description, part) => ({
      ...getPartialTextEditorProps(part?.input),
      isStreaming: false,
      error: { title: "Text editor unavailable", description },
    }),
    toProps: (data: ShowTextEditorInput) => data,
  },
})
