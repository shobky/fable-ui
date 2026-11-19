// Server only: imported by route handlers and evals, never by client components.
import { createAnthropic } from "@ai-sdk/anthropic"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createMistral } from "@ai-sdk/mistral"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import type { LanguageModel } from "ai"

import { PROVIDERS, type ProviderId } from "./models"

/** Which providers have a key on the server. Never returns the keys. */
export function serverReadiness(): Record<ProviderId, boolean> {
  return Object.fromEntries(PROVIDERS.map((provider) => [provider.id, Boolean(process.env[provider.envKey])])) as Record<ProviderId, boolean>
}

/**
 * A model instance for a provider. A browser-supplied key wins over the
 * server key; with neither, this throws before any network call.
 */
export function createModel(provider: ProviderId, model: string, browserKey?: string): LanguageModel {
  const option = PROVIDERS.find((candidate) => candidate.id === provider)
  if (!option) throw new Error("Unknown provider.")
  const apiKey = browserKey?.trim() || process.env[option.envKey]
  if (!apiKey) throw new Error(`${option.label} has no API key. Add one in the playground or set ${option.envKey}.`)

  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model)
    case "openai":
      return createOpenAI({ apiKey })(model)
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model)
    case "mistral":
      return createMistral({ apiKey })(model)
    case "deepseek":
      return createDeepSeek({ apiKey })(model)
    case "openrouter":
      return createOpenRouter({ apiKey })(model)
  }
}

/** Maps provider errors to messages that are safe to show and never echo the key. */
export function publicProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  if (/no api key/i.test(message)) return "This provider has no API key configured."
  if (/unauthori[sz]ed|authenticat|invalid.*key|incorrect.*key|permission|forbidden|401|403/i.test(message))
    return "The provider rejected this key. Check it and its model access."
  if (/rate.?limit|quota|insufficient|billing|429/i.test(message)) return "The provider's rate limit or quota was reached."
  if (/model|not.?found|unsupported|404/i.test(message)) return "This model is not available for this key."
  if (/timeout|network|fetch failed|econn|enotfound|socket/i.test(message)) return "Could not reach the provider."
  return "The provider request failed."
}
