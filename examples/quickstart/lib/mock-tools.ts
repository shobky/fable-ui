import { createUIMessageStream } from "ai"
import type { UIMessage } from "ai"

const mockMetric = {
  label: "Revenue today",
  value: "EGP 4,200",
  trend: { direction: "up", delta: "+18% vs yesterday" },
  context: "Mock data from the Fable quickstart",
}

export function createMockFableChatStream(messages: UIMessage[] = []) {
  return createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const textId = "mock-text"
      const toolCallId = "mock-show-metric"

      writer.write({ type: "text-start", id: textId })
      writer.write({
        type: "text-delta",
        id: textId,
        delta: "Here is a mock metric rendered through the installed Fable registry item.",
      })
      writer.write({ type: "text-end", id: textId })
      writer.write({
        type: "tool-input-available",
        toolCallId,
        toolName: "show_metric",
        input: mockMetric,
      })
      writer.write({
        type: "tool-output-available",
        toolCallId,
        output: mockMetric,
      })
    },
  })
}
