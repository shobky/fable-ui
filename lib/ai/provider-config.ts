import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createMistral, mistral } from "@ai-sdk/mistral";
import { createDeepSeek, deepseek } from "@ai-sdk/deepseek";
import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";

export type ProviderId = 'google' | 'anthropic' | 'openai' | 'openrouter' | 'mistral' | 'deepseek';
export type ProviderCredentialSource = "server-env" | "browser-key" | "session-key" | "none";
export type ProviderOption = {
  id: ProviderId;
  label: string;
  defaultModel: string;
  envKey: "GOOGLE_GENERATIVE_AI_API_KEY" | "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "OPENROUTER_API_KEY" | "MISTRAL_API_KEY" | "DEEPSEEK_API_KEY";
};

export type ModelReadiness = {
  model: string;
  isConfigured: boolean;
  source: "server-env" | "browser-key" | "none";
  eligibleLocalKeyCount: number;
  selectedKeyId?: string;
};

export type ProviderReadiness = ProviderOption & {
  serverConfigured: boolean;
  browserConfigured: boolean;
  isConfigured: boolean;
  isDefault: boolean;
  localKeyCount: number;
  modelReadiness?: Record<string, ModelReadiness>;
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
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
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

export function isProviderId(value: unknown): value is ProviderId {
  return ["google", "anthropic", "openai", "openrouter", "mistral", "deepseek"].includes(value as string);
}

export function isModelForProvider(provider: ProviderId, model: string) {
  const knownModels = modelCatalog[provider];

  return !knownModels || knownModels.includes(model);
}

export function getProviderOptions() {
  return providerOptions;
}

export function getDefaultProviderConfig() {
  const provider = isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "google";
  const option = providerOptions.find((candidate) => candidate.id === provider) || providerOptions[0]!;

  return {
    provider: option.id,
    model: process.env.AI_MODEL || option.defaultModel,
  };
}

export function getProviderReadiness() {
  const defaults = getDefaultProviderConfig();

  return providerOptions.map((option) => ({
    ...option,
    serverConfigured: Boolean(process.env[option.envKey]),
    browserConfigured: false,
    isConfigured: Boolean(process.env[option.envKey]),
    isDefault: option.id === defaults.provider,
    localKeyCount: 0,
  })) satisfies ProviderReadiness[];
}

export function assertProviderConfigured(provider: ProviderId, apiKey?: string) {
  const option = providerOptions.find((candidate) => candidate.id === provider) || providerOptions[0]!;

  if (!apiKey && !process.env[option.envKey]) {
    throw new Error(
      `${option.label} is not configured. Add ${option.envKey} to .env.local or switch providers.`,
    );
  }
}

export function resolveProviderConfig(provider?: string, model?: string) {
  const defaults = getDefaultProviderConfig();
  const resolvedProvider = isProviderId(provider) ? provider : defaults.provider;
  const option = providerOptions.find((candidate) => candidate.id === resolvedProvider) || providerOptions[0]!;
  const resolvedModel = model || (resolvedProvider === defaults.provider ? defaults.model : option.defaultModel);

  return {
    provider: option.id,
    model: resolvedModel,
  };
}

export function getConfiguredModel(
  providerOrInput?: string | { provider?: string; model?: string; apiKey?: string },
  model?: string,
) {
  const input =
    typeof providerOrInput === "object"
      ? providerOrInput
      : { provider: providerOrInput, model };
  const resolved = resolveProviderConfig(input.provider, input.model);
  const apiKey = input.apiKey?.trim();

  if (apiKey) {
    switch (resolved.provider) {
      case "anthropic": return createAnthropic({ apiKey })(resolved.model as Parameters<typeof anthropic>[0]);
      case "openai": return createOpenAI({ apiKey })(resolved.model as Parameters<typeof openai>[0]);
      case "mistral": return createMistral({ apiKey })(resolved.model as Parameters<typeof mistral>[0]);
      case "deepseek": return createDeepSeek({ apiKey })(resolved.model as Parameters<typeof deepseek>[0]);
      case "openrouter": return createOpenRouter({ apiKey })(resolved.model);
      case "google":
      default: return createGoogleGenerativeAI({ apiKey })(resolved.model as Parameters<typeof google>[0]);
    }
  }

  // Each provider instance is treated as a function that creates the model
  switch (resolved.provider) {
    case "anthropic": return anthropic(resolved.model as Parameters<typeof anthropic>[0]);
    case "openai": return openai(resolved.model as Parameters<typeof openai>[0]);
    case "mistral": return mistral(resolved.model as Parameters<typeof mistral>[0]);
    case "deepseek": return deepseek(resolved.model as Parameters<typeof deepseek>[0]);
    case "openrouter": return openrouter(resolved.model);
    case "google":
    default: return google(resolved.model as Parameters<typeof google>[0]);
  }
}
