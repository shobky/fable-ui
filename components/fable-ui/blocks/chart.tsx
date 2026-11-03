"use client"

import * as React from "react"
import { ChartColumnIcon, TableIcon } from "lucide-react"
import {
  Area,
  AreaChart,
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

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

import { formatNumber, type FormatOptions } from "../format"
import { useFable, useFableState } from "../provider"
import type { BlockOf } from "../schema"
import { BlockHeader, IconAction, SwapIcon, surface } from "./shared"

type TooltipEntry = { name?: string | number; value?: unknown; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }

function ChartTip({
  active,
  payload,
  label,
  config,
  format,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: unknown
  config: ChartConfig
  format: FormatOptions
}) {
  if (!active || !payload?.length) return null
  const heading = label ?? payload[0]?.payload?.__label
  return (
    <div className="min-w-36 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg ring-1 ring-border">
      {heading !== undefined ? <p className="mb-1.5 font-medium">{String(heading)}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? entry.name ?? index)
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: entry.color ?? entry.payload?.fill as string }} />
              <span className="text-muted-foreground">{config[key]?.label ?? entry.name}</span>
              <span className="ms-auto font-medium tabular-nums">
                {typeof entry.value === "number" ? formatNumber(entry.value, format) : String(entry.value ?? "—")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const seriesColor = (index: number) => `var(--chart-${(index % 5) + 1})`

function DataTable({ block, format }: { block: BlockOf<"chart">; format: FormatOptions }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg ring-1 ring-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-start font-medium">
              {block.xKey}
            </th>
            {block.series.map((series) => (
              <th key={series.key} scope="col" className="px-3 py-2 text-end font-medium">
                {series.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.data.map((row, index) => (
            <tr key={index} className="border-t border-border/60">
              <th scope="row" className="px-3 py-2 text-start font-medium">
                {String(row[block.xKey] ?? "")}
              </th>
              {block.series.map((series) => (
                <td key={series.key} className="px-3 py-2 text-end tabular-nums">
                  {typeof row[series.key] === "number" ? formatNumber(row[series.key] as number, format) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChartBlock({ block }: { block: BlockOf<"chart"> }) {
  const { locale } = useFable()
  const [asTable, setAsTable] = useFableState("table", false)
  const format: FormatOptions = { format: block.format, currency: block.currency, locale }
  const compact: FormatOptions = { ...format, format: block.format === "percent" ? "percent" : "compact" }
  const gradientId = React.useId().replace(/:/g, "")

  const config = Object.fromEntries(
    block.series.map((series, index) => [series.key, { label: series.label, color: `var(--chart-${(index % 5) + 1})` }])
  ) satisfies ChartConfig

  const circular = block.kind === "pie" || block.kind === "donut"
  const pieSeries = block.series[0]
  const pieData = circular
    ? block.data
        .map((row, index) => ({
          __label: String(row[block.xKey] ?? ""),
          value: typeof row[pieSeries.key] === "number" ? (row[pieSeries.key] as number) : 0,
          fill: `var(--chart-${(index % 5) + 1})`,
        }))
        .filter((entry) => entry.value > 0)
    : []
  const pieTotal = pieData.reduce((sum, entry) => sum + entry.value, 0)

  const axis = {
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tick: { fontSize: 12 },
  } as const

  const cartesian = (
    <>
      <CartesianGrid vertical={Boolean(block.horizontal)} horizontal={!block.horizontal} strokeDasharray="3 3" className="stroke-border" />
      {block.horizontal ? (
        <>
          <YAxis dataKey={block.xKey} type="category" width={96} {...axis} />
          <XAxis type="number" {...axis} tickFormatter={(value: number) => formatNumber(value, compact)} />
        </>
      ) : (
        <>
          <XAxis dataKey={block.xKey} {...axis} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axis} width={48} tickFormatter={(value: number) => formatNumber(value, compact)} />
        </>
      )}
      <ChartTooltip cursor={{ className: "fill-muted/60 stroke-border" }} content={<ChartTip config={config} format={format} />} />
    </>
  )

  let chart: React.ReactElement
  if (circular) {
    chart = (
      <PieChart>
        <ChartTooltip content={<ChartTip config={{ value: { label: pieSeries.label } }} format={format} />} />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="__label"
          innerRadius={block.kind === "donut" ? "58%" : 0}
          outerRadius="92%"
          paddingAngle={block.kind === "donut" ? 2 : 0}
          strokeWidth={block.kind === "donut" ? 0 : 2}
          className="stroke-card"
          isAnimationActive={false}
        >
          {pieData.map((entry) => (
            <Cell key={entry.__label} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    )
  } else if (block.kind === "line") {
    chart = (
      <LineChart data={block.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {cartesian}
        {block.series.map((series, index) => (
          <Line
            key={series.key}
            dataKey={series.key}
            type="monotone"
            stroke={seriesColor(index)}
            strokeWidth={2}
            dot={block.data.length <= 12 ? { r: 2.5, strokeWidth: 0, fill: seriesColor(index) } : false}
            activeDot={{ r: 4, strokeWidth: 2, className: "stroke-card" }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    )
  } else if (block.kind === "area") {
    chart = (
      <AreaChart data={block.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {block.series.map((series, index) => (
            <linearGradient key={series.key} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesColor(index)} stopOpacity={0.35} />
              <stop offset="100%" stopColor={seriesColor(index)} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {cartesian}
        {block.series.map((series, index) => (
          <Area
            key={series.key}
            dataKey={series.key}
            type="monotone"
            stackId={block.stacked ? "stack" : undefined}
            stroke={seriesColor(index)}
            strokeWidth={2}
            fill={`url(#${gradientId}-${index})`}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    )
  } else {
    chart = (
      <BarChart
        data={block.data}
        layout={block.horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="22%"
      >
        {cartesian}
        {block.series.map((series, index) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            stackId={block.stacked ? "stack" : undefined}
            fill={seriesColor(index)}
            radius={
              block.stacked && index < block.series.length - 1
                ? 0
                : block.horizontal
                  ? [0, 4, 4, 0]
                  : [4, 4, 0, 0]
            }
            maxBarSize={44}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    )
  }

  const height = block.horizontal ? Math.min(Math.max(block.data.length * 36 + 40, 180), 480) : 260

  return (
    <figure className={cn(surface, "p-4 @lg:p-5")}>
      <BlockHeader
        title={block.title}
        description={block.description}
        className="mb-4"
        actions={
          <IconAction label={asTable ? "Show chart" : "Show data table"} onClick={() => setAsTable((value) => !value)}>
            <SwapIcon swapped={asTable} from={TableIcon} to={ChartColumnIcon} />
          </IconAction>
        }
      />
      {asTable ? (
        <DataTable block={block} format={format} />
      ) : circular ? (
        <div className="grid items-center gap-6 @lg:grid-cols-[minmax(0,12rem)_1fr]">
          <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-60">
            {chart}
          </ChartContainer>
          <ul className="space-y-2">
            {pieData.map((entry) => (
              <li key={entry.__label} className="flex items-center gap-2.5 text-sm">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: entry.fill }} />
                <span className="min-w-0 flex-1 truncate">{entry.__label}</span>
                <span className="text-muted-foreground tabular-nums">{formatNumber(entry.value, format)}</span>
                <span className="w-12 text-end text-xs text-muted-foreground tabular-nums">
                  {pieTotal ? `${Math.round((entry.value / pieTotal) * 100)}%` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
            {chart}
          </ChartContainer>
          {block.series.length > 1 ? (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {block.series.map((series, index) => (
                <li key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-[3px]" style={{ background: seriesColor(index) }} />
                  {series.label}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      <figcaption className="sr-only">{block.title ?? `${block.kind} chart`}</figcaption>
    </figure>
  )
}
