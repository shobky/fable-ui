"use client"

import * as React from "react"
import { CheckIcon, ClockIcon, FileTextIcon, GlobeIcon } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import { useFableState } from "../provider"
import { hostLabel, safeFilename, safeLinkUrl } from "../safety"
import type { BlockOf } from "../schema"
import { ActionButton } from "./actions"
import { FableImg } from "./media"
import { MemoProse } from "./prose"
import { BlockHeader, CopyAction, surface } from "./shared"

function slug(text: string, index: number) {
  return `${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || "section"}-${index}`
}

/**
 * Long-form answer. Three or more headed sections get a table of contents,
 * the navigation aid long mixed-format replies usually lack.
 */
export function ArticleBlock({ block, stateKey, open }: { block: BlockOf<"article">; stateKey: string; open?: boolean }) {
  const prefix = React.useId().replace(/:/g, "")
  const headed = block.sections.filter((section) => section.heading)
  const toc = headed.length >= 3 && !open
  const markdown = [
    `# ${block.title}`,
    block.subtitle,
    ...block.sections.map((section) => [section.heading ? `## ${section.heading}` : "", section.body].filter(Boolean).join("\n\n")),
  ]
    .filter(Boolean)
    .join("\n\n")

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <h2 className="font-heading text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance @lg:text-[2.125rem]">
          {block.title}
        </h2>
        {block.subtitle ? (
          <p className="max-w-[60ch] text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground">{block.subtitle}</p>
        ) : null}
        {block.byline || block.readingTime || !open ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {block.byline ? <span className="font-medium text-foreground/80">{block.byline}</span> : null}
            {block.readingTime ? (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3" aria-hidden />
                {block.readingTime}
              </span>
            ) : null}
            {!open ? (
              <span className="ms-auto flex items-center">
                <CopyAction text={markdown} label="Copy as Markdown" />
                <ActionButton
                  action={{
                    type: "download",
                    label: "Download",
                    filename: block.title,
                    mimeType: "text/markdown",
                    content: markdown,
                  }}
                  stateKey={`${stateKey}.dl`}
                  size="sm"
                  fallbackStyle="ghost"
                  className="text-muted-foreground"
                />
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {block.cover ? (
        <figure>
          <FableImg image={block.cover} aspect="wide" rounded="rounded-xl" priority />
          {block.cover.caption ? <figcaption className="mt-2 text-xs text-muted-foreground">{block.cover.caption}</figcaption> : null}
        </figure>
      ) : null}

      <div className={cn(toc && "grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_11rem]")}>
        <div className="min-w-0 space-y-7">
          {block.sections.map((section, index) => (
            <section key={index} aria-labelledby={section.heading ? `${prefix}-${slug(section.heading, index)}` : undefined} className="scroll-mt-20">
              {section.heading ? (
                <h3
                  id={`${prefix}-${slug(section.heading, index)}`}
                  className="mb-3 scroll-mt-20 font-heading text-lg font-semibold tracking-tight text-balance"
                >
                  {section.heading}
                </h3>
              ) : null}
              <MemoProse className="text-base [&_p]:leading-[1.75]">{section.body}</MemoProse>
            </section>
          ))}
        </div>
        {toc ? (
          <nav aria-label="On this article" className="order-first @3xl:order-none">
            <div className="@3xl:sticky @3xl:top-4">
              <p className="mb-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Contents</p>
              <ol className="flex gap-1 overflow-x-auto border-b border-border pb-2 text-sm @3xl:flex-col @3xl:border-b-0 @3xl:border-s @3xl:pb-0">
                {block.sections.map((section, index) =>
                  section.heading ? (
                    <li key={index} className="shrink-0">
                      <a
                        href={`#${prefix}-${slug(section.heading, index)}`}
                        className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground @3xl:-ms-px @3xl:rounded-none @3xl:border-s @3xl:border-transparent @3xl:px-3 @3xl:hover:border-foreground/40"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ) : null
                )}
              </ol>
            </div>
          </nav>
        ) : null}
      </div>
    </article>
  )
}

export function ListBlock({ block }: { block: BlockOf<"list"> }) {
  const header = block.title ? <BlockHeader title={block.title} className="mb-3" /> : null

  if (block.style === "steps" || block.style === "timeline") {
    const timeline = block.style === "timeline"
    return (
      <section aria-label={block.title ?? (timeline ? "Timeline" : "Steps")}>
        {header}
        <ol className="relative">
          {block.items.map((item, index) => {
            const status = item.status ?? (timeline ? undefined : "upcoming")
            const last = index === block.items.length - 1
            return (
              <li key={index} className="relative grid grid-cols-[1.75rem_1fr] gap-x-3 pb-5 last:pb-0">
                {!last ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute start-[0.8125rem] top-8 bottom-1 w-px",
                      status === "done" ? "bg-primary/40" : "bg-border"
                    )}
                  />
                ) : null}
                <span
                  aria-hidden
                  className={cn(
                    "relative z-[1] mt-0.5 grid size-7 place-items-center rounded-full text-xs font-semibold tabular-nums ring-1",
                    timeline && "mt-1.5 size-3.5 ms-[0.4375rem] rounded-full bg-background ring-2 ring-primary/60",
                    !timeline && status === "done" && "bg-primary text-primary-foreground ring-primary",
                    !timeline && status === "current" && "bg-background text-primary ring-2 ring-primary",
                    !timeline && status === "upcoming" && "bg-muted text-muted-foreground ring-border"
                  )}
                >
                  {timeline ? null : status === "done" ? <CheckIcon className="size-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {timeline && item.meta ? (
                      <span className="text-xs font-medium text-primary tabular-nums">{item.meta}</span>
                    ) : null}
                    <p className={cn("text-sm leading-7 font-semibold text-pretty", status === "upcoming" && !timeline && "text-foreground/80")}>
                      {item.title}
                    </p>
                    {!timeline && item.meta ? <span className="text-xs text-muted-foreground">{item.meta}</span> : null}
                    {status === "current" && !timeline ? <span className="sr-only">(current step)</span> : null}
                  </div>
                  {item.description ? (
                    <p className="text-sm leading-6 text-pretty text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    )
  }

  const Tag = block.style === "numbered" ? "ol" : "ul"
  return (
    <section aria-label={block.title ?? "List"}>
      {header}
      <Tag className="space-y-2.5">
        {block.items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-[0.3rem] grid shrink-0 place-items-center",
                block.style === "bullet" && "mt-[0.6rem] size-1.5 rounded-full bg-foreground/40",
                block.style === "numbered" && "size-5 rounded-md bg-muted text-[0.6875rem] font-semibold text-muted-foreground tabular-nums",
                block.style === "check" && "size-5 rounded-full bg-primary/10 text-primary"
              )}
            >
              {block.style === "numbered" ? index + 1 : block.style === "check" ? <CheckIcon className="size-3" /> : null}
            </span>
            <div className="min-w-0">
              <p className="text-[0.9375rem] leading-7 text-pretty">
                <span className={cn(item.description && "font-medium")}>{item.title}</span>
                {item.meta ? <span className="ms-2 text-xs text-muted-foreground">{item.meta}</span> : null}
              </p>
              {item.description ? (
                <p className="text-sm leading-6 text-pretty text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </Tag>
    </section>
  )
}

export function ChecklistBlock({ block }: { block: BlockOf<"checklist"> }) {
  const [checked, setChecked] = useFableState<boolean[]>("checked", () => block.items.map((item) => Boolean(item.checked)))
  const id = React.useId()
  const done = block.items.filter((_, index) => checked[index]).length
  const progress = block.items.length ? Math.round((done / block.items.length) * 100) : 0

  return (
    <section className={cn(surface, "p-4 @lg:p-5")} aria-label={block.title ?? "Checklist"}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-heading text-[0.9375rem] font-semibold tracking-tight">{block.title ?? "Checklist"}</h3>
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {done} of {block.items.length} done
        </span>
      </div>
      <div
        className="mb-3 h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Checklist progress"
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <ul className="-mx-2">
        {block.items.map((item, index) => {
          const isChecked = Boolean(checked[index])
          return (
            <li key={index}>
              <label
                htmlFor={`${id}-${index}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={`${id}-${index}`}
                  checked={isChecked}
                  onCheckedChange={(value) =>
                    setChecked((current) => {
                      const next = block.items.map((_, i) => Boolean(current[i]))
                      next[index] = value === true
                      return next
                    })
                  }
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm leading-5 text-pretty transition-colors",
                      isChecked && "text-muted-foreground line-through decoration-foreground/30"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.note ? <span className="mt-0.5 block text-xs text-muted-foreground">{item.note}</span> : null}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function SourcesBlock({ block }: { block: BlockOf<"sources"> }) {
  return (
    <section aria-label="Sources">
      <p className="mb-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Sources</p>
      <ol className="grid gap-2 @lg:grid-cols-2">
        {block.items.map((item, index) => {
          const href = safeLinkUrl(item.url)
          const content = (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="grid size-4 place-items-center rounded bg-muted text-[0.625rem] font-semibold tabular-nums">
                  {index + 1}
                </span>
                <GlobeIcon className="size-3" aria-hidden />
                <span className="truncate">{item.publisher ?? (href ? hostLabel(href) : "")}</span>
              </span>
              <span className="line-clamp-2 text-sm leading-5 font-medium text-pretty">{item.title}</span>
              {item.snippet ? <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.snippet}</span> : null}
            </>
          )
          return (
            <li key={index}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-full flex-col gap-1 rounded-lg bg-muted/40 p-3 ring-1 ring-border/60 transition-[background-color,box-shadow] outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {content}
                </a>
              ) : (
                <div className="flex h-full flex-col gap-1 rounded-lg bg-muted/40 p-3 ring-1 ring-border/60">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function FaqBlock({ block }: { block: BlockOf<"faq"> }) {
  return (
    <section aria-label={block.title ?? "Questions"} className="space-y-2">
      {block.title ? <h3 className="font-heading text-[0.9375rem] font-semibold tracking-tight">{block.title}</h3> : null}
      <Accordion type="multiple" className={cn(surface, "px-4")}>
        {block.items.map((item, index) => (
          <AccordionItem key={index} value={String(index)} className="border-border/70">
            <AccordionTrigger className="text-start text-[0.9375rem] hover:no-underline">{item.question}</AccordionTrigger>
            <AccordionContent>
              <MemoProse className="text-sm text-muted-foreground [&_p]:leading-6">{item.answer}</MemoProse>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export function FileBlock({ block, stateKey }: { block: BlockOf<"file">; stateKey: string }) {
  const safe = safeFilename(block.filename, block.mimeType)
  const ext = safe.filename.split(".").pop()?.toUpperCase()
  const size = new Blob([block.content]).size
  const sizeLabel = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`
  return (
    <div className={cn(surface, "flex items-center gap-3 p-3 ps-3.5")}>
      <div className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <FileTextIcon className="size-5" aria-hidden />
        <span className="absolute -bottom-1 -end-1 rounded bg-foreground px-1 text-[0.5625rem] leading-4 font-bold text-background">
          {ext}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{safe.filename}</p>
        <p className="truncate text-xs text-muted-foreground">
          {block.description ? `${block.description} · ` : ""}
          <span className="tabular-nums">{sizeLabel}</span>
        </p>
      </div>
      <ActionButton
        action={{ type: "download", label: "Download", filename: block.filename, mimeType: block.mimeType, content: block.content }}
        stateKey={stateKey}
        size="sm"
        fallbackStyle="secondary"
      />
    </div>
  )
}

