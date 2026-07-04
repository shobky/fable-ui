import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import type { UIMessage } from "ai"

import {
  createFableAIModel,
  getConfigurationMessage,
  getFableAIConfigStatus,
  getProviderLabel,
} from "@/lib/fable-ui/quickstart/provider-config"
import { fableTools } from "@/lib/fable-ui/quickstart/tools"

type ChatRequestBody = {
  messages?: UIMessage[]
}

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
}

export async function POST(req: Request) {
  let body: ChatRequestBody

  try {
    body = (await req.json()) as ChatRequestBody
  } catch {
    return createTextOnlyResponse("Request error. The chat route received invalid JSON.")
  }

  const messages = body.messages ?? []
  const config = getFableAIConfigStatus()

  if (!config.ok) {
    return createTextOnlyResponse(
      getConfigurationMessage({
        missing: config.missing,
        error: config.error,
      }),
      messages,
    )
  }

  try {
    const result = streamText({
      model: createFableAIModel(config),
      system: [
        "You are a concise assistant in a production Fable UI quickstart chat.",
        `The configured provider is ${getProviderLabel(config.provider)} and the model is ${config.model}.`,
        "Use Fable UI tools only when the user's request is better answered with a trusted UI surface.",
        "Never call tools with generic placeholder data, fake metrics, or invented values.",
        "If exact values or context are missing, ask a short follow-up question or answer in text.",
        "When a metric is clearly available from the conversation, render it with show_metric.",
        "When useful next steps are requested, render them with show_next_actions.",
      ].join("\n"),
      messages: await convertToModelMessages(messages),
      tools: fableTools,
      toolChoice: "auto",
      stopWhen: stepCountIs(3),
    })

    return result.toUIMessageStreamResponse({
      headers: noStoreHeaders,
      onError: getPublicChatError,
    })
  } catch (error) {
    return createTextOnlyResponse(getPublicChatError(error), messages)
  }
}

export function GET() {
  return createTextOnlyResponse("POST chat messages to this route from `/fable-chat`.")
}

function createTextOnlyResponse(text: string, messages: UIMessage[] = []) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const id = "fable-chat-text"

      writer.write({ type: "text-start", id })
      writer.write({ type: "text-delta", id, delta: text })
      writer.write({ type: "text-end", id })
    },
  })

  return createUIMessageStreamResponse({ stream, headers: noStoreHeaders })
}

function getPublicChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")

  if (/api key|authentication|unauthorized|permission|forbidden|401|403/i.test(message)) {
    return "Provider authentication failed. Check `FABLE_AI_API_KEY` and confirm the key has access to the configured model."
  }

  if (/rate limit|quota|429/i.test(message)) {
    return "The configured AI provider is rate limited right now. Wait a moment, then try again."
  }

  if (/model|not found|unsupported|404/i.test(message)) {
    return "The configured model is unavailable for this provider or API key. Check `FABLE_AI_PROVIDER` and `FABLE_AI_MODEL`."
  }

  if (/timeout|network|fetch|econn|enotfound|socket/i.test(message)) {
    return "The chat route could not reach the AI provider. Check your network connection and provider status."
  }

  return "The chat route failed while asking the AI provider. Check the server logs for details."
}
