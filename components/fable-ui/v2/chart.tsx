import { useId } from "react"

import { cn } from "@/lib/utils"

export interface FableChartPoint {
  label: string
  value: number
}

export interface FableBarChartProps {
  label: string
  points: FableChartPoint[]
  format?: "number" | "currency" | "percent"
  currency?: string
  locale?: string
  className?: string
}

function formatValue(
  value: number,
  format: FableBarChartProps["format"],
  currency: string | undefined,
  locale: string | undefined
) {
  const safeLocale = locale || "en"
  if (format === "currency" && currency) {
    return new Intl.NumberFormat(safeLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (format === "percent") {
    return new Intl.NumberFormat(safeLocale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100)
  }
  return new Intl.NumberFormat(safeLocale, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value)
}

export function FableBarChart({
  label,
  points,
  format = "number",
  currency,
  locale,
  className,
}: FableBarChartProps) {
  const width = 640
  const height = 220
  const paddingLeft = 56
  const paddingRight = 18
  const paddingTop = 18
  const paddingBottom = 30
  const chartHeight = height - paddingTop - paddingBottom
  const dataMin = Math.min(0, ...points.map((point) => point.value))
  const dataMax = Math.max(0, ...points.map((point) => point.value))
  const hasRange = dataMax !== dataMin
  const min = hasRange ? dataMin : 0
  const max = hasRange ? dataMax : 1
  const range = max - min
  const yFor = (value: number) => paddingTop + ((max - value) / range) * chartHeight
  const zeroY = yFor(0)
  const ticks = hasRange
    ? [...new Set([max, (max + min) / 2, min])]
    : [0]
  const innerWidth = width - paddingLeft - paddingRight
  const slotWidth = points.length > 0 ? innerWidth / points.length : 0
  const barWidth = Math.min(44, slotWidth * 0.48)
  const descriptionId = useId()

  return (
    <figure className={cn("min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-black/[0.025] sm:p-5", className)}>
      <figcaption className="text-sm font-semibold tracking-[-0.01em]">{label}</figcaption>
      <svg
        className="mt-5 block h-auto w-full overflow-visible text-muted-foreground"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={descriptionId}
      >
        <title id={descriptionId}>{label}</title>
        {ticks.map((tick) => {
          const y = yFor(tick)
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={tick === 0 ? "0.22" : "0.1"}
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-current text-[11px] tabular-nums"
              >
                {formatValue(tick, format, currency, locale)}
              </text>
            </g>
          )
        })}
        {points.map((point, index) => {
          const valueY = yFor(point.value)
          const barY = Math.min(valueY, zeroY)
          const barHeight = Math.max(Math.abs(zeroY - valueY), 2)
          const x = paddingLeft + slotWidth * index + (slotWidth - barWidth) / 2
          const labelX = paddingLeft + slotWidth * index + slotWidth / 2

          return (
            <g key={`${point.label}-${index}`}>
              <rect
                x={x}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx="7"
                fill="var(--chart-2)"
                fillOpacity="0.82"
              />
              <text
                x={labelX}
                y={height - 4}
                textAnchor="middle"
                className="fill-current text-[12px]"
              >
                {point.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="sr-only">
        {points.map((point, index) => (
          <li key={`${point.label}-${index}`}>
            {point.label}: {formatValue(point.value, format, currency, locale)}
          </li>
        ))}
      </ul>
    </figure>
  )
}
