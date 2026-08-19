import { describe, expect, it } from "vitest"

import {
  collectInputSchema,
  collectInputToolSchema,
} from "./collect-input-tool"

const validInput = {
  title: "Contact details",
  submitLabel: "Send",
  fields: [
    { name: "name", label: "Name", type: "text" },
    { name: "date", label: "Date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "count", label: "Count", type: "number", min: 1, max: 10 },
    {
      name: "topic",
      label: "Topic",
      type: "select",
      options: [{ label: "Support", value: "support" }],
    },
    { name: "updates", label: "Receive updates", type: "toggle" },
  ],
}

describe("collect_input tool schema", () => {
  it("accepts renderer-compatible discriminated field payloads", () => {
    expect(collectInputSchema.safeParse(validInput).success).toBe(true)
    expect(collectInputToolSchema.safeParse(validInput).success).toBe(true)
  })

  it.each([
    {
      ...validInput,
      fields: [{ name: "name", label: "Name", type: "text", min: 1 }],
    },
    {
      ...validInput,
      fields: [
        {
          name: "topic",
          label: "Topic",
          type: "select",
          options: [{ label: "Support", value: "support" }],
          max: 12,
        },
      ],
    },
    {
      ...validInput,
      fields: [
        {
          name: "count",
          label: "Count",
          type: "number",
          options: [{ label: "One", value: "1" }],
        },
      ],
    },
  ])("rejects fields with properties from another variant", (input) => {
    expect(collectInputToolSchema.safeParse(input).success).toBe(false)
  })
})
