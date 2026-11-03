"use client"

import * as React from "react"

import { FableProvider } from "@/components/fable-ui/provider"
import { FableRenderer } from "@/components/fable-ui/renderer"
import type { FableBlockType } from "@/components/fable-ui/schema"
import { CopyButton } from "@/components/copy-button"
import { BLOCK_EXAMPLES, LAYOUT_EXAMPLES } from "@/lib/block-examples"
import { cn } from "@/lib/utils"

/** Renders a block example live, with the exact JSON the model would write. */
export function BlockPreview({ name, className }: { name: FableBlockType; className?: string }) {
  const block = name in BLOCK_EXAMPLES ? BLOCK_EXAMPLES[name as keyof typeof BLOCK_EXAMPLES] : LAYOUT_EXAMPLES[name as keyof typeof LAYOUT_EXAMPLES]
  const [view, setView] = React.useState<"preview" | "json">("preview")
  const [replies, setReplies] = React.useState<string[]>([])
  const json = JSON.stringify(block, null, 2)

  return (
    <div className={cn("not-prose mt-6 overflow-hidden rounded-xl ring-1 ring-border", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5">
        <div className="flex gap-1">
          {(["preview", "json"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === "preview" ? "Preview" : "Model output"}
            </button>
          ))}
        </div>
        {view === "json" ? <CopyButton value={json} className="static size-7" /> : null}
      </div>
      {view === "preview" ? (
        <div className="bg-background p-4 sm:p-6">
          <FableProvider onReply={(message) => setReplies((current) => [...current.slice(-2), message])} images={{ allowedHosts: ["images.unsplash.com"] }}>
            <FableRenderer id={`docs-${name}`} spec={{ blocks: [block] }} debug />
          </FableProvider>
          {replies.length ? (
            <p className="mt-4 text-xs text-muted-foreground" role="status">
              Would send: <span className="font-medium text-foreground">“{replies[replies.length - 1]}”</span>
            </p>
          ) : null}
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto bg-code p-4 font-mono text-xs leading-5 text-code-foreground">{json}</pre>
      )}
    </div>
  )
}
