import { isProviderId, PROVIDERS, type ProviderId } from "@/lib/ai/models"
import {
  isSameOriginRequest,
  maskApiKey,
  noStoreHeaders,
  readProviderMetadata,
  readJsonBody,
  serializeDeletedKeyCookie,
  serializeKeyCookie,
  validateApiKey,
} from "@/lib/byok/server"

const MAX_REQUEST_BYTES = 16 * 1024

function badRequest(message: string, status = 400) {
  return new Response(message, { status, headers: noStoreHeaders() })
}

export async function GET(request: Request) {
  const credentials = PROVIDERS.flatMap(({ id, label }) => {
    const metadata = readProviderMetadata(request, id)
    return metadata.hasKey
      ? [{ id, provider: id, label, hasKey: true as const, preview: metadata.preview }]
      : []
  })
  return Response.json(
    { credentials },
    { headers: noStoreHeaders() },
  )
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return badRequest("Cross-origin credential writes are not allowed.", 403)
  const parsed = await readJsonBody(request, MAX_REQUEST_BYTES)
  if (!parsed.ok) return badRequest(parsed.status === 413 ? "Credential request is too large." : "Invalid JSON", parsed.status)
  const body = parsed.value as { provider?: unknown; apiKey?: unknown }
  if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Expected an object")
  if (!isProviderId(body.provider)) return badRequest("Unknown provider.")
  const apiKey = validateApiKey(body.apiKey)
  if (!apiKey) return badRequest("That does not look like a valid API key.")

  const response = Response.json(
    { provider: body.provider, hasKey: true, preview: maskApiKey(apiKey) },
    { headers: noStoreHeaders() },
  )
  response.headers.set("Set-Cookie", serializeKeyCookie(body.provider, apiKey))
  return response
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return badRequest("Cross-origin credential writes are not allowed.", 403)
  let provider: unknown = new URL(request.url).searchParams.get("provider")
  if (!provider) {
    const parsed = await readJsonBody(request, MAX_REQUEST_BYTES)
    if (!parsed.ok) return badRequest(parsed.status === 413 ? "Credential request is too large." : "Invalid JSON", parsed.status)
    provider = parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value)
      ? (parsed.value as { provider?: unknown }).provider
      : undefined
  }
  if (!isProviderId(provider)) return badRequest("Choose a provider to remove.")

  const response = Response.json(
    { provider, hasKey: false, preview: null },
    { headers: noStoreHeaders() },
  )
  response.headers.set("Set-Cookie", serializeDeletedKeyCookie(provider))
  return response
}

/** Keep the provider type referenced in generated route declarations. */
export type CredentialProvider = ProviderId
