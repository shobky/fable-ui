import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { mistral } from "@ai-sdk/mistral";
import { deepseek } from "@ai-sdk/deepseek";
import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";

export type ProviderId = 'google' | 'anthropic' | 'openai' | 'openrouter' | 'mistral' | 'deepseek';
export type ProviderOption = {
  id: ProviderId;
  label: string;
  defaultModel: string;
  envKey: "GOOGLE_GENERATIVE_AI_API_KEY" | "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "OPENROUTER_API_KEY" | "MISTRAL_API_KEY" | "DEEPSEEK_API_KEY";
};

export type ProviderReadiness = ProviderOption & {
  isConfigured: boolean;
  isDefault: boolean;
};

const providerOptions: ProviderOption[] = [
  { id: "google", label: "Google", defaultModel: "gemini-3.1-pro", envKey: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-5", envKey: "ANTHROPIC_API_KEY" },
  { id: "openai", label: "OpenAI", defaultModel: "gpt-5.5-pro", envKey: "OPENAI_API_KEY" },
  { id: "openrouter", label: "OpenRouter", defaultModel: "meta-llama/llama-4-maverick", envKey: "OPENROUTER_API_KEY" },
  { id: "mistral", label: "Mistral", defaultModel: "mistral-large-3", envKey: "MISTRAL_API_KEY" },
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-r1", envKey: "DEEPSEEK_API_KEY" },
];

export const modelCatalog: Record<ProviderId, string[]> = {
  google: [
    "gemini-3.1-pro",
    "gemini-3.1-flash",
    "gemini-3.0-pro",
    "gemini-3.0-flash",
    "gemma-2"
  ],
  anthropic: [
    "claude-opus-4.8",
    "claude-sonnet-5",
    "claude-sonnet-4.6",
    "claude-fable-5",
    "claude-haiku-4.5"
  ],
  openai: [
    "gpt-5.5-pro",
    "gpt-5.5",
    "gpt-5.4-pro",
    "gpt-5.4",
    "gpt-5-mini"
  ],
  openrouter: [
    "meta-llama/llama-4-maverick",
    "meta-llama/llama-4-scout",
    "mistralai/mistral-large-3",
    "mistralai/mistral-small-latest",
    "deepseek/deepseek-chat",
    "deepseek/deepseek-reasoner"
  ],
  mistral: [
    "mistral-large-3",
    "mistral-small-latest"
  ],
  deepseek: [
    "deepseek-chat",
    "deepseek-reasoner"
  ]
};

function isProviderId(value: unknown): value is ProviderId {
  return ["google", "anthropic", "openai", "openrouter", "mistral", "deepseek"].includes(value as string);
}

export function getProviderOptions() {
  return providerOptions;
}

export function getDefaultProviderConfig() {
  const provider = isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "google";
  const option = providerOptions.find((candidate) => candidate.id === provider) || providerOptions[0];

  return {
    provider: option.id,
    model: process.env.AI_MODEL || option.defaultModel,
  };
}

export function getProviderReadiness() {
  const defaults = getDefaultProviderConfig();

  return providerOptions.map((option) => ({
    ...option,
    isConfigured: Boolean(process.env[option.envKey]),
    isDefault: option.id === defaults.provider,
  })) satisfies ProviderReadiness[];
}

export function assertProviderConfigured(provider: ProviderId) {
  const option = providerOptions.find((candidate) => candidate.id === provider) || providerOptions[0];

  if (!process.env[option.envKey]) {
    throw new Error(
      `${option.label} is not configured. Add ${option.envKey} to .env.local or switch providers.`,
    );
  }
}

export function resolveProviderConfig(provider?: string, model?: string) {
  const defaults = getDefaultProviderConfig();
  const resolvedProvider = isProviderId(provider) ? provider : defaults.provider;
  const option = providerOptions.find((candidate) => candidate.id === resolvedProvider) || providerOptions[0];

  return {
    provider: option.id,
    model: model || (resolvedProvider === defaults.provider ? defaults.model : option.defaultModel),
  };
}

export function getConfiguredModel(provider?: string, model?: string) {
  const resolved = resolveProviderConfig(provider, model);

  // Each provider instance is treated as a function that creates the model
  switch (resolved.provider) {
    case "anthropic": return anthropic(resolved.model);
    case "openai": return openai(resolved.model);
    case "mistral": return mistral(resolved.model);
    case "deepseek": return deepseek(resolved.model);
    case "openrouter": return openrouter(resolved.model);
    case "google":
    default: return google(resolved.model);
  }
}