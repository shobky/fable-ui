import * as React from "react"

import { cn } from "@/lib/utils"

export type FableTextLevel = "body" | "heading" | "caption"
export type FableTextMark = "plain" | "strong" | "emphasis" | "code"

export interface FableRichTextSpan {
  text: string
  mark: FableTextMark
}

export interface FableTypographyProps {
  as?: "p" | "h2" | "h3" | "span"
  level?: FableTextLevel
  className?: string
  children: React.ReactNode
}

const levelStyles: Record<FableTextLevel, string> = {
  body: "text-[15px] leading-7 text-foreground",
  heading: "text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl",
  caption: "text-sm leading-6 text-muted-foreground",
}

const MarkedSpan = ({ span }: { span: FableRichTextSpan }) => {
  switch (span.mark) {
    case "strong":
      return <strong className="font-semibold text-foreground">{span.text}</strong>
    case "emphasis":
      return <em>{span.text}</em>
    case "code":
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {span.text}
        </code>
      )
    default:
      return <>{span.text}</>
  }
}

export function FableTypography({
  as = "p",
  level = "body",
  className,
  children,
}: FableTypographyProps) {
  const Component = as
  return (
    <Component className={cn("min-w-0", levelStyles[level], className)}>
      {children}
    </Component>
  )
}

export interface FableRichTextProps {
  spans: FableRichTextSpan[]
  className?: string
}

export function FableRichText({ spans, className }: FableRichTextProps) {
  return (
    <p className={cn("max-w-prose text-[15px] leading-7 text-muted-foreground", className)}>
      {spans.map((span, index) => (
        <MarkedSpan key={`${span.mark}-${index}`} span={span} />
      ))}
    </p>
  )
}
