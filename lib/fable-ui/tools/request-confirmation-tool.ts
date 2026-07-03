import { tool } from "ai"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { ConfirmationCard } from "@/components/fable-ui/confirmation-card/confirmation-card"

export const requestConfirmationInputSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  confirmLabel: z.string().min(1).optional(),
  cancelLabel: z.string().min(1).optional(),
  variant: z.enum(["default", "warning", "destructive"]).default("default"),
  details: z.array(z.string().min(1)).max(8).optional(),
})

export type RequestConfirmationInput = z.infer<typeof requestConfirmationInputSchema>

export function createRequestConfirmationTool() {
  return tool({
    description:
      "Ask the user to confirm before the host app performs a write, delete, charge, send, status change, or destructive operation. This UI is not authorization.",
    inputSchema: requestConfirmationInputSchema,
    execute: async (input) => input,
  })
}

export const requestConfirmation = defineFableComponent({
  name: "request_confirmation",
  schema: requestConfirmationInputSchema,
  tool: createRequestConfirmationTool(),
  renderer: {
    Component: ConfirmationCard,
    loadingProps: { id: "pending", title: "Confirm action", description: "Preparing confirmation...", isLoading: true },
    emptyProps: { id: "empty", title: "Confirm action", description: "No action was provided." },
    errorProps: (description: string) => ({
      id: "error",
      title: "Confirmation unavailable",
      description,
      error: { title: "Confirmation unavailable", description },
    }),
    toProps: (data: RequestConfirmationInput, handlers) => ({
      ...data,
      onConfirm: handlers.onConfirm,
      onCancel: handlers.onCancel,
    }),
  },
})
