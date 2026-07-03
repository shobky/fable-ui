import { tool } from "ai"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { MetricCard } from "@/components/fable-ui/metric-card/metric-card"

export const showMetricInputSchema = z.object({
  label: z.string().min(1).describe("Short label for the metric."),
  value: z.string().min(1).describe("Formatted metric value, including units or currency."),
  trend: z
    .object({
      direction: z.enum(["up", "down", "neutral"]),
      delta: z.string().min(1).describe("Short trend text, such as '+18% vs yesterday'."),
    })
    .optional(),
  context: z.string().min(1).optional().describe("One short line that helps interpret the metric."),
})

export type ShowMetricInput = z.infer<typeof showMetricInputSchema>

export function createShowMetricTool() {
  return tool({
    description:
      "Display one trusted numeric metric with a label, formatted value, optional trend, and short context. Do not use for lists, tables, browsing, forms, suggestions, or actions.",
    inputSchema: showMetricInputSchema,
    execute: async (input) => input,
  })
}

export const showMetric = defineFableComponent({
  name: "show_metric",
  schema: showMetricInputSchema,
  tool: createShowMetricTool(),
  renderer: {
    Component: MetricCard,
    loadingProps: { label: "Metric", value: "0", isLoading: true },
    emptyProps: { label: "", value: "" },
    errorProps: (description: string) => ({
      label: "Metric",
      value: "",
      error: { title: "Metric unavailable", description },
    }),
    toProps: (data: ShowMetricInput) => ({ ...data, variant: "elevated" as const }),
  },
})
