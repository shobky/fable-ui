import { tool } from "ai"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { FormCard } from "@/components/fable-ui/form-card/form-card"

const baseField = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
})

export const collectInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  submitLabel: z.string().min(1).optional(),
  fields: z
    .array(
      z.discriminatedUnion("type", [
        baseField.extend({ type: z.literal("text") }),
        baseField.extend({ type: z.literal("date") }),
        baseField.extend({ type: z.literal("textarea") }),
        baseField.extend({ type: z.literal("number"), min: z.number().optional(), max: z.number().optional() }),
        baseField.extend({
          type: z.literal("select"),
          options: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1).max(12),
        }),
        baseField.extend({ type: z.literal("toggle") }),
      ]),
    )
    .min(1)
    .max(8),
})

export type CollectInput = z.infer<typeof collectInputSchema>

export function createCollectInputTool() {
  return tool({
    description:
      "Collect a few structured fields mid-conversation. Keep forms short; the server must validate submitted values.",
    inputSchema: collectInputSchema,
    execute: async (input) => input,
  })
}

export const collectInput = defineFableComponent({
  name: "collect_input",
  schema: collectInputSchema,
  tool: createCollectInputTool(),
  renderer: {
    Component: FormCard,
    loadingProps: { title: "Collect input", fields: [], isLoading: true },
    emptyProps: { title: "Collect input", fields: [] },
    errorProps: (description: string) => ({
      title: "Form unavailable",
      fields: [],
      error: { title: "Form unavailable", description },
    }),
    toProps: (data: CollectInput, handlers) => ({ ...data, onSubmit: handlers.onFormSubmit }),
  },
})
