import {
  getConfiguredModel,
  isModelForProvider,
  isProviderId,
} from "@/lib/ai/provider-config";
import { generateText } from "ai";

type TestProviderKeyBody = {
  provider?: unknown;
  model?: unknown;
  apiKey?: unknown;
};

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Pragma": "no-cache",
};

function json(body: { ok: boolean; message: string }, status = 200) {
  return Response.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

export async function POST(req: Request) {
  let body: TestProviderKeyBody;

  try {
    body = (await req.json()) as TestProviderKeyBody;
  } catch {
    return json({ ok: false, message: "Invalid key test request." }, 400);
  }

  if (!isProviderId(body.provider)) {
    return json({ ok: false, message: "Unknown provider." }, 400);
  }

  if (typeof body.model !== "string" || !isModelForProvider(body.provider, body.model)) {
    return json({ ok: false, message: "Unknown model for the selected provider." }, 400);
  }

  if (typeof body.apiKey !== "string" || !body.apiKey.trim()) {
    return json({ ok: false, message: "API key is required." }, 400);
  }

  try {
    const model = getConfiguredModel({
      provider: body.provider,
      model: body.model,
      apiKey: body.apiKey.trim(),
    });

    await generateText({
      model,
      prompt: "Reply with OK.",
      maxOutputTokens: 4,
    });

    return json({ ok: true, message: "Key is valid for this provider/model." });
  } catch (error) {
    return json({ ok: false, message: getPublicTestError(error) }, 401);
  }
}

function getPublicTestError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/unauthorized|authentication|permission|forbidden|api key|401|403/i.test(message)) {
    return "Provider authentication failed. Check the key and model access.";
  }

  if (/model|not found|unsupported|404/i.test(message)) {
    return "The selected model is unavailable for this key.";
  }

  if (/rate limit|quota|429/i.test(message)) {
    return "Provider rate limit or quota reached while testing this key.";
  }

  if (/timeout|network|fetch|econn|enotfound|socket/i.test(message)) {
    return "The playground server could not reach the provider.";
  }

  return "Provider key test failed.";
}
