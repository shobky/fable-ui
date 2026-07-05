import { tool } from "ai"
import { z } from "zod"

import { Charts } from "@/components/fable-ui/charts/charts"
import { defineFableComponent } from "@/lib/fable-ui/core"
import { chartTypes } from "./charts.types"

const chartTypeSchema = z.enum(chartTypes)
const chartValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])
const chartDataRowSchema = z.record(z.string(), chartValueSchema)

const chartSeriesSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
})

const chartFormatSchema = z.object({
  value: z.enum(["number", "currency", "percent"]).optional(),
  locale: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  compact: z.boolean().optional(),
})

export const showChartInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  context: z.string().optional(),
  data: z.array(chartDataRowSchema).max(200),
  xKey: z.string().min(1).optional(),
  categoryKey: z.string().min(1).optional(),
  valueKey: z.string().min(1).optional(),
  series: z.array(chartSeriesSchema).min(1).max(8).optional(),
  availableChartTypes: z.array(chartTypeSchema).min(1).max(3).optional(),
  defaultChartType: chartTypeSchema.optional(),
  format: chartFormatSchema.optional(),
  emptyState: z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
    })
    .optional(),
})

export type ShowChartInput = z.infer<typeof showChartInputSchema>

export function createShowChartTool() {
  return tool({
    description:
      "Show a chart from static, display-ready data already available in the conversation. Supports line, bar, and pie chart payloads. Do not fetch model-owned URLs, invent data, run SQL, or perform host data access.",
    inputSchema: showChartInputSchema,
    execute: async (input) => input,
  })
}

export const showChartTool = createShowChartTool()

export const showChart = defineFableComponent({
  name: "show_chart",
  schema: showChartInputSchema,
  tool: showChartTool,
  renderer: {
    Component: Charts,
    loadingProps: { title: "Charts", data: [], isLoading: true },
    emptyProps: { title: "Charts", data: [] },
    errorProps: (description: string) => ({
      title: "Charts unavailable",
      data: [],
      error: { title: "Charts unavailable", description },
    }),
    toProps: (data: ShowChartInput) => ({ ...data }),
  },
})
