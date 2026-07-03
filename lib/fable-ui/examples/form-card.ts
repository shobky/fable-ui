import type { CollectInput } from "@/lib/fable-ui/tools/collect-input-tool"

export const formCardExamples = {
  contact: {
    title: "Update contact",
    description: "Collect only the fields needed for this step.",
    submitLabel: "Continue",
    fields: [
      { name: "email", label: "Email", type: "text", required: true },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Urgent", value: "urgent" },
        ],
      },
    ],
  },
} satisfies Record<string, CollectInput>
