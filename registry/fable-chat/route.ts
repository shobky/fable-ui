import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, hasToolCall, stepCountIs, streamText, validateUIMessages, type InferUITools, type UIDataTypes, type UIMessage } from "ai"

import { fableSystemPrompt } from "@/components/fable-ui/prompt"
import { FABLE_TOOL_NAME, fableTool } from "@/components/fable-ui/tool"

export const maxDuration = 60

// Swap for any AI SDK provider, e.g. `anthropic("claude-sonnet-5-5")` from @ai-sdk/anthropic.
const model = openai(process.env.FABLE_MODEL ?? "gpt-5.5")

const tools = { [FABLE_TOOL_NAME]: fableTool }
type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof tools>>

const system = [
  "You are a helpful assistant. Be concise and specific.",
  fableSystemPrompt({
    // Tell the model where images may come from, e.g. "use URLs returned by the search_products tool".
    // Without a source it will not use image blocks.
    // imageSource: "…",
  }),
].join("\n\n")

export async function POST(request: Request) {
  let messages: ChatMessage[]
  try {
    const body = await request.json()
    messages = await validateUIMessages<ChatMessage>({ messages: body.messages, tools })
  } catch {
    return new Response("Invalid request", { status: 400 })
  }

  const result = streamText({
    model,
    system,
    // Keep requests bounded; long histories cost tokens on every turn.
    messages: await convertToModelMessages(messages.slice(-40), { tools }),
    tools,
    // The UI is the answer: stop once it has been shown.
    stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(5)],
    abortSignal: request.signal,
  })

  return result.toUIMessageStreamResponse({
    onError: () => "Something went wrong. Please try again.",
  })
}
