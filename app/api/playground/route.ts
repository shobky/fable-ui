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
import { getProvider, isProviderId, PROVIDERS } from "@/lib/ai/models"
import { createModel, serverReadiness } from "@/lib/ai/provider-config"
import { isSameOriginRequest, isValidModelId, readJsonBody, readProviderKey, readProviderMetadata } from "@/lib/byok/server"
import { PLAYGROUND_SYSTEM, playgroundTools as tools } from "@/lib/playground/agent"
import { demoAgentResponse } from "@/lib/playground/demo-agent"

export const maxDuration = 60

const MAX_MESSAGES = 40
const MAX_REQUEST_BYTES = 512 * 1024

type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof tools>>

/** Which providers have server keys or a user-owned key in this browser. */
export function GET(request: Request) {
  const readiness = serverReadiness()
  return Response.json(
    PROVIDERS.map(({ id, label, defaultModel, models, keyUrl, keyPlaceholder }) => {
      const credential = readProviderMetadata(request, id)
      return {
        id,
        label,
        defaultModel,
        keyUrl,
        keyPlaceholder,
        // A server key is a local-development convenience only. Production
        // live requests must use the user's HttpOnly credential cookie.
        isConfigured: credential.hasKey || (process.env.NODE_ENV !== "production" && readiness[id]),
        hasUserKey: credential.hasKey,
        keyPreview: credential.preview,
        models: models.map((model) => model.id),
      }
    }),
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_REQUEST_BYTES)
  if (!parsed.ok) return new Response(parsed.status === 413 ? "Request is too large" : "Invalid JSON", { status: parsed.status })
  const body = parsed.value as { messages?: unknown; mode?: string; provider?: string; model?: string; speed?: number }
  if (!body || typeof body !== "object" || Array.isArray(body)) return new Response("Expected an object", { status: 400 })
  if (body.provider !== undefined && typeof body.provider !== "string") return new Response("Invalid provider", { status: 400 })
  if (body.model !== undefined && typeof body.model !== "string") return new Response("Invalid model", { status: 400 })

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

  if (!isSameOriginRequest(request)) {
    return new Response("Cross-origin live requests are not allowed.", { status: 403 })
  }
  if (body.provider !== undefined && !isProviderId(body.provider)) {
    return new Response("Unknown provider.", { status: 400 })
  }
  const provider = body.provider ?? (isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "google")
  const model = body.model ?? (body.provider ? getProvider(provider).defaultModel : process.env.AI_MODEL || getProvider(provider).defaultModel)
  if (!isValidModelId(model)) {
    return new Response("Invalid model id.", { status: 400 })
  }

  const userKey = readProviderKey(request, provider)
  // Production deployments may not silently spend an operator's server key.
  // In local development, preserve the existing env-key fallback for testing.
  if (!userKey && (process.env.NODE_ENV === "production" || !serverReadiness()[provider])) {
    const message = process.env.NODE_ENV === "production"
      ? "Add your API key in playground settings."
      : "Live mode is not configured for this provider. Add its API key to .env.local."
    return new Response(message, { status: 400 })
  }

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messages, { tools })
  } catch {
    return new Response("Could not prepare the live request.", { status: 400 })
  }

  try {
    const result = streamText({
      model: userKey ? createModel(provider, model, userKey) : createModel(provider, model),
      system: PLAYGROUND_SYSTEM,
      messages: modelMessages,
      tools,
      stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(4)],
      abortSignal: request.signal,
      // Provider errors can contain request headers. Keep logs deliberately
      // generic so a provider never echoes a user's credential into logs.
      onError: () => console.error("[playground] provider request failed"),
    })

    return result.toUIMessageStreamResponse({
      headers: { "Cache-Control": "no-store" },
      onError: () => "The provider request failed. Check your key and model selection.",
    })
  } catch {
    return new Response("The provider request failed. Check your key and model selection.", { status: 502 })
  }
}
