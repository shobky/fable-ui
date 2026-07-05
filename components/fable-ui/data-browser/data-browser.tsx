"use client"

import { cva } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DataRow } from "@/lib/fable-ui/core"
import type { DataBrowserProps } from "./data-browser.types"
import { useDataBrowserActions } from "./hooks/use-data-browser-actions"
import { useDataBrowserQuery } from "./hooks/use-data-browser-query"
import { useRowDetailSurface } from "./hooks/use-row-detail-surface"
import {
  getFallbackFilters,
  getFallbackSortOptions,
} from "./lib/fallback-filters"
import { InlineError } from "./internal/inline-error"
import { PaginationFooter } from "./internal/pagination-footer"
import { ResponsiveDetailSurface } from "./internal/responsive-detail-surface"
import { TableView } from "./internal/table-view"
import { DataBrowserToolbar } from "./internal/toolbar"

const dataBrowserVariants = cva("w-full overflow-hidden", {
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

const contentGap = {
  sm: "gap-3 p-4",
  md: "gap-4 p-5",
  lg: "gap-5 p-6",
} as const

export function DataBrowser<Row extends DataRow = DataRow>({
  title,
  entityLabel,
  description,
  resourceId,
  searchPlaceholder,
  columns,
  rows = [],
  filters,
  sortOptions,
  initialFilters,
  initialSearch,
  initialSort,
  pageSize = 8,
  detail: detailConfig,
  rowActions,
  onViewRow,
  onRowAction,
  onRowActionSuccess,
  renderDetail,
  isLoading,
  isDisabled,
  error,
  variant,
  size = "md",
}: DataBrowserProps<Row>) {
  const effectiveFilters = filters ?? getFallbackFilters(rows, columns)
  const effectiveSortOptions = sortOptions ?? getFallbackSortOptions(columns)
  const detail = useRowDetailSurface<Row>()
  const query = useDataBrowserQuery<Row>({
    resourceId,
    rows,
    columns,
    filters: effectiveFilters,
    sortOptions: effectiveSortOptions,
    initialFilters,
    initialSearch,
    initialSort,
    pageSize,
  })
  const actions = rowActions ?? query.resource?.actions ?? []
  const browserActions = useDataBrowserActions<Row>({
    resourceId,
    onRowAction,
    onRowActionSuccess,
    refetch: query.refetch,
  })
  const busy = Boolean(isLoading || query.isLoading)
  const visibleError = error
    ? error
    : query.error
      ? { title: "Unable to load data", description: query.error.message }
      : undefined
  const totalRows = query.totalRows
  const hasNextPage = Boolean(
    query.nextCursor || query.page * query.pageSize < totalRows
  )
  const hasPreviousPage = Boolean(query.previousCursor || query.page > 1)
  const resolvedEntityLabel =
    entityLabel || query.resource?.entityLabel || "rows"
  const shouldShowDetails = Boolean(
    detailConfig ||
      renderDetail ||
      onViewRow ||
      actions.length > 0
  )

  function viewRow(row: Row) {
    if (onViewRow) {
      onViewRow(row)
      return
    }

    detail.open(row)
  }

  return (
    <>
      <Card
        className={cn(
          dataBrowserVariants({ variant, size }),
          "transition-[box-shadow,opacity] duration-200",
          isDisabled && "opacity-60"
        )}
        data-fable-ui="data-browser"
        aria-busy={busy || undefined}
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">
                {title || query.resource?.label || "Data browser"}
              </CardTitle>
              {description ? (
                <CardDescription>{description}</CardDescription>
              ) : null}
            </div>
            <div className="flex items-center gap-2 self-start">
              <Badge variant="secondary">
                {totalRows}{" "}
                {totalRows === 1
                  ? resolvedEntityLabel.replace(/s$/, "")
                  : resolvedEntityLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "flex min-h-0 flex-col",
            contentGap[size]
          )}
        >
          <DataBrowserToolbar
            search={query.state.search}
            searchPlaceholder={
              searchPlaceholder ?? `Search ${resolvedEntityLabel}`
            }
            filters={effectiveFilters}
            filterValues={query.state.filters}
            sortOptions={effectiveSortOptions}
            sort={query.state.sort}
            isDisabled={isDisabled}
            onSearchChange={query.setSearch}
            onFilterChange={query.setFilter}
            onSortChange={query.setSort}
            onClearFilters={query.clearFilters}
          />
          {visibleError ? (
            <InlineError
              title={visibleError.title}
              description={visibleError.description}
            />
          ) : null}
          {busy ? (
            <p className="text-sm text-muted-foreground">
              Loading {resolvedEntityLabel}...
            </p>
          ) : null}
          <TableView
            columns={columns}
            rows={query.rows}
            entityLabel={resolvedEntityLabel}
            isDisabled={isDisabled}
            onViewRow={shouldShowDetails ? viewRow : undefined}
          />
          <PaginationFooter
            page={query.page}
            pageSize={query.pageSize}
            totalRows={totalRows}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isDisabled={isDisabled}
            onPageChange={query.setPage}
          />
        </CardContent>
      </Card>
      <ResponsiveDetailSurface
        row={detail.row}
        title={`${title || "Detail"} detail`}
        description={description}
        columns={columns}
        detail={detailConfig}
        actions={actions}
        actionError={browserActions.actionError}
        pendingActionId={browserActions.pendingActionId}
        renderDetail={renderDetail}
        onClose={detail.close}
        onRunAction={browserActions.runAction}
      />
    </>
  )
}
