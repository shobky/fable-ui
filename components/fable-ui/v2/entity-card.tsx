import { cn } from "@/lib/utils"

export interface FableEntityCardProps {
  name: string
  location: string
  description: string
  valueLabel?: string
  value: number
  unit?: string
  locale?: string
  changePercent?: number
  className?: string
}

export function FableEntityCard({
  name,
  location,
  description,
  valueLabel = "Value",
  value,
  unit,
  locale,
  changePercent,
  className,
}: FableEntityCardProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-black/[0.025] sm:p-5",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.06] text-xs font-semibold tracking-wide text-primary"
        >
          {initials || "—"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-[-0.02em]">{name}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{location}</p>
        </div>
      </div>

      <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p>

      <div className="mt-5 flex min-w-0 items-end justify-between gap-3 border-t border-border/70 pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {valueLabel}
          </p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums tracking-[-0.03em]">
            {new Intl.NumberFormat(locale || "en", { maximumFractionDigits: 0 }).format(value)}
            {unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
          </p>
        </div>
        {changePercent !== undefined ? (
          <p
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
              changePercent >= 0
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive"
            )}
            aria-label={`${changePercent >= 0 ? "Up" : "Down"} ${Math.abs(changePercent)} percent`}
          >
            {changePercent > 0 ? "+" : ""}
            {changePercent}%
          </p>
        ) : null}
      </div>
    </article>
  )
}
