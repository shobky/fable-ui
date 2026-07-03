import type { ShowMetricInput } from "@/lib/fable-ui/tools/show-metric-tool"

export const metricCardExamples = {
  ready: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "up", delta: "+18% vs yesterday" },
    context: "Best Monday this month",
  },
  empty: {
    label: "",
    value: "",
  },
  disabled: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "neutral", delta: "No material change" },
    context: "Waiting for approval",
  },
} satisfies Record<string, ShowMetricInput>
