"use client"

import { cn } from "@/lib/utils"

import type { BlockOf } from "../schema"
import { ActionButton } from "./actions"
import { FableImg } from "./media"
import { surface } from "./shared"

function Stats({ stats, inverted }: { stats: NonNullable<BlockOf<"hero">["stats"]>; inverted?: boolean }) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {stats.map((stat, index) => (
        <div key={index} className="min-w-0">
          <dt className={cn("text-xs", inverted ? "text-white/70" : "text-muted-foreground")}>{stat.label}</dt>
          <dd className="font-heading text-xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function HeroActions({ block, stateKey }: { block: BlockOf<"hero">; stateKey: string }) {
  if (!block.actions?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {block.actions.map((action, index) => (
        <ActionButton
          key={index}
          action={action}
          stateKey={`${stateKey}.a${index}`}
          size="lg"
          fallbackStyle={index === 0 ? "primary" : "outline"}
        />
      ))}
    </div>
  )
}

/**
 * Four compositions for an answer that deserves an opening:
 * split (text beside image), cover (text over image), editorial (type-led,
 * no image needed) and spotlight (centered on a quiet accent field).
 */
export function HeroBlock({ block, stateKey }: { block: BlockOf<"hero">; stateKey: string }) {
  const variant = block.variant === "cover" && !block.image ? "spotlight" : block.variant

  if (variant === "cover" && block.image) {
    return (
      <section className="relative isolate overflow-hidden rounded-2xl bg-neutral-950 text-white">
        <FableImg image={block.image} aspect="auto" rounded="rounded-none" className="absolute inset-0 -z-10 h-full min-h-0" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="flex min-h-[22rem] flex-col justify-end gap-4 p-6 @lg:min-h-[26rem] @lg:p-8">
          {block.eyebrow ? (
            <p className="text-xs font-medium tracking-[0.12em] text-white/75 uppercase">{block.eyebrow}</p>
          ) : null}
          <h2 className="max-w-[20ch] font-heading text-3xl leading-[1.05] font-semibold tracking-tight text-balance @lg:text-[2.5rem]">
            {block.title}
          </h2>
          {block.description ? (
            <p className="max-w-[56ch] text-[0.9375rem] leading-relaxed text-pretty text-white/80">{block.description}</p>
          ) : null}
          {block.stats?.length ? <Stats stats={block.stats} inverted /> : null}
          <div className="[&_[data-variant=outline]]:border-white/30 [&_[data-variant=outline]]:bg-white/10 [&_[data-variant=outline]]:text-white [&_[data-variant=outline]]:backdrop-blur [&_[data-variant=outline]:hover]:bg-white/20">
            <HeroActions block={block} stateKey={stateKey} />
          </div>
        </div>
      </section>
    )
  }

  if (variant === "split") {
    return (
      <section className={cn(surface, "grid overflow-hidden @lg:grid-cols-2")}>
        <div className="flex flex-col justify-center gap-4 p-6 @lg:p-8">
          {block.eyebrow ? <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">{block.eyebrow}</p> : null}
          <h2 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance @lg:text-3xl">{block.title}</h2>
          {block.description ? (
            <p className="text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{block.description}</p>
          ) : null}
          {block.stats?.length ? <Stats stats={block.stats} /> : null}
          <HeroActions block={block} stateKey={stateKey} />
        </div>
        {block.image ? (
          <FableImg image={block.image} aspect="landscape" rounded="rounded-none" className="order-first h-full @lg:order-none @lg:aspect-auto" priority />
        ) : (
          <div aria-hidden className="order-first min-h-32 bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_60%),radial-gradient(80%_60%_at_0%_100%,color-mix(in_oklab,var(--chart-2)_25%,transparent),transparent_70%)] @lg:order-none" />
        )}
      </section>
    )
  }

  if (variant === "editorial") {
    return (
      <section className="relative grid gap-6 border-y border-foreground/80 py-7 @lg:grid-cols-[1fr_auto] @lg:py-9">
        <div className="space-y-4">
          {block.eyebrow ? (
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <span className="h-px w-6 bg-primary" aria-hidden />
              {block.eyebrow}
            </p>
          ) : null}
          <h2 className="max-w-[18ch] font-heading text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.025em] text-balance @lg:text-5xl">
            {block.title}
          </h2>
          {block.description ? (
            <p className="max-w-[58ch] text-base leading-relaxed text-pretty text-muted-foreground">{block.description}</p>
          ) : null}
          <HeroActions block={block} stateKey={stateKey} />
        </div>
        {block.image ? (
          <FableImg image={block.image} aspect="portrait" className="w-full @lg:w-52" />
        ) : block.stats?.length ? (
          <dl className="grid content-end gap-4 @lg:min-w-40 @lg:border-s @lg:border-border @lg:ps-6">
            {block.stats.map((stat, index) => (
              <div key={index}>
                <dd className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}
      </section>
    )
  }

  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-primary/[0.05] px-6 py-10 text-center ring-1 ring-primary/10 @lg:px-10 @lg:py-14">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]"
      />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        {block.image ? (
          <FableImg image={block.image} aspect="square" rounded="rounded-2xl" className="size-20 shadow-sm" />
        ) : null}
        {block.eyebrow ? <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">{block.eyebrow}</p> : null}
        <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance @lg:text-4xl">{block.title}</h2>
        {block.description ? (
          <p className="text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{block.description}</p>
        ) : null}
        {block.stats?.length ? (
          <div className="flex justify-center">
            <Stats stats={block.stats} />
          </div>
        ) : null}
        <div className="flex justify-center">
          <HeroActions block={block} stateKey={stateKey} />
        </div>
      </div>
    </section>
  )
}

export function CardsBlock({ block, stateKey }: { block: BlockOf<"cards">; stateKey: string }) {
  const columns = block.columns ?? (block.items.length === 1 ? 1 : block.items.length % 3 === 0 ? 3 : 2)
  return (
    <section aria-label={block.title ?? "Cards"} className="space-y-3">
      {block.title ? <h3 className="font-heading text-[0.9375rem] font-semibold tracking-tight">{block.title}</h3> : null}
      <ul
        className={cn(
          "grid gap-3",
          columns === 2 && "@lg:grid-cols-2",
          columns === 3 && "@lg:grid-cols-2 @2xl:grid-cols-3"
        )}
      >
        {block.items.map((item, index) => (
          <li key={index} className={cn(surface, "group/card flex flex-col overflow-hidden", columns === 1 && item.image && "@lg:flex-row")}>
            {item.image ? (
              <div className={cn("p-1.5 pb-0", columns === 1 && "@lg:w-2/5 @lg:pe-0 @lg:pb-1.5")}>
                <FableImg image={item.image} aspect="landscape" className={cn(columns === 1 && "@lg:h-full @lg:aspect-auto")} />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-heading text-[0.9375rem] leading-snug font-semibold tracking-tight text-balance">{item.title}</h4>
                {item.badge ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-medium text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              {item.meta ? <p className="text-xs text-muted-foreground tabular-nums">{item.meta}</p> : null}
              {item.description ? (
                <p className="text-sm leading-6 text-pretty text-muted-foreground">{item.description}</p>
              ) : null}
              {item.action ? (
                <div className="mt-auto pt-2">
                  <ActionButton action={item.action} stateKey={`${stateKey}.${index}`} size="sm" fallbackStyle="secondary" />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
