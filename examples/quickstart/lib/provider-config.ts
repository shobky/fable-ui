import { createAnthropic } from "@ai-sdk/anthropic"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createMistral } from "@ai-sdk/mistral"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import type { LanguageModel } from "ai"

export type FableAIProvider =
  | "google"
  | "anthropic"
  | "openai"
  | "openrouter"
  | "mistral"
  | "deepseek"

const providerLabels: Record<FableAIProvider, string> = {
  google: "Google",
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  mistral: "Mistral",
  deepseek: "DeepSeek",
}

const providerIds = Object.keys(providerLabels) as FableAIProvider[]

export function getFableAIConfigStatus() {
  const provider = process.env.FABLE_AI_PROVIDER?.trim().toLowerCase()
  const model = process.env.FABLE_AI_MODEL?.trim()
  const apiKey = process.env.FABLE_AI_API_KEY?.trim()
  const missing = ([
    ["FABLE_AI_PROVIDER", provider],
    ["FABLE_AI_MODEL", model],
    ["FABLE_AI_API_KEY", apiKey],
  ] satisfies Array<[string, string | undefined]>)
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    return { ok: false as const, missing }
  }

  if (!isFableAIProvider(provider)) {
    return {
      ok: false as const,
      missing: [],
      error: `FABLE_AI_PROVIDER must be one of: ${providerIds.join(", ")}.`,
    }
  }

  return {
    ok: true as const,
    provider,
    model: model!,
    apiKey: apiKey!,
  }
}

export function createFableAIModel(input: {
  provider: FableAIProvider
  model: string
  apiKey: string
}): LanguageModel {
  switch (input.provider) {
    case "anthropic":
      return createAnthropic({ apiKey: input.apiKey })(input.model)
    case "deepseek":
      return createDeepSeek({ apiKey: input.apiKey })(input.model)
    case "mistral":
      return createMistral({ apiKey: input.apiKey })(input.model)
    case "openai":
      return createOpenAI({ apiKey: input.apiKey })(input.model)
    case "openrouter":
      return createOpenRouter({ apiKey: input.apiKey })(input.model)
    case "google":
    default:
      return createGoogleGenerativeAI({ apiKey: input.apiKey })(input.model)
  }
}

export function getProviderLabel(provider: FableAIProvider) {
  return providerLabels[provider]
}

export function getConfigurationMessage(input: {
  missing?: string[]
  error?: string
}) {
  const missing = input.missing ?? []
  const missingText =
    missing.length > 0
      ? `\n\nMissing variables:\n${missing.map((name) => `- ${name}`).join("\n")}`
      : ""

  return [
    "Fable Chat is almost ready. Complete the AI provider configuration and restart your dev server.",
    input.error ? `\n\n${input.error}` : "",
    missingText,
    "\n\nAdd these to `.env.local`:",
    "```env",
    "FABLE_AI_PROVIDER=google",
    "FABLE_AI_MODEL=gemini-3-flash-preview",
    "FABLE_AI_API_KEY=your-provider-api-key",
    "```",
  ].join("\n")
}

function isFableAIProvider(value: unknown): value is FableAIProvider {
  return providerIds.includes(value as FableAIProvider)
}
