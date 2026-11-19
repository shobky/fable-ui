import type { ProviderId } from "@/lib/ai/models"

/**
 * Server-side transport for playground credentials.
 *
 * The raw key lives only in an HttpOnly cookie. The client can see the
 * provider and a short preview, but it cannot read or replay the credential.
 * HTTPS protects the cookie in transit; this module deliberately never logs
 * or serializes the raw value.
 */

export const KEY_COOKIE_PREFIX = "fable-ai-key-"
export const KEY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const MAX_API_KEY_LENGTH = 2048

export function keyCookieName(provider: ProviderId) {
  return `${KEY_COOKIE_PREFIX}${provider}`
}

export function maskApiKey(apiKey: string) {
  const key = apiKey.trim()
  if (key.length <= 10) return "•".repeat(Math.max(4, key.length))
  const separator = key.indexOf("-", 3)
  const headLength = separator > 0 && separator < 8 ? separator + 1 : 4
  return `${key.slice(0, headLength)}…${key.slice(-4)}`
}

export function validateApiKey(value: unknown): string | null {
  if (typeof value !== "string") return null
  const key = value.trim()
  if (key.length < 8 || key.length > MAX_API_KEY_LENGTH) return null
  // Cookie/header delimiters and control characters are never valid API-key
  // material and can turn a malformed input into response-header injection.
  if (/[\u0000-\u001f\u007f\s]/.test(key)) return null
  return key
}

export function isValidModelId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function decodeBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function decodeCookieValue(value: string) {
  try {
    if (value.startsWith("v1.")) return decodeBase64Url(value.slice(3))
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export function readRequestCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie")
  if (!header) return {}
  const result: Record<string, string> = {}
  for (const item of header.split(";")) {
    const separator = item.indexOf("=")
    if (separator <= 0) continue
    const name = item.slice(0, separator).trim()
    const value = decodeCookieValue(item.slice(separator + 1).trim())
    if (name && value !== null) result[name] = value
  }
  return result
}

export function readProviderKey(request: Request, provider: ProviderId) {
  const key = readRequestCookies(request)[keyCookieName(provider)]
  return validateApiKey(key)
}

export function readProviderMetadata(request: Request, provider: ProviderId) {
  const key = readProviderKey(request, provider)
  return key ? { hasKey: true, preview: maskApiKey(key) } : { hasKey: false, preview: null }
}

export function serializeKeyCookie(provider: ProviderId, apiKey: string, secure = process.env.NODE_ENV === "production") {
  const attributes = [
    "HttpOnly",
    "SameSite=Strict",
    "Path=/api/playground",
    `Max-Age=${KEY_COOKIE_MAX_AGE}`,
  ]
  if (secure) attributes.push("Secure")
  return `${keyCookieName(provider)}=v1.${encodeBase64Url(apiKey)}; ${attributes.join("; ")}`
}

export function serializeDeletedKeyCookie(provider: ProviderId, secure = process.env.NODE_ENV === "production") {
  const attributes = ["HttpOnly", "SameSite=Strict", "Path=/api/playground", "Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT"]
  if (secure) attributes.push("Secure")
  return `${keyCookieName(provider)}=; ${attributes.join("; ")}`
}

/**
 * State-changing credential and live requests must originate on this origin.
 * Browser same-origin fetches carry Origin. In development, missing Origin is
 * allowed for direct route-handler tests and local server tooling; a supplied
 * Origin or Referer is always checked, and production requires one.
 */
export function isSameOriginRequest(request: Request) {
  const url = new URL(request.url)
  // A standalone Next server can construct request.url with its internal
  // hostname. Host carries the authority the browser actually addressed.
  const host = request.headers.get("host")
  let expected = url.origin
  if (host) {
    if (!/^[a-z0-9.:[\]-]+$/i.test(host)) return false
    try {
      expected = new URL(`${url.protocol}//${host}`).origin
    } catch {
      return false
    }
  }
  const origin = request.headers.get("origin")
  if (origin) return origin === expected
  const referer = request.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin === expected
    } catch {
      return false
    }
  }
  return process.env.NODE_ENV !== "production"
}

export function noStoreHeaders() {
  return { "Cache-Control": "no-store" }
}

/** Read and parse JSON while enforcing a byte limit for both fixed-length and
 * chunked requests. `request.json()` buffers an unbounded body before parsing,
 * so state-changing credential and live routes use this helper instead. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 }
> {
  const declaredLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return { ok: false, status: 413 }

  try {
    const reader = request.body?.getReader()
    if (!reader) {
      const text = await request.text()
      if (new TextEncoder().encode(text).byteLength > maxBytes) return { ok: false, status: 413 }
      return { ok: true, value: JSON.parse(text) }
    }

    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return { ok: false, status: 413 }
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) }
  } catch {
    return { ok: false, status: 400 }
  }
}
