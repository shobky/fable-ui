"use client"

import * as React from "react"
import { parsePartialJson } from "ai"

import { FableProvider } from "@/components/fable-ui/provider"
import { FableRenderer } from "@/components/fable-ui/renderer"
import { cn } from "@/lib/utils"
import { DEMO_IMAGE_HOSTS, SCENARIOS } from "@/lib/playground/scenarios"

const SHOWCASE = ["dashboard", "trip", "email", "gallery", "template"] as const
const LABELS: Record<(typeof SHOWCASE)[number], string> = {
  dashboard: "Dashboard",
  trip: "Trip plan",
  email: "Email draft",
  gallery: "Moodboard",
  template: "Template",
}

/** Replays a scripted spec chunk by chunk, the way a model streams it. */
function useReplay(spec: unknown, key: string) {
  const [state, setState] = React.useState<{ partial: unknown; streaming: boolean }>({ partial: spec, streaming: false })

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState({ partial: spec, streaming: false })
      return
    }
    const json = JSON.stringify(spec)
    let index = 0
    let cancelled = false
    const step = async () => {
      if (cancelled) return
      index = Math.min(json.length, index + 90)
      const done = index >= json.length
      const partial = done ? spec : (await parsePartialJson(json.slice(0, index))).value
      if (cancelled) return
      setState({ partial, streaming: !done })
      if (!done) setTimeout(step, 28)
    }
    setState({ partial: { blocks: [] }, streaming: true })
    const timer = setTimeout(step, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [spec, key])

  return state
}

export function HomeDemo() {
  const [active, setActive] = React.useState<(typeof SHOWCASE)[number]>("dashboard")
  const [run, setRun] = React.useState(0)
  const scenario = SCENARIOS.find((entry) => entry.id === active)
  const { partial, streaming } = useReplay(scenario?.spec, `${active}-${run}`)

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-[0_24px_80px_-32px_rgb(0_0_0/0.25)]">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {SHOWCASE.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActive(id)
              setRun((value) => value + 1)
            }}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {LABELS[id]}
          </button>
        ))}
        <span className="ms-auto flex shrink-0 items-center gap-1.5 ps-3 text-xs text-muted-foreground" aria-live="polite">
          <span className={cn("size-1.5 rounded-full", streaming ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-muted-foreground/40")} />
          {streaming ? "Streaming" : "Done"}
        </span>
      </div>
      <div className="max-h-[44rem] overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex justify-end">
            <p className="max-w-[85%] rounded-[1.25rem] rounded-ee-md bg-muted px-4 py-2.5 text-[0.9375rem]">{scenario?.prompt}</p>
          </div>
          <FableProvider images={{ allowedHosts: DEMO_IMAGE_HOSTS }} onReply={() => setRun((value) => value + 1)}>
            <FableRenderer id={`home-${active}`} spec={partial} streaming={streaming} />
          </FableProvider>
        </div>
      </div>
    </div>
  )
}
