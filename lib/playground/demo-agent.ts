import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai"

import { FABLE_TOOL_NAME } from "@/components/fable-ui/tool"

import { pickScenario } from "./scenarios"

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(timer)
      resolve()
    })
  })

function lastUserText(messages: UIMessage[]) {
  const last = [...messages].reverse().find((message) => message.role === "user")
  return last?.parts.map((part) => (part.type === "text" ? part.text : "")).join(" ") ?? ""
}

/**
 * Streams a scripted answer exactly the way a model would: text deltas, then
 * the render_ui tool input in small JSON chunks. The client cannot tell the
 * difference, which is the point.
 */
export function demoAgentResponse(messages: UIMessage[], signal?: AbortSignal, speed = 1) {
  const scenario = pickScenario(lastUserText(messages))
  const tick = (ms: number) => sleep(ms / speed, signal)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start" })
      writer.write({ type: "start-step" })
      await tick(450)

      if (scenario.text) {
        const id = "text-1"
        writer.write({ type: "text-start", id })
        for (const word of scenario.text.split(/(?<=\s)/)) {
          if (signal?.aborted) return
          writer.write({ type: "text-delta", id, delta: word })
          await tick(18)
        }
        writer.write({ type: "text-end", id })
      }

      if (scenario.spec) {
        const toolCallId = `demo-${scenario.id}-${Date.now().toString(36)}`
        const json = JSON.stringify(scenario.spec)
        writer.write({ type: "tool-input-start", toolCallId, toolName: FABLE_TOOL_NAME })
        for (let index = 0; index < json.length; ) {
          if (signal?.aborted) return
          // Uneven chunks, like real token streams.
          const size = 18 + Math.floor(Math.random() * 30)
          writer.write({ type: "tool-input-delta", toolCallId, inputTextDelta: json.slice(index, index + size) })
          index += size
          await tick(14)
        }
        writer.write({ type: "tool-input-available", toolCallId, toolName: FABLE_TOOL_NAME, input: scenario.spec })
        writer.write({ type: "tool-output-available", toolCallId, output: { status: "displayed", blocks: scenario.spec.blocks.length } })
      }

      writer.write({ type: "finish-step" })
      writer.write({ type: "finish", finishReason: "stop" })
    },
  })

  return createUIMessageStreamResponse({ stream, headers: { "Cache-Control": "no-store" } })
}
