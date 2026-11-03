"use client"

import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { ActionsBlock } from "./blocks/actions"
import { ChartBlock } from "./blocks/chart"
import { ArticleBlock, ChecklistBlock, FaqBlock, FileBlock, ListBlock, SourcesBlock } from "./blocks/content"
import { DetailsBlock, MetricsBlock } from "./blocks/data"
import { EmailBlock, FormBlock, TemplateBlock } from "./blocks/interactive"
import { GalleryBlock, ImageBlock } from "./blocks/media"
import { enter, surface } from "./blocks/shared"
import { CardsBlock, HeroBlock } from "./blocks/showcase"
import { BlockSkeleton } from "./blocks/skeleton"
import { TableBlock } from "./blocks/table"
import { CalloutBlock, CodeBlock, DividerBlock, HeadingBlock, MarkdownBlock, QuoteBlock } from "./blocks/text"
import { FableScope, useFableState } from "./provider"
import { resolveSpec, type Resolved } from "./resolve"
import type { ContentBlock } from "./schema"

export interface FableRendererProps {
  /** The spec, complete or partial. Validated here; never trusted as-is. */
  spec: unknown
  /** True while the tool input is still streaming. */
  streaming?: boolean
  /** Scopes widget state; use the tool call id. */
  id?: string
  /** Show why a block was dropped. Off in production by default. */
  debug?: boolean
  className?: string
}

/** Keeps one broken block from taking the whole answer down. */
class BlockBoundary extends React.Component<{ children: React.ReactNode; debug?: boolean; type: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return this.props.debug ? <Notice>{`The ${this.props.type} block failed to render.`}</Notice> : null
  }
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground">
      {children}
    </p>
  )
}

function Content({ block, stateKey, open }: { block: ContentBlock; stateKey: string; open: boolean }) {
  switch (block.type) {
    case "markdown":
      return <MarkdownBlock block={block} />
    case "heading":
      return <HeadingBlock block={block} />
    case "callout":
      return <CalloutBlock block={block} />
    case "metrics":
      return <MetricsBlock block={block} />
    case "table":
      return <TableBlock block={block} open={open} />
    case "chart":
      return <ChartBlock block={block} />
    case "details":
      return <DetailsBlock block={block} />
    case "list":
      return <ListBlock block={block} />
    case "checklist":
      return <ChecklistBlock block={block} />
    case "code":
      return <CodeBlock block={block} />
    case "quote":
      return <QuoteBlock block={block} />
    case "image":
      return <ImageBlock block={block} />
    case "gallery":
      return <GalleryBlock block={block} />
    case "cards":
      return <CardsBlock block={block} stateKey={stateKey} />
    case "hero":
      return <HeroBlock block={block} stateKey={stateKey} />
    case "article":
      return <ArticleBlock block={block} stateKey={stateKey} open={open} />
    case "form":
      return <FormBlock block={block} />
    case "template":
      return <TemplateBlock block={block} stateKey={stateKey} />
    case "email":
      return <EmailBlock block={block} stateKey={stateKey} />
    case "actions":
      return <ActionsBlock block={block} stateKey={stateKey} />
    case "file":
      return <FileBlock block={block} stateKey={stateKey} />
    case "sources":
      return <SourcesBlock block={block} />
    case "faq":
      return <FaqBlock block={block} />
    case "divider":
      return <DividerBlock block={block} />
  }
}

const RootScope = React.createContext("fable")

/** Gives each block its own state namespace inside the response. Keys are positional paths. */
function BlockScope({ stateKey, children }: { stateKey: string; children: React.ReactNode }) {
  const root = React.useContext(RootScope)
  return <FableScope id={`${root}/${stateKey}`}>{children}</FableScope>
}

function TabsLayout({ item, debug }: { item: Extract<Resolved, { kind: "tabs" }>; debug?: boolean }) {
  const [value, setValue] = useFableState("tab", "0")
  const active = Number(value) < item.tabs.length ? value : "0"
  return (
    <Tabs value={active} onValueChange={setValue} className="gap-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
        <TabsList>
          {item.tabs.map((tab, index) => (
            <TabsTrigger key={index} value={String(index)}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {item.tabs.map((tab, index) => (
        <TabsContent key={index} value={String(index)} className="space-y-5 outline-none">
          <Items items={tab.children} debug={debug} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function Node({ item, debug }: { item: Resolved; debug?: boolean }) {
  switch (item.kind) {
    case "pending":
      return <BlockSkeleton type={item.type} />
    case "invalid":
      return debug ? <Notice>{`Skipped ${item.type ?? "unknown"} block — ${item.issue}`}</Notice> : null
    case "content":
      return (
        <BlockBoundary debug={debug} type={item.block.type}>
          <BlockScope stateKey={item.key}>
            <div className={cn("@container min-w-0", !item.open && enter)} data-fable-block={item.block.type}>
              <Content block={item.block} stateKey={item.key} open={item.open} />
            </div>
          </BlockScope>
        </BlockBoundary>
      )
    case "columns":
      return (
        <div
          data-fable-block="columns"
          className={cn(
            "grid min-w-0 gap-5",
            item.columns.length === 3 && "@2xl/fable:grid-cols-3",
            item.columns.length === 2 && item.ratio === "equal" && "@2xl/fable:grid-cols-2",
            item.columns.length === 2 && item.ratio === "wide-left" && "@2xl/fable:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
            item.columns.length === 2 && item.ratio === "wide-right" && "@2xl/fable:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
          )}
        >
          {item.columns.map((column, index) => (
            <div key={index} className="min-w-0 space-y-5">
              <Items items={column} debug={debug} />
            </div>
          ))}
        </div>
      )
    case "section":
      return (
        <section
          data-fable-block="section"
          aria-label={item.title}
          className={cn(
            "min-w-0 space-y-4",
            item.variant === "card" && cn(surface, "p-4 @lg/fable:p-6"),
            item.variant === "muted" && "rounded-xl bg-muted/50 p-4 @lg/fable:p-6"
          )}
        >
          {item.title || item.description ? (
            <header className="space-y-1">
              {item.title ? <h3 className="font-heading text-lg font-semibold tracking-tight text-balance">{item.title}</h3> : null}
              {item.description ? <p className="text-sm text-pretty text-muted-foreground">{item.description}</p> : null}
            </header>
          ) : null}
          <Items items={item.children} debug={debug} />
        </section>
      )
    case "tabs":
      return (
        <BlockScope stateKey={item.key}>
          <TabsLayout item={item} debug={debug} />
        </BlockScope>
      )
  }
}

function Items({ items, debug }: { items: Resolved[]; debug?: boolean }) {
  return items.map((item) => <Node key={item.key} item={item} debug={debug} />)
}

/**
 * Renders a Fable spec. Accepts partial input while streaming: finished
 * blocks render as they close, the open block streams or holds its space.
 */
export function FableRenderer({ spec, streaming = false, id = "fable", debug, className }: FableRendererProps) {
  const resolved = React.useMemo(() => resolveSpec(spec, streaming), [spec, streaming])
  const showDebug = debug ?? process.env.NODE_ENV === "development"

  return (
    <TooltipProvider delayDuration={300}>
      <RootScope.Provider value={id}>
        <div
          data-fable-ui=""
          data-streaming={streaming || undefined}
          aria-busy={streaming || undefined}
          className={cn("@container/fable flex min-w-0 flex-col gap-5 text-foreground", className)}
        >
          <Items items={resolved.items} debug={showDebug} />
        </div>
      </RootScope.Provider>
    </TooltipProvider>
  )
}
