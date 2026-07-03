import { tool } from "ai"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { SuggestedActions } from "@/components/fable-ui/suggested-actions/suggested-actions"

export const showNextActionsInputSchema = z.object({
  title: z.string().min(1).default("Suggested actions"),
  description: z.string().min(1).optional(),
  actions: z
    .array(
      z.object({
        label: z.string().min(1),
        prompt: z.string().min(1),
        description: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .max(6),
})

export type ShowNextActionsInput = z.infer<typeof showNextActionsInputSchema>

export function createShowNextActionsTool() {
  return tool({
    description:
      "Show safe follow-up prompts the user can send next. The actions must not call host APIs directly.",
    inputSchema: showNextActionsInputSchema,
    execute: async (input) => input,
  })
}

export const showNextActions = defineFableComponent({
  name: "show_next_actions",
  schema: showNextActionsInputSchema,
  tool: createShowNextActionsTool(),
  renderer: {
    Component: SuggestedActions,
    loadingProps: { title: "Suggested actions", actions: [], isLoading: true },
    emptyProps: { title: "Suggested actions", actions: [] },
    errorProps: (description: string) => ({
      title: "Suggested actions",
      actions: [],
      error: { title: "Suggestions unavailable", description },
    }),
    toProps: (data: ShowNextActionsInput, handlers) => ({
      ...data,
      onAction: handlers.onSuggestedAction,
    }),
  },
})
