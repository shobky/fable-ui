"use client"

import Link from "next/link"
import { BarChart3, CheckCircle2, ListFilter, PenLine } from "lucide-react"

export const playgroundExamples = [
  { label: "Show a metric", prompt: "Show a revenue metric", icon: BarChart3 },
  {
    label: "Browse records",
    prompt: "Show the people browser",
    icon: ListFilter,
  },
  {
    label: "Confirm an action",
    prompt: "Confirm a refund",
    icon: CheckCircle2,
  },
  { label: "Collect input", prompt: "Show a contact form", icon: PenLine },
] as const

export function PlaygroundBrowse({
  onSelect,
  disabled = false,
}: {
  onSelect: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <nav aria-label="Explore Fable UI" className="flex flex-col gap-8">
      <div>
        <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Try a surface
        </p>
        <div className="flex flex-col gap-1">
          {playgroundExamples.map(({ label, prompt, icon: Icon }) => (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt)}
              className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Learn
        </p>
        <div className="flex flex-col gap-1">
          <Link
            href="/docs/introduction"
            className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Introduction
          </Link>
          <Link
            href="/docs/registry"
            className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Browse the registry
          </Link>
          <Link
            href="/docs/ai-sdk-integration"
            className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            AI SDK integration
          </Link>
        </div>
      </div>
    </nav>
  )
}
