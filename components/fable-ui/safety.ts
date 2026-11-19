import { FABLE_DOWNLOAD_TYPES } from "./schema"

/**
 * Pure policy functions. Everything the model writes passes through one of
 * these before it can become a link, an image request, or a file.
 */

export type FableDownloadType = (typeof FABLE_DOWNLOAD_TYPES)[number]

export interface FableImagePolicy {
  /**
   * Hostnames whose images load immediately, e.g. ["images.unsplash.com"].
   * A leading "*." matches subdomains. Other https images wait for a click.
   */
  allowedHosts?: string[]
  /** "ask" (default) shows a click-to-load card; "block" never loads them. */
  otherHosts?: "ask" | "block"
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

/** Links: https, http and mailto only; no embedded credentials. */
export function safeLinkUrl(value: string | undefined | null): string | null {
  if (!value) return null
  const url = parseUrl(value)
  if (!url) return null
  if (url.protocol === "mailto:") return url.href
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.username || url.password) return null
  return url.href
}

/** Images: https only, no credentials. Returns null when the URL can never load. */
export function safeImageUrl(value: string | undefined | null): URL | null {
  if (!value) return null
  const url = parseUrl(value)
  if (!url || url.protocol !== "https:" || url.username || url.password) return null
  return url
}

export function isHostAllowed(hostname: string, allowedHosts: readonly string[] = []) {
  const host = hostname.toLowerCase()
  return allowedHosts.some((entry) => {
    const rule = entry.toLowerCase().trim()
    if (rule.startsWith("*.")) return host.endsWith(rule.slice(1)) && host !== rule.slice(2)
    return host === rule
  })
}

export type ImageDecision =
  | { status: "load"; src: string }
  | { status: "ask"; src: string; host: string }
  | { status: "blocked" }

export function decideImage(src: string | undefined, policy: FableImagePolicy = {}): ImageDecision {
  const url = safeImageUrl(src)
  if (!url) return { status: "blocked" }
  if (isHostAllowed(url.hostname, policy.allowedHosts)) return { status: "load", src: url.href }
  if (policy.otherHosts === "block") return { status: "blocked" }
  return { status: "ask", src: url.href, host: url.hostname }
}

const EXTENSIONS: Record<FableDownloadType, string> = {
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "application/json": "json",
  "text/calendar": "ics",
}

export function inferDownloadType(filename: string): FableDownloadType {
  const ext = filename.split(".").pop()?.toLowerCase()
  const match = (Object.entries(EXTENSIONS) as [FableDownloadType, string][]).find(([, e]) => e === ext)
  return match?.[0] ?? "text/plain"
}

/**
 * Strips path separators and control characters, and forces an extension
 * that matches the (allowlisted) MIME type so a file can never arrive as
 * `.html`, `.svg`, `.exe` or similar.
 */
export function safeFilename(filename: string, mimeType?: FableDownloadType) {
  const type = mimeType ?? inferDownloadType(filename)
  const ext = EXTENSIONS[type]
  const base =
    filename
      .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
      .replace(/\.{2,}/g, "")
      .replace(/^[.-]+/, "")
      .replace(/\.[A-Za-z0-9]{1,8}$/, "")
      .trim()
      .slice(0, 80) || "download"
  return { filename: `${base}.${ext}`, mimeType: type }
}

/** Saves model-written text as a file in the browser. */
export function downloadText(filename: string, content: string, mimeType?: FableDownloadType) {
  const safe = safeFilename(filename, mimeType)
  const blob = new Blob([content], { type: `${safe.mimeType};charset=utf-8` })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = safe.filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
  return safe.filename
}

/** Neutralizes spreadsheet formula injection in CSV cells. */
export function toCsv(columns: { key: string; label: string }[], rows: Record<string, unknown>[]) {
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value)
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [
    columns.map((column) => cell(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => cell(row[column.key])).join(",")),
  ].join("\n")
}

export function hostLabel(url: string) {
  const parsed = parseUrl(url)
  return parsed ? parsed.hostname.replace(/^www\./, "") : url
}
