"use client"

import * as React from "react"
import { parsePartialJson } from "ai"
import { RotateCcwIcon } from "lucide-react"

import { FableProvider } from "@/components/fable-ui/provider"
import { FableRenderer } from "@/components/fable-ui/renderer"
import { Button } from "@/components/ui/button"
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
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_80px_-32px_rgb(0_0_0/0.18)] dark:shadow-[0_24px_80px_-32px_rgb(0_0_0/0.6)]">
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/70 bg-muted/30 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1">
          {SHOWCASE.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActive(id)
                setRun((value) => value + 1)
              }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] sm:text-sm",
                active === id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              {LABELS[id]}
            </button>
          ))}
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-2 ps-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setRun((value) => value + 1)}
            aria-label="Replay stream"
            title="Replay stream"
            className="text-muted-foreground transition-[transform,color] hover:text-foreground active:scale-[0.96]"
          >
            <RotateCcwIcon className="size-3.5" />
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums" aria-live="polite">
            <span
              className={cn(
                "size-1.5 rounded-full",
                streaming ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-muted-foreground/40"
              )}
            />
            {streaming ? "Streaming" : "Done"}
          </span>
        </div>
      </div>
      <div className="max-h-[44rem] overflow-y-auto scrollbar-pretty">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex justify-end">
            <p className="max-w-[85%] rounded-[1.25rem] rounded-ee-md bg-muted px-4 py-2.5 text-[0.9375rem] text-foreground">
              {scenario?.prompt}
            </p>
          </div>
          <FableProvider images={{ allowedHosts: DEMO_IMAGE_HOSTS }} onReply={() => setRun((value) => value + 1)}>
            <FableRenderer id={`home-${active}`} spec={partial} streaming={streaming} />
          </FableProvider>
        </div>
      </div>
    </div>
  )
}
