import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Experimental Fable UI 2 primitives.
 *
 * Ordinary React components: no AI SDK, data driver, provider, runtime,
 * global styles, or model transport required.
 */
export type Space = 0 | 1 | 2 | 3 | 4 | 6 | 8

const gaps: Record<Space, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Space
  align?: "start" | "center" | "end" | "stretch"
}

const aligns = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
}

export function Stack({ gap = 4, align = "stretch", className, ...props }: StackProps) {
  return <div data-fable-ui="v2-stack" className={cn("flex min-w-0 flex-col", gaps[gap], aligns[align], className)} {...props} />
}

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Space
  align?: "start" | "center" | "end" | "stretch"
  wrap?: boolean
}

export function Inline({ gap = 3, align = "center", wrap = true, className, ...props }: InlineProps) {
  return <div data-fable-ui="v2-inline" className={cn("flex min-w-0 flex-row", gaps[gap], aligns[align], wrap && "flex-wrap", className)} {...props} />
}

export interface FableGridProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Space
  columns?: 1 | 2 | 3 | 4
}

const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}

export function FableGrid({ gap = 4, columns = 2, className, ...props }: FableGridProps) {
  return <div data-fable-ui="v2-grid" className={cn("grid min-w-0", gaps[gap], gridColumns[columns], className)} {...props} />
}

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "plain" | "outlined" | "subtle"
  padding?: Space
}

const surfaces = {
  plain: "",
  outlined: "rounded-xl border border-border bg-card",
  subtle: "rounded-xl bg-muted/50",
}

const paddings: Record<Space, string> = {
  0: "p-0",
  1: "p-1",
  2: "p-2",
  3: "p-3",
  4: "p-4",
  6: "p-6",
  8: "p-8",
}

export function Surface({ variant = "plain", padding = 0, className, ...props }: SurfaceProps) {
  return <div data-fable-ui="v2-surface" className={cn("min-w-0", surfaces[variant], paddings[padding], className)} {...props} />
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  gap?: Space
}

export function Section({ gap = 4, className, ...props }: SectionProps) {
  return <section data-fable-ui="v2-section" className={cn("flex min-w-0 flex-col", gaps[gap], className)} {...props} />
}

export interface FableTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: "default" | "muted"
  size?: "sm" | "base" | "lg"
}

const textSizes = { sm: "text-sm", base: "text-base", lg: "text-lg" }

export function FableText({ tone = "default", size = "base", className, ...props }: FableTextProps) {
  return <p data-fable-ui="v2-text" className={cn("leading-relaxed", textSizes[size], tone === "muted" && "text-muted-foreground", className)} {...props} />
}
