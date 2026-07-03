import type { RequestConfirmationInput } from "@/lib/fable-ui/tools/request-confirmation-tool"

export const confirmationCardExamples = {
  destructive: {
    id: "delete-order-42",
    title: "Delete order draft?",
    description: "This removes the draft from the workspace. The server still enforces permissions.",
    confirmLabel: "Delete draft",
    variant: "destructive",
    details: ["Order draft #42", "Cannot be restored from this UI"],
  },
} satisfies Record<string, RequestConfirmationInput>
