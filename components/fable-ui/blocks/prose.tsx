"use client"

import * as React from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

import { safeLinkUrl } from "../safety"

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-8 mb-3 font-heading text-2xl font-semibold tracking-tight text-balance first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-7 mb-2.5 font-heading text-xl font-semibold tracking-tight text-balance first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-6 mb-2 font-heading text-base font-semibold tracking-tight text-balance first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => <h5 className="mt-5 mb-2 text-sm font-semibold first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="my-3 leading-7 text-pretty first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) => {
    const safe = safeLinkUrl(href)
    if (!safe) return <span>{children}</span>
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-medium text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-[text-decoration-color] hover:decoration-foreground"
      >
        {children}
      </a>
    )
  },
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 ps-5 marker:text-muted-foreground/70 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 ps-5 marker:text-muted-foreground marker:tabular-nums first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="ps-1 leading-7 [&>ol]:my-1.5 [&>ul]:my-1.5">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-s-2 border-foreground/15 ps-4 text-muted-foreground italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ className, children }) => {
    const block = /language-/.test(className ?? "") || String(children).includes("\n")
    if (block) return <code className="font-mono">{children}</code>
    return (
      <code className="rounded-md bg-muted px-[0.35em] py-[0.15em] font-mono text-[0.85em] text-foreground">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-[0.8125rem] leading-6 ring-1 ring-border/60">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg ring-1 ring-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 text-start text-xs font-medium text-muted-foreground">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-2 align-top tabular-nums">{children}</td>,
  img: () => null,
}

/**
 * Markdown with GitHub extensions. Raw HTML is skipped, images are dropped
 * (use image blocks, which go through the image policy), and links pass
 * the URL policy.
 */
export function Prose({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("min-w-0 text-[0.9375rem] text-foreground/90 [overflow-wrap:anywhere]", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml
        urlTransform={(url) => safeLinkUrl(url) ?? ""}
      >
        {children}
      </Markdown>
    </div>
  )
}

export const MemoProse = React.memo(Prose)
