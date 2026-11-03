import {
  convertToModelMessages,
  hasToolCall,
  stepCountIs,
  streamText,
  validateUIMessages,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from "ai"

import { FABLE_TOOL_NAME } from "@/components/fable-ui/tool"
import {
  getConfiguredModel,
  getProviderReadiness,
  isModelForProvider,
  modelCatalog,
  resolveProviderConfig,
} from "@/lib/ai/provider-config"
import { PLAYGROUND_SYSTEM, playgroundTools as tools } from "@/lib/playground/agent"
import { demoAgentResponse } from "@/lib/playground/demo-agent"

export const maxDuration = 60

const MAX_MESSAGES = 40

type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof tools>>

/** Which providers have server keys, for the playground's live-mode picker. */
export function GET() {
  return Response.json(
    getProviderReadiness().map(({ id, label, defaultModel, isConfigured }) => ({ id, label, defaultModel, isConfigured, models: modelCatalog[id] })),
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(request: Request) {
  let body: { messages?: unknown; mode?: string; provider?: string; model?: string; speed?: number }
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  let messages: ChatMessage[]
  try {
    messages = await validateUIMessages<ChatMessage>({ messages: body.messages ?? [], tools })
  } catch {
    return new Response("Invalid message history", { status: 400 })
  }
  messages = messages.slice(-MAX_MESSAGES)

  if (body.mode !== "live") {
    const speed = typeof body.speed === "number" && body.speed > 0 && body.speed <= 8 ? body.speed : 1
    return demoAgentResponse(messages, request.signal, speed)
  }

  const config = resolveProviderConfig(body.provider, body.model)
  const ready = getProviderReadiness().find((provider) => provider.id === config.provider)?.isConfigured
  if (!ready || !isModelForProvider(config.provider, config.model)) {
    return new Response("Live mode is not configured for this provider. Add its API key to .env.local.", { status: 400 })
  }

  const result = streamText({
    model: getConfiguredModel(config),
    system: PLAYGROUND_SYSTEM,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(4)],
    abortSignal: request.signal,
    onError: ({ error }) => console.error("[playground]", error instanceof Error ? error.message : error),
  })

  return result.toUIMessageStreamResponse({
    headers: { "Cache-Control": "no-store" },
    onError: () => "The model request failed. Check the server logs.",
  })
}
