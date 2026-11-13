/**
 * The playground's provider and model catalog. Client-safe: no SDK imports,
 * so the picker and the server route share one source of truth.
 */

export type ProviderId = "anthropic" | "openai" | "google" | "openrouter" | "mistral" | "deepseek"

export interface ModelOption {
  id: string
  label: string
  /** One or two words shown under the name. */
  note?: string
}

export interface ProviderOption {
  id: ProviderId
  label: string
  envKey: string
  /** Where to create a key. */
  keyUrl: string
  /** Shown as the input placeholder. */
  keyPlaceholder: string
  defaultModel: string
  models: ModelOption[]
}

export const PROVIDERS: readonly ProviderOption[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    defaultModel: "claude-sonnet-5-5",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "Most capable" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "Balanced" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "Fast" },
      { id: "claude-fable-5-1", label: "Claude Fable 5.1", note: "Frontier" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    defaultModel: "gpt-5.5",
    models: [
      { id: "gpt-6.1-sol", label: "GPT-6.1 Sol", note: "Most capable" },
      { id: "gpt-6-luna", label: "GPT-6 Luna", note: "Balanced" },
      { id: "gpt-5.5", label: "GPT-5.5", note: "Reliable" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini", note: "Fast" },
    ],
  },
  {
    id: "google",
    label: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza…",
    defaultModel: "gemini-3.1-pro",
    models: [
      { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", note: "Most capable" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "Fast" },
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", note: "Cheapest" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-…",
    defaultModel: "meta-llama/llama-4-maverick",
    models: [
      { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", note: "Open weights" },
      { id: "meta-llama/llama-4-scout", label: "Llama 4 Scout", note: "Long context" },
      { id: "mistralai/mistral-large-3", label: "Mistral Large 3", note: "via OpenRouter" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek Chat", note: "via OpenRouter" },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    envKey: "MISTRAL_API_KEY",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "Mistral API key",
    defaultModel: "mistral-large-3",
    models: [
      { id: "mistral-large-3", label: "Mistral Large 3", note: "Most capable" },
      { id: "mistral-small-latest", label: "Mistral Small", note: "Fast" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-…",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat", note: "General" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner", note: "Reasoning" },
    ],
  },
]

export function isProviderId(value: unknown): value is ProviderId {
  return PROVIDERS.some((provider) => provider.id === value)
}

export function getProvider(id: ProviderId) {
  return PROVIDERS.find((provider) => provider.id === id)!
}

export function isKnownModel(provider: ProviderId, model: string) {
  return getProvider(provider).models.some((option) => option.id === model)
}

export function modelLabel(provider: ProviderId, model: string) {
  return getProvider(provider).models.find((option) => option.id === model)?.label ?? model
}

/** "provider:model", the value the picker stores. */
export type ModelRef = `${ProviderId}:${string}`

export function parseModelRef(ref: string | null | undefined): { provider: ProviderId; model: string } | null {
  if (!ref) return null
  const index = ref.indexOf(":")
  const provider = ref.slice(0, index)
  const model = ref.slice(index + 1)
  return isProviderId(provider) && isKnownModel(provider, model) ? { provider, model } : null
}
