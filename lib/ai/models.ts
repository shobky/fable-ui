/**
 * The playground's provider and model catalog. Client-safe: no SDK imports,
 * so the picker and the server route share one source of truth. The current
 * text/tool model IDs were checked against provider pages on 2026-11-17:
 * Anthropic (platform.claude.com/docs/en/about-claude/model-deprecations), OpenAI
 * (developers.openai.com/api/docs/models/all), and Google
 * (aistudio.google.com/docs/models). Mistral Large 4 is documented at
 * docs.mistral.ai/models/mistral-large-4. DeepSeek IDs are documented at
 * api-docs.deepseek.com/quick_start/pricing/; OpenRouter IDs were checked
 * against its public /api/v1/models catalog. Unknown provider-specific IDs
 * are still accepted by the server within a bounded format for previews and
 * newly released models.
 */

export type ProviderId =
  "anthropic" | "openai" | "google" | "openrouter" | "mistral" | "deepseek"

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
      { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
      { id: "claude-fable-5-2", label: "Claude Fable 5.2" },
      { id: "claude-fable-5-1", label: "Claude Fable 5.1" },
      { id: "claude-fable-5", label: "Claude Fable 5" },
      { id: "claude-opus-5", label: "Claude Opus 5" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    defaultModel: "gpt-6.2-sol",
    models: [
      { id: "gpt-6.2-astra", label: "GPT-6.2 Astra" },
      { id: "gpt-6.2-sol", label: "GPT-6.2 Sol" },
      { id: "gpt-6.1-terra", label: "GPT-6.1 Terra" },
      { id: "gpt-6.1-sol", label: "GPT-6.1 Sol" },
      { id: "gpt-6-astra", label: "GPT-6 Astra" },
      { id: "gpt-6-sol", label: "GPT-6 Sol" },
      { id: "gpt-6-luna", label: "GPT-6 Luna" },
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
    ],
  },
  {
    id: "google",
    label: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza…",
    defaultModel: "gemini-4-hydrogen",
    models: [
      { id: "gemini-4-carbon", label: "Gemini 4 Carbon" },
      { id: "gemini-4-argon", label: "Gemini 4 Argon" },
      { id: "gemini-4-hydrogen", label: "Gemini 4 Hydrogen" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
      { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-…",
    defaultModel: "openrouter/auto",
    models: [
      { id: "openrouter/auto", label: "Auto" },
      { id: "openai/gpt-6.2-astra", label: "GPT-6.2 Astra" },
      { id: "openai/gpt-6.2-sol", label: "GPT-6.2 Sol" },
      { id: "openai/gpt-6.1-terra", label: "GPT-6.1 Terra" },
      { id: "anthropic/claude-fable-5.2", label: "Claude Fable 5.2" },
      { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5" },
      { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5" },
      { id: "anthropic/claude-haiku-5.5", label: "Claude Haiku 5.5" },
      { id: "google/gemini-4-carbon", label: "Gemini 4 Carbon" },
      { id: "google/gemini-4-argon", label: "Gemini 4 Argon" },
      { id: "google/gemini-4-hydrogen", label: "Gemini 4 Hydrogen" },
      { id: "mistralai/mistral-large-4-0", label: "Mistral Large 4" },
      { id: "deepseek/deepseek-v4.1-flash-1017", label: "DeepSeek V4.1 Flash" },
      { id: "qwen/qwen4-max", label: "Qwen4 Max" },
      { id: "qwen/qwen3.8-flash", label: "Qwen3.8 Flash" },
      { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick" },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    envKey: "MISTRAL_API_KEY",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "Mistral API key",
    defaultModel: "mistral-large-4-0",
    models: [
      { id: "mistral-large-4-0", label: "Mistral Large 4" },
      { id: "mistral-small-2603", label: "Mistral Small 4" },
      { id: "ministral-14b-2512", label: "Ministral 3 14B" },
      { id: "ministral-3b-2512", label: "Ministral 3 3B" },
      { id: "zai-glm-5-3", label: "GLM 5.3" },
      { id: "zai-glm-5-3-flash", label: "GLM 5.3 Flash" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-…",
    defaultModel: "deepseek-flash",
    models: [
      { id: "deepseek-flash", label: "DeepSeek V4.1 Flash", note: "Fast" },
      { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", note: "Reasoning" },
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
  return (
    getProvider(provider).models.find((option) => option.id === model)?.label ??
    model
  )
}

/** "provider:model", the value the picker stores. */
export type ModelRef = `${ProviderId}:${string}`

export function parseModelRef(
  ref: string | null | undefined
): { provider: ProviderId; model: string } | null {
  if (!ref) return null
  const index = ref.indexOf(":")
  const provider = ref.slice(0, index)
  const model = ref.slice(index + 1)
  return isProviderId(provider) && isKnownModel(provider, model)
    ? { provider, model }
    : null
}
