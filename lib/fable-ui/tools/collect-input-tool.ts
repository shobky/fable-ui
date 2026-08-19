import { tool } from "ai"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { FormCard } from "@/components/fable-ui/form-card/form-card"

const baseField = {
  name: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
}

const collectInputFieldSchema = z.discriminatedUnion("type", [
  z.object({ ...baseField, type: z.literal("text") }).strict(),
  z.object({ ...baseField, type: z.literal("date") }).strict(),
  z.object({ ...baseField, type: z.literal("textarea") }).strict(),
  z
    .object({
      ...baseField,
      type: z.literal("number"),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .strict(),
  z
    .object({
      ...baseField,
      type: z.literal("select"),
      options: z
        .array(
          z
            .object({ label: z.string().min(1), value: z.string().min(1) })
            .strict()
        )
        .min(1)
        .max(12),
    })
    .strict(),
  z.object({ ...baseField, type: z.literal("toggle") }).strict(),
])

export const collectInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    submitLabel: z.string().min(1).optional(),
    fields: z.array(collectInputFieldSchema).min(1).max(8),
  })
  .strict()

export const collectInputToolSchema = collectInputSchema.describe(
  "One to eight fields. Valid field types are text, number, select, date, textarea, and toggle. Select fields require non-empty string options."
)

export type CollectInput = z.infer<typeof collectInputSchema>
export type CollectInputToolInput = z.infer<typeof collectInputToolSchema>

export function createCollectInputTool() {
  return tool({
    description:
      "Collect a few structured fields mid-conversation. Keep forms short; valid payloads need title and fields. The host must validate submitted values.",
    inputSchema: collectInputToolSchema,
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
    toProps: (data: CollectInput, handlers) => ({
      ...data,
      onSubmit: handlers.onFormSubmit,
    }),
  },
})
