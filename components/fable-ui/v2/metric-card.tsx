import { useId } from "react"

import { cn } from "@/lib/utils"

export type FableMetricFormat = "number" | "currency" | "percent"

export interface FableMetricCardProps {
  label: string
  value: number
  format: FableMetricFormat
  currency?: string
  unit?: string
  locale?: string
  note?: string
  className?: string
}

function formatValue({
  value,
  format,
  currency,
  locale,
}: Pick<FableMetricCardProps, "value" | "format" | "currency" | "locale">) {
  const safeLocale = locale || "en"

  if (format === "currency" && currency) {
    return new Intl.NumberFormat(safeLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (format === "percent") {
    return new Intl.NumberFormat(safeLocale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  return new Intl.NumberFormat(safeLocale, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value)
}

export function FableMetricCard({
  label,
  value,
  format,
  currency,
  unit,
  locale,
  note,
  className,
}: FableMetricCardProps) {
  const labelId = useId()

  return (
    <article
      aria-labelledby={labelId}
      className={cn(
        "min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-black/[0.025] sm:p-5",
        className
      )}
    >
      <p id={labelId} className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="max-w-full truncate text-3xl font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-4xl">
          {formatValue({ value, format, currency, locale })}
        </p>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-muted-foreground">{note}</p> : null}
    </article>
  )
}
