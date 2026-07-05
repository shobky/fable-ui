export const chartTypes = ["line", "bar", "pie"] as const

export type ChartType = (typeof chartTypes)[number]
export type ChartValue = string | number | boolean | null
export type ChartDataRow = Record<string, ChartValue>

export type ChartSeries = {
  key: string
  label?: string
  color?: string
}

export type ChartFormat = {
  value?: "number" | "currency" | "percent"
  locale?: string
  currency?: string
  compact?: boolean
}

export type ChartsProps = {
  title: string
  description?: string
  context?: string
  data: ChartDataRow[]
  xKey?: string
  categoryKey?: string
  valueKey?: string
  series?: ChartSeries[]
  availableChartTypes?: ChartType[]
  defaultChartType?: ChartType
  format?: ChartFormat
  emptyState?: {
    title: string
    description?: string
  }
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
}
