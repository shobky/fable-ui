export type FableNumberFormat = "number" | "currency" | "percent" | "compact"

export interface FormatOptions {
  format?: FableNumberFormat
  currency?: string
  locale?: string
}

/** Server and client must agree, so the default is fixed. Pass `locale` to FableProvider to change it. */
export const DEFAULT_LOCALE = "en-US"

const cache = new Map<string, Intl.NumberFormat>()

function numberFormat(locale: string | undefined = DEFAULT_LOCALE, options: Intl.NumberFormatOptions) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`
  let formatter = cache.get(key)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, options)
    } catch {
      formatter = new Intl.NumberFormat(DEFAULT_LOCALE, options)
    }
    cache.set(key, formatter)
  }
  return formatter
}

/**
 * Percent values are written as percentages (12.5 means 12.5%), which is
 * what models produce naturally.
 */
export function formatNumber(value: number, { format = "number", currency, locale }: FormatOptions = {}) {
  if (!Number.isFinite(value)) return "—"
  switch (format) {
    case "currency":
      return numberFormat(locale, {
        style: "currency",
        currency: currency ?? "USD",
        maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
      }).format(value)
    case "percent":
      return numberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value / 100)
    case "compact":
      return numberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value)
    default:
      return numberFormat(locale, { maximumFractionDigits: 2 }).format(value)
  }
}

export function formatValue(value: unknown, options: FormatOptions = {}) {
  if (typeof value === "number") return formatNumber(value, options)
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

export function formatDate(value: unknown, locale?: string) {
  if (typeof value !== "string" && typeof value !== "number") return formatValue(value)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  return new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, {
    dateStyle: "medium",
    timeZone: dateOnly ? "UTC" : undefined,
  }).format(date)
}

export function formatDelta(delta: number, locale?: string) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : ""
  return `${sign}${numberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(delta))}%`
}
