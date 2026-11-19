"use client"

import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { formatDelta, formatValue } from "../format"
import { useFable } from "../provider"
import type { BlockOf } from "../schema"
import { BlockHeader, surface } from "./shared"

export function MetricsBlock({ block }: { block: BlockOf<"metrics"> }) {
  const { locale } = useFable()
  const count = block.items.length
  return (
    <dl
      className={cn(
        surface,
        "grid overflow-hidden",
        count === 1 && "grid-cols-1",
        count === 2 && "grid-cols-2",
        count === 3 && "grid-cols-1 @lg:grid-cols-3",
        count >= 4 && "grid-cols-2 @xl:grid-cols-4"
      )}
    >
      {block.items.map((item, index) => {
        const delta = item.delta
        const good = delta === undefined || delta === 0 ? null : (delta > 0) !== Boolean(item.invertDelta)
        const DeltaIcon = !delta ? MinusIcon : delta > 0 ? ArrowUpRightIcon : ArrowDownRightIcon
        return (
          <div
            key={index}
            className="relative flex min-w-0 flex-col gap-1.5 p-4 shadow-[inset_1px_0_0_var(--color-border),inset_0_1px_0_var(--color-border)] @lg:p-5"
          >
            <dt className="truncate text-[0.8125rem] text-muted-foreground">{item.label}</dt>
            <dd className="font-heading text-2xl leading-none font-semibold tracking-tight tabular-nums @lg:text-[1.75rem]">
              {typeof item.value === "number"
                ? formatValue(item.value, { format: item.format, currency: item.currency, locale })
                : item.value}
            </dd>
            {delta !== undefined || item.hint ? (
              <dd className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                {delta !== undefined ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-medium tabular-nums",
                      good === true && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      good === false && "bg-destructive/10 text-destructive",
                      good === null && "bg-muted text-muted-foreground"
                    )}
                  >
                    <DeltaIcon className="size-3" aria-hidden />
                    {formatDelta(delta, locale)}
                  </span>
                ) : null}
                {item.deltaLabel ? <span className="text-muted-foreground">{item.deltaLabel}</span> : null}
                {item.hint && delta === undefined ? <span className="text-muted-foreground">{item.hint}</span> : null}
              </dd>
            ) : null}
          </div>
        )
      })}
    </dl>
  )
}

const toneClass = {
  neutral: "",
  info: "text-sky-700 dark:text-sky-300",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-destructive",
}

export function DetailsBlock({ block }: { block: BlockOf<"details"> }) {
  const twoColumns = (block.columns ?? (block.items.length > 6 ? 2 : 1)) === 2
  return (
    <section className={cn(surface, "p-4 @lg:p-5")} aria-label={block.title ?? "Details"}>
      <BlockHeader title={block.title} className="mb-3" />
      <dl className={cn("grid gap-x-8", twoColumns && "@lg:grid-cols-2")}>
        {block.items.map((item, index) => (
          <div
            key={index}
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-border py-2.5 last:border-b-0"
          >
            <dt className="shrink-0 text-sm text-muted-foreground">{item.label}</dt>
            <dd className={cn("min-w-0 text-end text-sm font-medium text-pretty tabular-nums", toneClass[item.tone ?? "neutral"])}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
