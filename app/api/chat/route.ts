import {
  assertProviderConfigured,
  getConfiguredModel,
  isModelForProvider,
  isProviderId,
  resolveProviderConfig,
  type ProviderCredentialSource,
} from "@/lib/ai/provider-config";
import { toolRegistry } from "@/lib/fable-ui/tools";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import type { UIMessage } from "ai";

const tools = Object.fromEntries(
  Object.entries(toolRegistry).map(([name, def]) => [name, def.tool]),
);

type ChatRequestBody = {
  messages?: UIMessage[];
  provider?: string;
  model?: string;
  mode?: string;
  credentialSource?: ProviderCredentialSource;
  apiKey?: string;
  selectedKeyId?: string;
};

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Pragma": "no-cache",
};

export async function POST(req: Request) {
  let body: ChatRequestBody;

  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return createTextOnlyResponse("Request error. The playground server received invalid chat JSON.");
  }

  const messages = body.messages || [];
  const credentialSource = body.credentialSource || (body.mode === "mock" ? "none" : "server-env");

  if (body.mode === "mock" || credentialSource === "none") {
    return createTextOnlyResponse(
      "Mock mode is active. Configure a server environment key or save a local browser key to call a live provider.",
      messages,
    );
  }

  const providerConfig = resolveProviderConfig(body.provider, body.model);
  const runtimeApiKey =
    credentialSource === "browser-key" || credentialSource === "session-key"
      ? body.apiKey?.trim()
      : undefined;

  if (body.provider && !isProviderId(body.provider)) {
    return createTextOnlyResponse("Configuration error: unknown provider.", messages);
  }

  if (!isModelForProvider(providerConfig.provider, providerConfig.model)) {
    return createTextOnlyResponse("Configuration error: unknown model for the selected provider.", messages);
  }

  if ((credentialSource === "browser-key" || credentialSource === "session-key") && !runtimeApiKey) {
    return createTextOnlyResponse("Configuration error: selected browser key is unavailable.", messages);
  }

  try {
    assertProviderConfigured(providerConfig.provider, runtimeApiKey);
  } catch (error) {
    return createTextOnlyResponse(getPublicChatError(error), messages);
  }

  try {
    const model = getConfiguredModel({
      provider: providerConfig.provider,
      model: providerConfig.model,
      apiKey: runtimeApiKey,
    });
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      system: ["You are a helpful AI assistant inside the fable-UI playground.",
        "Have normal, context-aware conversations in markdown when the user asks for explanation, planning, brainstorming, writing, or broad analysis.",
        "Use a fable-UI tool only when the user asks for a UI-backed result or when concrete data from the conversation is already available and a trusted UI component is clearly the right surface.",
        "Do not call tools with generic placeholder data. If exact values, rows, fields, options, labels, or consequences are missing, ask a short follow-up question or answer in text.",
        "When you call a tool, preserve the user's actual context in the labels, summaries, details, and rows. Never replace it with a generic demo metric.",
        "Do not invent components, HTML, CSS, routes, data sources, or authorization decisions.",
        "For side effects, call request_confirmation before the host app performs the action.",
        "For real data access, return display-ready data only when it is already available."].join("\n"),
      messages: modelMessages,
      tools,
      toolChoice: "auto",
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error(getPublicChatError(error));
      },
    });

    return result.toUIMessageStreamResponse({
      onError: getPublicChatError,
      headers: noStoreHeaders,
    });
  } catch (error) {
    return createTextOnlyResponse(getPublicChatError(error), messages);
  }
}


function getPublicChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/api key|not configured|environment|env/i.test(message)) {
    return "Configuration error: provider credentials are missing or invalid for the selected provider/model.";
  }

  if (/unauthorized|authentication|permission|forbidden|401|403/i.test(message)) {
    return "Provider authentication error. Check the selected provider API key and model access.";
  }

  if (/rate limit|quota|429/i.test(message)) {
    return "Provider rate limit reached. Wait a moment or switch to another configured provider.";
  }

  if (/model|not found|unsupported|404/i.test(message)) {
    return "Provider model error. The selected model is unavailable for this provider or API key.";
  }

  if (/timeout|network|fetch|econn|enotfound|socket/i.test(message)) {
    return "Network connection issue. The playground server could not reach the AI provider.";
  }

  return "Server error. The playground route failed while asking the AI provider.";
}

function createTextOnlyResponse(text: string, messages: UIMessage[] = []) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const id = "text-error";
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });

  return createUIMessageStreamResponse({ stream, headers: noStoreHeaders });
}
