import { cva, type VariantProps } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type MetricTrendDirection = "up" | "down" | "neutral"

const metricCardVariants = cva("w-full max-w-md overflow-hidden transition-opacity", {
  variants: {
    variant: {
      default: "bg-card shadow-sm",
      elevated: "bg-card shadow-lg shadow-foreground/5",
      subtle: "bg-muted/40 shadow-none",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

const metricContentSize = {
  sm: { header: "p-4 pb-2", content: "p-4 pt-0", value: "text-3xl" },
  md: { header: "p-5 pb-2", content: "p-5 pt-0", value: "text-4xl" },
  lg: { header: "p-6 pb-3", content: "p-6 pt-0", value: "text-5xl" },
} as const

export interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  label: string
  value: string
  trend?: {
    direction: MetricTrendDirection
    delta: string
  }
  context?: string
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  className?: string
}

const trendClassName: Record<MetricTrendDirection, string> = {
  up: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-400",
  down: "border-red-200 bg-red-100 text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-400",
  neutral: "border-border bg-muted text-muted-foreground",
}

export function MetricCard({
  label,
  value,
  trend,
  context,
  isLoading,
  isDisabled,
  error,
  variant,
  size,
  className,
}: MetricCardProps) {
  const resolvedSize = size ?? "md"
  const sizeClasses = metricContentSize[resolvedSize]
  const hasMetric = label.trim().length > 0 && value.trim().length > 0

  return (
    <Card
      className={cn(
        metricCardVariants({ variant, size }),
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      data-fable-ui="metric-card"
      aria-busy={isLoading || undefined}
    >
      <CardHeader className={sizeClasses.header}>
        <CardTitle className="break-words text-sm font-medium leading-none text-muted-foreground">
          {isLoading ? <Skeleton className="h-4 w-28" /> : label || "Metric"}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-4", sizeClasses.content)}>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-40" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">{error.title}</p>
            {error.description ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{error.description}</p>
            ) : null}
          </div>
        ) : !hasMetric ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Metric unavailable</p>
            <p className="max-w-60 text-xs leading-5 text-muted-foreground">
              A label and value are required before this metric can be displayed.
            </p>
          </div>
        ) : (
          <>
            <p
              className={cn(
                "break-words font-mono font-semibold leading-tight text-foreground tabular-nums",
                sizeClasses.value,
              )}
            >
              {value}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {trend ? (
                <Badge className={cn("w-fit", trendClassName[trend.direction])}>
                  {trend.delta}
                </Badge>
              ) : (
                <span className="text-sm leading-6 text-muted-foreground">No trend provided</span>
              )}
              {context ? (
                <p className="text-sm leading-6 text-muted-foreground sm:text-right">{context}</p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default MetricCard
