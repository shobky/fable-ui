"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { chartTypes, type ChartsProps, type ChartType } from "./charts.types"

const chartTypeLabels: Record<ChartType, string> = {
  line: "Line",
  bar: "Bar",
  pie: "Pie",
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type ResolvedSeries = {
  key: string
  label: string
  color: string
}

type ChartProblem = {
  title: string
  description?: string
}

function normalizeChartTypes(types?: ChartType[]): ChartType[] {
  const uniqueTypes = new Set(
    types?.filter((type) => chartTypes.includes(type))
  )

  return uniqueTypes.size > 0 ? Array.from(uniqueTypes) : ["line"]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function toFiniteNumber(value: unknown) {
  if (isFiniteNumber(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const next = Number(value)
    return Number.isFinite(next) ? next : undefined
  }

  return undefined
}

function getRowKeys(data: ChartsProps["data"]) {
  const keys = new Set<string>()

  for (const row of data) {
    Object.keys(row).forEach((key) => keys.add(key))
  }

  return Array.from(keys)
}

function getNumericKeys(data: ChartsProps["data"], keys: string[]) {
  return keys.filter((key) =>
    data.some((row) => toFiniteNumber(row[key]) !== undefined)
  )
}

function getTextKeys(data: ChartsProps["data"], keys: string[]) {
  return keys.filter((key) =>
    data.some((row) => {
      const value = row[key]
      return typeof value === "string" && value.trim() !== ""
    })
  )
}

function titleizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function resolveSeries({
  data,
  xKey,
  series,
}: Pick<ChartsProps, "data" | "xKey" | "series">) {
  const keys = getRowKeys(data)
  const numericKeys = getNumericKeys(data, keys).filter((key) => key !== xKey)
  const requestedSeries = series?.filter((item) =>
    numericKeys.includes(item.key)
  )
  const sourceSeries: Array<{
    key: string
    label?: string
    color?: string
  }> =
    requestedSeries && requestedSeries.length > 0
      ? requestedSeries
      : numericKeys.slice(0, 4).map((key) => ({ key }))

  return sourceSeries.map((item, index) => ({
    key: item.key,
    label: item.label || titleizeKey(item.key),
    color: item.color || chartColors[index % chartColors.length],
  }))
}

function resolveCartesianKeys(props: ChartsProps) {
  const keys = getRowKeys(props.data)
  const textKeys = getTextKeys(props.data, keys)
  const numericKeys = getNumericKeys(props.data, keys)
  const xKey =
    props.xKey && keys.includes(props.xKey)
      ? props.xKey
      : (textKeys[0] ?? keys.find((key) => !numericKeys.includes(key)))
  const series = resolveSeries({ ...props, xKey })

  return { xKey, series }
}

function resolvePieKeys(props: ChartsProps) {
  const keys = getRowKeys(props.data)
  const textKeys = getTextKeys(props.data, keys)
  const numericKeys = getNumericKeys(props.data, keys)
  const categoryKey =
    props.categoryKey && keys.includes(props.categoryKey)
      ? props.categoryKey
      : (textKeys[0] ?? keys.find((key) => key !== props.valueKey))
  const valueKey =
    props.valueKey && numericKeys.includes(props.valueKey)
      ? props.valueKey
      : numericKeys.find((key) => key !== categoryKey)

  return { categoryKey, valueKey }
}

function getChartProblem(
  type: ChartType,
  props: ChartsProps
): ChartProblem | null {
  if (props.data.length === 0) {
    return null
  }

  if (type === "pie") {
    const { categoryKey, valueKey } = resolvePieKeys(props)

    if (!categoryKey || !valueKey) {
      return {
        title: "Chart unavailable",
        description:
          "Pie charts need a category key and a numeric value key in the static data payload.",
      }
    }

    return null
  }

  const { xKey, series } = resolveCartesianKeys(props)

  if (!xKey || series.length === 0) {
    return {
      title: "Chart unavailable",
      description:
        "Line and bar charts need an x key and at least one numeric series in the static data payload.",
    }
  }

  return null
}

function createFormatter(format: ChartsProps["format"]) {
  return (value: unknown) => {
    const numericValue = toFiniteNumber(value)

    if (numericValue === undefined) {
      return String(value ?? "")
    }

    if (format?.value === "percent") {
      return new Intl.NumberFormat(format.locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(numericValue)
    }

    if (format?.value === "currency") {
      return new Intl.NumberFormat(format.locale, {
        style: "currency",
        currency: format.currency || "USD",
        notation: format.compact ? "compact" : "standard",
        maximumFractionDigits: format.compact ? 1 : 2,
      }).format(numericValue)
    }

    return new Intl.NumberFormat(format?.locale, {
      notation: format?.compact ? "compact" : "standard",
      maximumFractionDigits: 2,
    }).format(numericValue)
  }
}

function toChartConfig(series: ResolvedSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((item) => [
      item.key,
      {
        label: item.label,
        color: item.color,
      },
    ])
  )
}

function toCartesianData(
  data: ChartsProps["data"],
  xKey: string,
  series: ResolvedSeries[]
) {
  return data.map((row) => {
    const next: Record<string, string | number | null> = {
      [xKey]: String(row[xKey] ?? ""),
    }

    for (const item of series) {
      next[item.key] = toFiniteNumber(row[item.key]) ?? null
    }

    return next
  })
}

function toPieData(
  data: ChartsProps["data"],
  categoryKey: string,
  valueKey: string
) {
  return data
    .map((row, index) => ({
      name: String(row[categoryKey] ?? `Slice ${index + 1}`),
      value: toFiniteNumber(row[valueKey]) ?? 0,
      fill: chartColors[index % chartColors.length],
    }))
    .filter((row) => row.value > 0)
}

function ChartLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-72 w-full rounded-lg" />
      <div className="flex justify-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

function ChartEmpty({ emptyState }: Pick<ChartsProps, "emptyState">) {
  return (
    <Empty className="min-h-72 rounded-lg border">
      <EmptyHeader>
        <EmptyTitle>{emptyState?.title || "No chart data"}</EmptyTitle>
        {emptyState?.description ? (
          <EmptyDescription>{emptyState.description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  )
}

function ChartError({ error }: { error: ChartProblem }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{error.title}</AlertTitle>
      {error.description ? (
        <AlertDescription>{error.description}</AlertDescription>
      ) : null}
    </Alert>
  )
}

function CartesianChart({
  type,
  props,
}: {
  type: "line" | "bar"
  props: ChartsProps
}) {
  const { xKey, series } = resolveCartesianKeys(props)
  const formatValue = createFormatter(props.format)

  if (!xKey || series.length === 0) {
    return null
  }

  const chartData = toCartesianData(props.data, xKey, series)
  const config = toChartConfig(series)

  return (
    <ChartContainer
      config={config}
      className="min-h-72 w-full sm:min-h-80"
      initialDimension={{ width: 520, height: 320 }}
    >
      {type === "line" ? (
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatValue}
            width={48}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map((item) => (
            <Line
              key={item.key}
              dataKey={item.key}
              name={item.label}
              type="monotone"
              stroke={`var(--color-${item.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatValue}
            width={48}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={`var(--color-${item.key})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  )
}

function PieChartView({ props }: { props: ChartsProps }) {
  const { categoryKey, valueKey } = resolvePieKeys(props)
  const formatValue = createFormatter(props.format)

  if (!categoryKey || !valueKey) {
    return null
  }

  const chartData = toPieData(props.data, categoryKey, valueKey)
  const config: ChartConfig = {
    [valueKey]: {
      label: titleizeKey(valueKey),
      color: chartColors[0],
    },
  }

  return (
    <ChartContainer
      config={config}
      className="mx-auto min-h-72 w-full max-w-xl sm:min-h-80"
      initialDimension={{ width: 520, height: 320 }}
    >
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="name"
              formatter={(value, name) => (
                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">{String(name)}</span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatValue(value)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="48%"
          outerRadius="78%"
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

function ChartBody({ type, props }: { type: ChartType; props: ChartsProps }) {
  if (props.isLoading) {
    return <ChartLoading />
  }

  if (props.error) {
    return <ChartError error={props.error} />
  }

  if (props.data.length === 0) {
    return <ChartEmpty emptyState={props.emptyState} />
  }

  const problem = getChartProblem(type, props)

  if (problem) {
    return <ChartError error={problem} />
  }

  return type === "pie" ? (
    <PieChartView props={props} />
  ) : (
    <CartesianChart type={type} props={props} />
  )
}

export function Charts(props: ChartsProps) {
  const {
    title,
    description,
    context,
    availableChartTypes,
    defaultChartType,
    isDisabled,
  } = props
  const resolvedChartTypes = normalizeChartTypes(availableChartTypes)
  const initialChartType = defaultChartType
    ? resolvedChartTypes.find((type) => type === defaultChartType)
    : resolvedChartTypes[0]
  const [selectedChartType, setSelectedChartType] = React.useState<ChartType>(
    initialChartType ?? "line"
  )
  const activeChartType = resolvedChartTypes.includes(selectedChartType)
    ? selectedChartType
    : (initialChartType ?? resolvedChartTypes[0] ?? "line")

  return (
    <Card
      className={cn("w-full max-w-3xl", isDisabled && "opacity-60")}
      data-fable-ui="charts"
      aria-busy={props.isLoading || undefined}
    >
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title || "Charts"}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
            {context ? (
              <p className="text-sm text-muted-foreground">{context}</p>
            ) : null}
          </div>
          {resolvedChartTypes.length > 1 ? (
            <Tabs
              value={activeChartType}
              onValueChange={(value) =>
                setSelectedChartType(value as ChartType)
              }
            >
              <TabsList aria-label="Chart type">
                {resolvedChartTypes.map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    disabled={isDisabled || props.isLoading}
                  >
                    {chartTypeLabels[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <Badge variant="secondary">
              {chartTypeLabels[activeChartType]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartBody type={activeChartType} props={props} />
      </CardContent>
    </Card>
  )
}
