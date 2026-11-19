"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  LightbulbIcon,
  OctagonAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import type { BlockOf } from "../schema"
import { MemoProse } from "./prose"
import { CopyAction } from "./shared"

export function MarkdownBlock({ block }: { block: BlockOf<"markdown"> }) {
  return <MemoProse>{block.text}</MemoProse>
}

export function HeadingBlock({ block }: { block: BlockOf<"heading"> }) {
  const level = block.level ?? 2
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3"
  return (
    <header className="space-y-1.5">
      {block.eyebrow ? (
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{block.eyebrow}</p>
      ) : null}
      <Tag
        className={cn(
          "font-heading font-semibold tracking-tight text-balance text-foreground",
          level === 1 && "text-[1.75rem] leading-tight @lg:text-[2rem]",
          level === 2 && "text-xl leading-snug @lg:text-[1.375rem]",
          level === 3 && "text-base leading-snug"
        )}
      >
        {block.text}
      </Tag>
      {block.description ? (
        <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
          {block.description}
        </p>
      ) : null}
    </header>
  )
}

const calloutTones: Record<BlockOf<"callout">["tone"], { icon: LucideIcon; className: string; iconClass: string }> = {
  info: { icon: InfoIcon, className: "bg-sky-500/[0.06] ring-sky-500/20", iconClass: "text-sky-600 dark:text-sky-400" },
  tip: { icon: LightbulbIcon, className: "bg-primary/[0.04] ring-primary/15", iconClass: "text-primary" },
  success: {
    icon: CheckCircle2Icon,
    className: "bg-emerald-500/[0.06] ring-emerald-500/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: AlertTriangleIcon,
    className: "bg-amber-500/[0.08] ring-amber-500/25",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    icon: OctagonAlertIcon,
    className: "bg-destructive/[0.06] ring-destructive/20",
    iconClass: "text-destructive",
  },
}

export function CalloutBlock({ block }: { block: BlockOf<"callout"> }) {
  const tone = calloutTones[block.tone]
  const Icon = tone.icon
  return (
    <aside
      role={block.tone === "danger" || block.tone === "warning" ? "note" : undefined}
      className={cn("flex gap-3 rounded-xl px-4 py-3.5 ring-1", tone.className)}
    >
      <Icon className={cn("mt-1 size-4 shrink-0", tone.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5">
        {block.title ? <p className="text-sm leading-6 font-semibold">{block.title}</p> : null}
        <MemoProse className="text-sm [&_p]:leading-6">{block.text}</MemoProse>
      </div>
    </aside>
  )
}

export function QuoteBlock({ block }: { block: BlockOf<"quote"> }) {
  return (
    <figure className="relative py-1 ps-6">
      <span aria-hidden className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-primary/70" />
      <blockquote className="font-heading text-lg leading-relaxed font-medium tracking-tight text-pretty text-foreground @lg:text-xl">
        “{block.text}”
      </blockquote>
      {block.author || block.source ? (
        <figcaption className="mt-2.5 text-sm text-muted-foreground">
          {block.author ? <span className="font-medium text-foreground">{block.author}</span> : null}
          {block.author && block.source ? <span aria-hidden> · </span> : null}
          {block.source ? <cite className="not-italic">{block.source}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function CodeBlock({ block }: { block: BlockOf<"code"> }) {
  const label = block.filename ?? block.language
  return (
    <figure className="overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border/70">
      <figcaption className="flex h-10 items-center justify-between gap-2 border-b border-border/70 ps-4 pe-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{label ?? "code"}</span>
        <CopyAction text={block.code} label="Copy code" />
      </figcaption>
      <pre
        tabIndex={0}
        aria-label={label ? `${label} code` : "Code"}
        className="max-h-[28rem] overflow-auto p-4 font-mono text-[0.8125rem] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
      >
        <code>{block.code}</code>
      </pre>
    </figure>
  )
}

export function DividerBlock({ block }: { block: BlockOf<"divider"> }) {
  if (!block.label) return <hr className="border-border" />
  return (
    <div role="separator" aria-label={block.label} className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{block.label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
