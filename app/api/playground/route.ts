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

import { FABLE_TOOL_NAME } from "@/components/fable-ui/protocol"
import { getProvider, isKnownModel, isProviderId, PROVIDERS } from "@/lib/ai/models"
import { createModel, serverReadiness } from "@/lib/ai/provider-config"
import { PLAYGROUND_SYSTEM, playgroundTools as tools } from "@/lib/playground/agent"
import { demoAgentResponse } from "@/lib/playground/demo-agent"

export const maxDuration = 60

const MAX_MESSAGES = 40

type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof tools>>

/** Which providers have server keys, for the playground's live-mode picker. */
export function GET() {
  const readiness = serverReadiness()
  return Response.json(
    PROVIDERS.map(({ id, label, defaultModel, models }) => ({
      id, label, defaultModel,
      isConfigured: process.env.NODE_ENV !== "production" && readiness[id],
      models: models.map((model) => model.id),
    })),
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(request: Request) {
  let body: { messages?: unknown; mode?: string; provider?: string; model?: string; speed?: number }
  try {
    body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected an object")
    if (body.provider !== undefined && typeof body.provider !== "string") throw new Error("Invalid provider")
    if (body.model !== undefined && typeof body.model !== "string") throw new Error("Invalid model")
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

  // The public demo must never spend an unbounded server credential. A host
  // deploying paid live mode must supply its own authenticated usage boundary.
  if (process.env.NODE_ENV === "production") {
    return new Response("Server-funded live mode is disabled in the public playground.", { status: 403 })
  }
  if (body.provider !== undefined && !isProviderId(body.provider)) {
    return new Response("Unknown provider.", { status: 400 })
  }
  const provider = body.provider ?? (isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "google")
  const model = body.model ?? (body.provider ? getProvider(provider).defaultModel : process.env.AI_MODEL || getProvider(provider).defaultModel)
  if (!serverReadiness()[provider] || !isKnownModel(provider, model)) {
    return new Response("Live mode is not configured for this provider. Add its API key to .env.local.", { status: 400 })
  }

  const result = streamText({
    model: createModel(provider, model),
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
