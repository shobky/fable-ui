import { tool } from "ai"
import { z } from "zod"

import {
  EmailComposerCard,
  type EmailComposerCardProps,
} from "@/components/fable-ui/email-composer-card"
import { defineFableComponent } from "@/lib/fable-ui/core/definitions"

const directionSchema = z.enum(["ltr", "rtl", "auto"])

export const showEmailComposerInputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  to: z.array(z.string()).optional(),
  editable: z.boolean().default(true),
  direction: directionSchema.default("auto"),
})

export type ShowEmailComposerInput = z.infer<
  typeof showEmailComposerInputSchema
>

function getPartialEmailComposerProps(input: unknown): EmailComposerCardProps {
  const partial =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {}

  return {
    subject: typeof partial.subject === "string" ? partial.subject : "",
    body: typeof partial.body === "string" ? partial.body : "",
    to: Array.isArray(partial.to)
      ? partial.to.filter((value): value is string => typeof value === "string")
      : [],
    editable: typeof partial.editable === "boolean" ? partial.editable : true,
    direction:
      partial.direction === "ltr" ||
      partial.direction === "rtl" ||
      partial.direction === "auto"
        ? partial.direction
        : "auto",
    isStreaming: true,
  }
}

export function createShowEmailComposerTool() {
  return tool({
    description:
      "Show a plain-text email draft with an optional comma-separated recipient list. Use for a single email draft that a user may copy or open in their mail client; do not use for sending mail automatically, rich text, attachments, bulk mail, or host-side delivery.",
    inputSchema: showEmailComposerInputSchema,
    execute: async (input) => input,
  })
}

export const showEmailComposer = defineFableComponent({
  name: "show_email_composer",
  schema: showEmailComposerInputSchema,
  tool: createShowEmailComposerTool(),
  renderer: {
    Component: EmailComposerCard,
    loadingProps: { subject: "", body: "", isLoading: true },
    streamingProps: getPartialEmailComposerProps,
    emptyProps: { subject: "", body: "" },
    errorProps: (description, part) => ({
      ...getPartialEmailComposerProps(part?.input),
      isStreaming: false,
      error: { title: "Email draft unavailable", description },
    }),
    toProps: (data: ShowEmailComposerInput) => data,
  },
})
