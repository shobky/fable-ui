"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IconCheck, IconLoader2, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { FableSpecRenderer } from "@/components/fable-ui/v2/renderer"
import { createFableSpecStream, encodeFableSpecStream } from "@/components/fable-ui/v2/stream"
import type { FableSpecStream } from "@/components/fable-ui/v2/stream"
import type { FableViewSpec } from "@/components/fable-ui/v2/catalog"
import { demoData, demoSpec } from "./fixture"

type PreviewStatus = "idle" | "streaming" | "complete" | "cancelled" | "error"

export function PlaygroundClient() {
  const encodedFixture = useMemo(() => encodeFableSpecStream(demoSpec), [])
  const [spec, setSpec] = useState<FableViewSpec | null>(null)
  const [status, setStatus] = useState<PreviewStatus>("idle")
  const [patchCount, setPatchCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<FableSpecStream | null>(null)

  const replay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.cancel()

    const stream = createFableSpecStream()
    streamRef.current = stream
    let cursor = 0
    setSpec(null)
    setPatchCount(0)
    setStatus("streaming")

    timerRef.current = setInterval(() => {
      if (cursor < encodedFixture.length) {
        const chunk = encodedFixture.slice(cursor, cursor + 176)
        cursor += chunk.length
        const update = stream.push(chunk)
        if (update.spec) setSpec(update.spec)
        setPatchCount(update.acceptedPatches)
        if (update.issue) {
          setStatus("error")
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
          streamRef.current = null
        }
        return
      }

      const update = stream.finish()
      if (update.spec) setSpec(update.spec)
      setPatchCount(update.acceptedPatches)
      setStatus(update.complete ? "complete" : "error")
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      streamRef.current = null
    }, 95)
  }, [encodedFixture])

  const cancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null

    const update = streamRef.current?.cancel()
    streamRef.current = null
    if (update?.spec) setSpec(update.spec)
    if (update) setPatchCount(update.acceptedPatches)
    setStatus("cancelled")
  }, [])

  useEffect(() => {
    replay()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      streamRef.current?.cancel()
      streamRef.current = null
    }
  }, [replay])

  const statusCopy = {
    idle: "Preparing the sample",
    streaming: `Composing the sample · ${patchCount} patches`,
    complete: `Sample ready · ${patchCount} validated patches`,
    cancelled: `Sample paused · ${patchCount} validated patches kept`,
    error: "The sample could not be completed safely",
  }[status]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Fable UI 2.0 · Experimental
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
          Interfaces that make the answer easier to use.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Fable composes readable text, host-owned evidence, and local controls into one reviewable response. This sample is deterministic; it does not call a model or a data provider.
        </p>
      </header>

      <section aria-labelledby="preview-heading" className="min-w-0">
        <div className="overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm shadow-black/[0.03]">
          <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rounded-full bg-chart-2" />
                <p className="text-xs font-medium text-muted-foreground">Deterministic stream fixture</p>
              </div>
              <h2 id="preview-heading" className="mt-1 text-sm font-semibold tracking-[-0.01em]">
                Destination performance · 30 days
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
                {status === "streaming" ? (
                  <IconLoader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : status === "complete" ? (
                  <IconCheck aria-hidden="true" className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : null}
                {statusCopy}
              </p>
              {status === "streaming" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={cancel}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={replay}
                >
                  <IconRefresh data-icon="inline-start" aria-hidden="true" />
                  Replay
                </Button>
              )}
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-7">
            {spec ? (
              <FableSpecRenderer spec={spec} data={demoData} />
            ) : (
              <div className="space-y-4" aria-hidden="true">
                <div className="h-7 w-4/5 animate-pulse rounded-lg bg-muted sm:w-2/3" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted" />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-3 sm:gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Structure streams in</p>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            The renderer reveals validated pieces as they arrive and keeps the same element IDs between updates.
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">The host owns the numbers</p>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Metric, chart, and property values resolve from a local typed result map, not from the layout spec.
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Interaction stays local</p>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            The destination control filters the current result in the browser. It makes no request and performs no action.
          </p>
        </div>
      </div>
    </div>
  )
}
