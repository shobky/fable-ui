"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, DownloadIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { formatDate, formatValue } from "../format"
import { useFable, useFableState } from "../provider"
import { downloadText, hostLabel, safeLinkUrl, toCsv } from "../safety"
import type { BlockOf } from "../schema"
import { BlockHeader, CopyAction, IconAction, surface } from "./shared"

type Column = BlockOf<"table">["columns"][number]
type Row = BlockOf<"table">["rows"][number]

const NUMERIC = new Set(["number", "currency", "percent"])
const PAGE = 12

const positive = /^(active|paid|done|complete|completed|approved|live|shipped|yes|success|healthy|on track|delivered|in stock|open)$/i
const negative = /^(failed|overdue|blocked|declined|cancelled|canceled|error|no|churned|at risk|out of stock|critical|rejected)$/i
const caution = /^(pending|draft|in progress|review|scheduled|paused|waiting|low stock|trial|medium)$/i

function badgeTone(value: string) {
  if (positive.test(value)) return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
  if (negative.test(value)) return "bg-destructive/10 text-destructive ring-destructive/20"
  if (caution.test(value)) return "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300"
  return "bg-muted text-muted-foreground ring-border"
}

function Cell({ column, value, locale }: { column: Column; value: Row[string]; locale?: string }) {
  const type = column.type ?? (typeof value === "number" ? "number" : "text")
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground/60">—</span>
  if (type === "badge") {
    return (
      <Badge variant="outline" className={cn("border-0 font-medium ring-1 ring-inset", badgeTone(String(value)))}>
        {String(value)}
      </Badge>
    )
  }
  if (type === "link") {
    const href = safeLinkUrl(String(value))
    if (!href) return <span>{String(value)}</span>
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-medium underline decoration-foreground/25 underline-offset-[3px] hover:decoration-foreground"
      >
        {hostLabel(href)}
      </a>
    )
  }
  if (type === "date") return <span className="whitespace-nowrap">{formatDate(value, locale)}</span>
  if (NUMERIC.has(type) && typeof value === "number") {
    return (
      <span className="tabular-nums">
        {formatValue(value, { format: type as "number", currency: column.currency, locale })}
      </span>
    )
  }
  return <span>{formatValue(value)}</span>
}

function compare(a: Row[string], b: Row[string]) {
  if (a === b) return 0
  if (a === null || a === undefined || a === "") return 1
  if (b === null || b === undefined || b === "") return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  const dateA = Date.parse(String(a))
  const dateB = Date.parse(String(b))
  if (/^\d{4}-\d{2}/.test(String(a)) && !Number.isNaN(dateA) && !Number.isNaN(dateB)) return dateA - dateB
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
}

export function TableBlock({ block, open }: { block: BlockOf<"table">; open?: boolean }) {
  const { locale } = useFable()
  const [sort, setSort] = useFableState<{ key: string; dir: "asc" | "desc" } | null>("sort", null)
  const [query, setQuery] = useFableState("query", "")
  const [limit, setLimit] = useFableState("limit", PAGE)
  const searchId = React.useId()
  const scrollHintId = React.useId()
  const scroller = React.useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = React.useState({ horizontal: false, vertical: false })

  React.useEffect(() => {
    const node = scroller.current
    if (!node) return
    const measure = () => {
      const horizontal = node.scrollWidth > node.clientWidth
      const vertical = node.scrollHeight > node.clientHeight
      setOverflow((current) =>
        current.horizontal === horizontal && current.vertical === vertical ? current : { horizontal, vertical }
      )
    }
    measure()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(node)
    if (node.firstElementChild) observer?.observe(node.firstElementChild)
    window.addEventListener("resize", measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const scrollable = overflow.horizontal || overflow.vertical

  const sortable = block.sortable !== false && !open
  const searchable = (block.searchable ?? block.rows.length > 10) && !open

  const rows = React.useMemo(() => {
    let result = block.rows
    const needle = query.trim().toLowerCase()
    if (needle) {
      result = result.filter((row) =>
        block.columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(needle))
      )
    }
    if (sort) {
      result = [...result].sort((a, b) => compare(a[sort.key], b[sort.key]) * (sort.dir === "asc" ? 1 : -1))
    }
    return result
  }, [block.rows, block.columns, query, sort])

  const visible = open ? rows : rows.slice(0, limit)
  const csv = () => toCsv(block.columns, block.rows)
  const filename = (block.title ?? "table").toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key !== key ? { key, dir: "asc" } : current.dir === "asc" ? { key, dir: "desc" } : null
    )

  return (
    <section className={cn(surface, "overflow-hidden")} aria-label={block.title ?? "Table"}>
      {block.title || block.description || block.downloadable !== false || searchable ? (
        <div className="space-y-3 px-4 pt-3.5 pb-3">
          <BlockHeader
            title={block.title}
            description={block.description}
            actions={
              open ? null : (
                <>
                  <CopyAction text={csv()} label="Copy as CSV" />
                  {block.downloadable !== false ? (
                    <IconAction label="Download CSV" onClick={() => downloadText(filename, csv(), "text/csv")}>
                      <DownloadIcon className="size-4" />
                    </IconAction>
                  ) : null}
                </>
              )
            }
          />
          {searchable ? (
            <div className="relative">
              <label htmlFor={searchId} className="sr-only">
                Search {block.title ?? "table"}
              </label>
              <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setLimit(PAGE)
                }}
                placeholder={`Search ${block.rows.length} rows`}
                className="h-8 w-full rounded-lg bg-muted/60 ps-8 pe-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 @lg:max-w-64"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {overflow.horizontal ? (
        <p id={scrollHintId} className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          Scroll horizontally to see all columns. Use the arrow keys when the table is focused.
        </p>
      ) : null}
      <div
        ref={scroller}
        className="max-h-[34rem] overflow-auto overscroll-x-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        role={scrollable ? "region" : undefined}
        aria-label={scrollable ? `${block.title ?? "Table"} scroll area` : undefined}
        aria-describedby={overflow.horizontal ? scrollHintId : undefined}
        tabIndex={scrollable ? 0 : undefined}
      >
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              {block.columns.map((column, index) => {
                const numeric = NUMERIC.has(column.type ?? "")
                const align = column.align ?? (numeric ? "end" : "start")
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "h-9 border-y border-border bg-muted/40 px-4 text-xs font-medium whitespace-nowrap text-muted-foreground",
                      align === "end" && "text-end",
                      align === "center" && "text-center",
                      align === "start" && "text-start",
                      index === 0 && "sticky start-0 z-10 bg-[color-mix(in_oklab,var(--card),var(--muted)_40%)]"
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                          align === "end" && "flex-row-reverse",
                          active && "text-foreground"
                        )}
                      >
                        {column.label}
                        {active ? (
                          sort.dir === "asc" ? (
                            <ArrowUpIcon className="size-3" aria-hidden />
                          ) : (
                            <ArrowDownIcon className="size-3" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDownIcon className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                {block.columns.map((column, index) => {
                  const numeric = NUMERIC.has(column.type ?? "")
                  const align = column.align ?? (numeric ? "end" : "start")
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "border-b border-border/60 px-4 py-2.5 align-middle transition-colors group-last/row:border-b-0 group-hover/row:bg-muted/40",
                        align === "end" && "text-end",
                        align === "center" && "text-center",
                        index === 0 && "sticky start-0 bg-card font-medium text-foreground group-hover/row:bg-[color-mix(in_oklab,var(--card),var(--muted)_40%)]"
                      )}
                    >
                      <Cell column={column} value={row[column.key]} locale={locale} />
                    </td>
                  )
                })}
              </tr>
            ))}
            {visible.length === 0 && !open ? (
              <tr>
                <td colSpan={block.columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {query ? `No rows match “${query}”.` : "No rows."}
                </td>
              </tr>
            ) : null}
          </tbody>
          {block.footer && !open ? (
            <tfoot>
              <tr>
                {block.columns.map((column, index) => {
                  const numeric = NUMERIC.has(column.type ?? "")
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "border-t border-border bg-muted/30 px-4 py-2.5 font-semibold",
                        (column.align ?? (numeric ? "end" : "start")) === "end" && "text-end",
                        index === 0 && "sticky start-0 bg-[color-mix(in_oklab,var(--card),var(--muted)_30%)]"
                      )}
                    >
                      {block.footer?.[column.key] !== undefined ? (
                        <Cell column={column} value={block.footer[column.key]} locale={locale} />
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {!open && rows.length > visible.length ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {visible.length} of {rows.length} rows
          </span>
          <Button variant="ghost" size="sm" onClick={() => setLimit((value) => value + PAGE * 2)}>
            Show more
          </Button>
        </div>
      ) : null}
    </section>
  )
}
