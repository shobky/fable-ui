export const MAX_FABLE_RICH_CONTENT_BLOCKS = 12
export const MAX_FABLE_RICH_CONTENT_SPANS = 16
export const MAX_FABLE_RICH_CONTENT_LIST_ITEMS = 12
export const MAX_FABLE_RICH_CONTENT_TEXT_CHARS = 240
export const MAX_FABLE_RICH_CONTENT_CODE_CHARS = 4000
export const MAX_FABLE_RICH_CONTENT_TOTAL_CHARS = 8000
export const MAX_FABLE_RICH_CONTENT_ELEMENT_BYTES = 12 * 1024
export const MAX_FABLE_HOST_LINKS = 24
export const MAX_FABLE_LINK_HREF_CHARS = 512

const LOCAL_LINK_BASE = "https://fable-ui.invalid"

export interface FableLinkTarget {
  href: string
  label: string
}

export type FableLinkCatalog = Readonly<Record<string, FableLinkTarget>>

export interface SafeFableLinkHref {
  href: string
  hostLabel: string
}

/** Accepts host-owned same-origin paths and HTTPS URLs, never model-authored URLs. */
export function parseSafeFableLinkHref(
  value: unknown
): SafeFableLinkHref | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_FABLE_LINK_HREF_CHARS ||
    /[\\\s\u0000-\u001f\u007f]/u.test(value)
  ) {
    return null
  }

  if (value.startsWith("/")) {
    if (value.startsWith("//")) return null

    try {
      const url = new URL(value, LOCAL_LINK_BASE)
      // URL parsing normalizes dot segments. Inputs such as `/.//host/path`
      // become `//host/path`, which browsers interpret as a protocol-relative
      // URL when used as an anchor href.
      if (url.origin !== LOCAL_LINK_BASE || url.pathname.startsWith("//")) {
        return null
      }
      return {
        href: `${url.pathname}${url.search}${url.hash}`,
        hostLabel: "this site",
      }
    } catch {
      return null
    }
  }

  if (!/^https:\/\//i.test(value)) return null

  try {
    const url = new URL(value)
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null
    }
    return { href: url.href, hostLabel: url.host }
  } catch {
    return null
  }
}

export function isSafeFableLinkHref(value: unknown): value is string {
  return parseSafeFableLinkHref(value) !== null
}
