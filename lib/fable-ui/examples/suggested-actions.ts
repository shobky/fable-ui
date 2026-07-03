import type { ShowNextActionsInput } from "@/lib/fable-ui/tools/show-next-actions-tool"

export const suggestedActionsExamples = {
  ready: {
    title: "What would you like to do next?",
    description: "These only send prompts back to the chat.",
    actions: [
      { label: "Compare to yesterday", prompt: "Compare this metric to yesterday." },
      { label: "Show orders", prompt: "Show the orders behind this number." },
    ],
  },
} satisfies Record<string, ShowNextActionsInput>
