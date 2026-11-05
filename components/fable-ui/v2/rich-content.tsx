import * as React from "react"

import { cn } from "@/lib/utils"
import {
  parseSafeFableLinkHref,
  type FableLinkCatalog,
} from "./rich-content-utils"
import type { FableTextMark } from "./typography"

export interface FableRichContentTextSpan {
  type: "text"
  text: string
  mark: FableTextMark
}

export interface FableRichContentLinkRef {
  type: "link"
  linkId: string
}

export type FableRichContentInline =
  FableRichContentTextSpan | FableRichContentLinkRef

export type FableRichContentBlock =
  | { type: "paragraph"; spans: FableRichContentInline[] }
  | { type: "heading"; level: 2 | 3; spans: FableRichContentInline[] }
  | {
      type: "list"
      ordered: boolean
      items: FableRichContentInline[][]
    }
  | { type: "quote"; spans: FableRichContentInline[] }
  | { type: "code"; code: string; language?: string }

export interface FableRichContentProps {
  blocks: FableRichContentBlock[]
  links?: FableLinkCatalog
  className?: string
}

function renderInline(
  spans: FableRichContentInline[],
  links: FableLinkCatalog
): React.ReactNode[] {
  return spans.map((span, index) => {
    const key = `${span.type}-${index}`

    if (span.type === "link") {
      const target = Object.hasOwn(links, span.linkId)
        ? links[span.linkId]
        : undefined
      const destination = target ? parseSafeFableLinkHref(target.href) : null

      if (!target?.label.trim() || !destination) {
        return (
          <span key={key} className="text-muted-foreground">
            Link unavailable
          </span>
        )
      }

      return (
        <a
          key={key}
          href={destination.href}
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {target.label}
          <span
            aria-hidden="true"
            className="ms-1 text-xs font-normal text-muted-foreground"
          >
            ({destination.hostLabel})
          </span>
        </a>
      )
    }

    switch (span.mark) {
      case "strong":
        return (
          <strong key={key} className="font-semibold text-foreground">
            {span.text}
          </strong>
        )
      case "emphasis":
        return <em key={key}>{span.text}</em>
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"
          >
            {span.text}
          </code>
        )
      default:
        return <React.Fragment key={key}>{span.text}</React.Fragment>
    }
  })
}

export function FableRichContent({
  blocks,
  links = {},
  className,
}: FableRichContentProps) {
  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={key}
                className="max-w-prose text-[15px] leading-7 text-muted-foreground"
              >
                {renderInline(block.spans, links)}
              </p>
            )
          case "heading": {
            const Heading = block.level === 2 ? "h2" : "h3"
            return (
              <Heading
                key={key}
                className={cn(
                  "max-w-prose font-semibold tracking-[-0.02em] text-foreground",
                  block.level === 2
                    ? "text-lg sm:text-xl"
                    : "text-base sm:text-lg"
                )}
              >
                {renderInline(block.spans, links)}
              </Heading>
            )
          }
          case "list": {
            const List = block.ordered ? "ol" : "ul"
            return (
              <List
                key={key}
                className={cn(
                  "max-w-prose space-y-1 ps-6 text-[15px] leading-7 text-muted-foreground marker:text-muted-foreground",
                  block.ordered ? "list-decimal" : "list-disc"
                )}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`item-${itemIndex}`}>{renderInline(item, links)}</li>
                ))}
              </List>
            )
          }
          case "quote":
            return (
              <blockquote
                key={key}
                className="max-w-prose border-s-2 border-border ps-4 text-[15px] leading-7 text-muted-foreground"
              >
                {renderInline(block.spans, links)}
              </blockquote>
            )
          case "code":
            return (
              <figure
                key={key}
                className="max-w-full min-w-0 overflow-hidden rounded-xl border border-border bg-muted/30"
              >
                {block.language ? (
                  <figcaption className="border-b border-border/70 px-4 py-2 text-xs font-medium text-muted-foreground">
                    {block.language}
                  </figcaption>
                ) : null}
                <pre
                  tabIndex={0}
                  aria-label={
                    block.language
                      ? `${block.language} code sample`
                      : "Code sample"
                  }
                  className="max-w-full overflow-x-auto p-4 text-xs leading-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <code className="font-mono whitespace-pre">{block.code}</code>
                </pre>
              </figure>
            )
        }
      })}
    </div>
  )
}
