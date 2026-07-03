"use client"

import * as React from "react"

import { ComponentPreviewTabs } from "@/components/component-preview-tabs"
import { Button } from "@/components/ui/button"
import { MetricCard, type MetricCardProps } from "@/components/fable-ui/metric-card/metric-card"
import { cn } from "@/lib/utils"

const states = [
  { value: "ready", label: "Ready" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
  { value: "disabled", label: "Disabled" },
] as const

type PreviewState = (typeof states)[number]["value"]

const stateProps: Record<PreviewState, MetricCardProps> = {
  ready: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "up", delta: "+18% vs yesterday" },
    context: "Best Monday this month",
    variant: "elevated",
  },
  loading: {
    label: "Revenue today",
    value: "EGP 4,200",
    isLoading: true,
    variant: "elevated",
  },
  empty: {
    label: "",
    value: "",
    variant: "elevated",
  },
  error: {
    label: "Revenue today",
    value: "",
    error: {
      title: "Metric unavailable",
      description: "The tool result did not match the expected data contract.",
    },
    variant: "elevated",
  },
  disabled: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "neutral", delta: "Needs approval" },
    context: "Waiting for the host app",
    isDisabled: true,
    variant: "elevated",
  },
}

const metricCardSource = `import { MetricCard } from "@/components/fable-ui/metric-card/metric-card"

export function RevenueMetric() {
  return (
    <MetricCard
      label="Revenue today"
      value="EGP 4,200"
      trend={{ direction: "up", delta: "+18% vs yesterday" }}
      context="Best Monday this month"
      variant="elevated"
    />
  )
}`

function SourceBlock({ preview = false }: { preview?: boolean }) {
  const lines = preview
    ? metricCardSource.split("\n").slice(0, 10).join("\n")
    : metricCardSource

  return (
    <pre className="m-0 overflow-x-auto bg-code px-4 py-3.5 text-sm text-code-foreground">
      <code>{lines}</code>
    </pre>
  )
}

export function MetricCardPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {states.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={state === item.value ? "default" : "outline"}
                className={cn("rounded-md", state !== item.value && "bg-background")}
                onClick={() => setState(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <MetricCard {...stateProps[state]} />
        </div>
      }
      source={<SourceBlock />}
      sourcePreview={<SourceBlock preview />}
      previewClassName="h-auto min-h-80 p-6"
      align="center"
    />
  )
}
