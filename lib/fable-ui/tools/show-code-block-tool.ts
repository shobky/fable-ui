import { tool } from "ai"
import { z } from "zod"

import {
  CodeBlockCard,
  type CodeBlockCardProps,
} from "@/components/fable-ui/code-block-card"
import { defineFableComponent } from "@/lib/fable-ui/core/definitions"

export const showCodeBlockInputSchema = z.object({
  language: z.string().min(1),
  code: z.string(),
  filename: z.string().min(1).optional(),
  showLineNumbers: z.boolean().default(true),
})

export type ShowCodeBlockInput = z.infer<typeof showCodeBlockInputSchema>

function getPartialCodeBlockProps(input: unknown): CodeBlockCardProps {
  const partial =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {}

  return {
    language: typeof partial.language === "string" ? partial.language : "text",
    code: typeof partial.code === "string" ? partial.code : "",
    filename:
      typeof partial.filename === "string" ? partial.filename : undefined,
    showLineNumbers:
      typeof partial.showLineNumbers === "boolean"
        ? partial.showLineNumbers
        : true,
    isStreaming: true,
  }
}

export function createShowCodeBlockTool() {
  return tool({
    description:
      "Show a complete code snippet for review, copying, or download. Include its programming language and raw source. Do not use for executable host commands, file writes, secret values, rich text, or prose drafts.",
    inputSchema: showCodeBlockInputSchema,
    execute: async (input) => input,
  })
}

export const showCodeBlock = defineFableComponent({
  name: "show_code_block",
  schema: showCodeBlockInputSchema,
  tool: createShowCodeBlockTool(),
  renderer: {
    Component: CodeBlockCard,
    loadingProps: { language: "text", code: "", isLoading: true },
    streamingProps: getPartialCodeBlockProps,
    emptyProps: { language: "text", code: "" },
    errorProps: (description, part) => ({
      ...getPartialCodeBlockProps(part?.input),
      isStreaming: false,
      error: { title: "Code block unavailable", description },
    }),
    toProps: (data: ShowCodeBlockInput) => data,
  },
})
