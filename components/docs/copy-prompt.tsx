"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AGENT_PROMPTS, type AgentPromptId } from "@/lib/agent-prompts"
import { cn } from "@/lib/utils"

/** A prompt a developer pastes into their coding agent. */
export function CopyPrompt({ id, defaultOpen = false, className }: { id: AgentPromptId; defaultOpen?: boolean; className?: string }) {
  const entry = AGENT_PROMPTS[id]
  const [copied, setCopied] = React.useState(false)
  const [open, setOpen] = React.useState(defaultOpen)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setOpen(true)
    }
  }

  return (
    <div className={cn("not-prose mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-border", className)}>
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <SparklesIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{entry.title}</p>
          <p className="text-xs text-muted-foreground">{entry.description}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Hide" : "Preview"}
          <ChevronDownIcon data-icon="inline-end" className={cn("transition-transform", open && "rotate-180")} />
        </Button>
        <Button size="sm" onClick={() => void copy()} className="transition-[scale] active:scale-[0.96]">
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copied" : "Copy prompt"}
        </Button>
      </div>
      {open ? (
        <pre className="max-h-96 overflow-auto border-t border-border bg-muted/30 p-4 font-mono text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
          {entry.prompt}
        </pre>
      ) : null}
    </div>
  )
}
