import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import type { UIMessage } from "ai"

import { fableTools } from "@/lib/fable-ui/demo/tools"
import { createMockFableChatStream } from "@/lib/fable-ui/demo/mock-tools"

type ChatRequestBody = {
  messages?: UIMessage[]
  mode?: "mock" | "provider"
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatRequestBody
  const messages = body.messages ?? []
  const shouldUseProvider = body.mode === "provider" && Boolean(process.env.OPENAI_API_KEY)

  if (!shouldUseProvider) {
    return createUIMessageStreamResponse({
      stream: createMockFableChatStream(messages),
    })
  }

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system:
      "You are a concise assistant. Use Fable UI tools only when a trusted UI surface is clearly useful. Do not invent data.",
    messages: await convertToModelMessages(messages),
    tools: fableTools,
    toolChoice: "auto",
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse()
}

export function GET() {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = "fable-chat-ready"
      writer.write({ type: "text-start", id })
      writer.write({
        type: "text-delta",
        id,
        delta: "POST messages to this route from the Fable quickstart chat.",
      })
      writer.write({ type: "text-end", id })
    },
  })

  return createUIMessageStreamResponse({ stream })
}
