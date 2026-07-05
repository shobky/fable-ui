"use client"

import { FormEvent, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  Database,
  Download,
  Filter,
  Loader2,
  RotateCcw,
  RotateCw,
  Search,
  Send,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Icons } from "../icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

type DemoStage = "idle" | "thinking" | "metric-loading" | "data-loading" | "actions-loading" | "complete"
type SortKey = "date" | "customer" | "plan" | "amount" | "status"
type SortDirection = "asc" | "desc"

type SaleRecord = {
  transactionId: string
  date: string
  customer: string
  plan: string
  amount: number
  status: "Paid" | "Settled" | "Pending"
}

const prompt = "Show me this month sales."

const salesRecords: SaleRecord[] = [
  { transactionId: "1001", date: "2026-07-01", customer: "Northstar Labs", plan: "Enterprise", amount: 4200, status: "Settled" },
  { transactionId: "1002", date: "2026-07-01", customer: "Mira Patel", plan: "Team Annual", amount: 3100, status: "Paid" },
  { transactionId: "1003", date: "2026-07-01", customer: "Atlas Coffee Co.", plan: "Growth Monthly", amount: 2890, status: "Paid" },
  { transactionId: "1004", date: "2026-07-01", customer: "Cedar Health", plan: "Enterprise", amount: 5150, status: "Settled" },
  { transactionId: "1005", date: "2026-07-01", customer: "Elena Brooks", plan: "Pro Monthly", amount: 1725, status: "Paid" },
  { transactionId: "1006", date: "2026-07-01", customer: "Vector Forge", plan: "Enterprise", amount: 4900, status: "Settled" },
  { transactionId: "1007", date: "2026-07-01", customer: "Brightline Studio", plan: "Team Annual", amount: 2350, status: "Paid" },
  { transactionId: "1008", date: "2026-07-01", customer: "Owen Rivera", plan: "Starter Annual", amount: 980, status: "Paid" },
  { transactionId: "1009", date: "2026-07-01", customer: "Bloom Retail", plan: "Pro Monthly", amount: 1875, status: "Paid" },
  { transactionId: "1010", date: "2026-07-01", customer: "Summit BioSystems", plan: "Enterprise", amount: 5200, status: "Settled" },
  { transactionId: "1011", date: "2026-07-02", customer: "Nadia Chen", plan: "Starter Annual", amount: 1220, status: "Paid" },
  { transactionId: "1012", date: "2026-07-02", customer: "Harbor Analytics", plan: "Team Annual", amount: 3440, status: "Paid" },
  { transactionId: "1013", date: "2026-07-02", customer: "Pinecone Legal", plan: "Enterprise", amount: 4625, status: "Settled" },
  { transactionId: "1014", date: "2026-07-02", customer: "Aria Gomez", plan: "Growth Monthly", amount: 2895, status: "Paid" },
  { transactionId: "1015", date: "2026-07-02", customer: "Oak & Ember", plan: "Starter Annual", amount: 960, status: "Paid" },
  { transactionId: "1016", date: "2026-07-02", customer: "Mercury Grid", plan: "Enterprise", amount: 5400, status: "Settled" },
  { transactionId: "1017", date: "2026-07-02", customer: "Bluebird Finance", plan: "Enterprise", amount: 5250, status: "Settled" },
  { transactionId: "1018", date: "2026-07-02", customer: "Theo Martin", plan: "Pro Monthly", amount: 1435, status: "Paid" },
  { transactionId: "1019", date: "2026-07-02", customer: "Runway Ops", plan: "Team Annual", amount: 2210, status: "Paid" },
  { transactionId: "1020", date: "2026-07-02", customer: "Kinetic Works", plan: "Growth Monthly", amount: 3980, status: "Paid" },
  { transactionId: "1021", date: "2026-07-03", customer: "Iris Stone", plan: "Starter Annual", amount: 825, status: "Paid" },
  { transactionId: "1022", date: "2026-07-03", customer: "Evergreen Robotics", plan: "Enterprise", amount: 4800, status: "Settled" },
  { transactionId: "1023", date: "2026-07-03", customer: "Forma Design", plan: "Team Annual", amount: 2575, status: "Paid" },
  { transactionId: "1024", date: "2026-07-03", customer: "Lena Ortiz", plan: "Growth Monthly", amount: 3050, status: "Paid" },
  { transactionId: "1025", date: "2026-07-03", customer: "Fieldnote Supply", plan: "Starter Annual", amount: 1125, status: "Pending" },
  { transactionId: "1026", date: "2026-07-03", customer: "Quantum Freight", plan: "Enterprise", amount: 4890, status: "Settled" },
  { transactionId: "1027", date: "2026-07-03", customer: "Priya Shah", plan: "Starter Annual", amount: 710, status: "Paid" },
  { transactionId: "1028", date: "2026-07-03", customer: "Noble Foods", plan: "Team Annual", amount: 3325, status: "Paid" },
  { transactionId: "1029", date: "2026-07-03", customer: "Silverline Cloud", plan: "Enterprise", amount: 5000, status: "Settled" },
  { transactionId: "1030", date: "2026-07-03", customer: "Monarch Learning", plan: "Growth Monthly", amount: 2460, status: "Paid" },
  { transactionId: "1031", date: "2026-07-03", customer: "Camden Pierce", plan: "Pro Monthly", amount: 1785, status: "Paid" },
  { transactionId: "1032", date: "2026-07-03", customer: "Aster Security", plan: "Enterprise", amount: 4430, status: "Settled" },
]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const monthlySales = salesRecords.reduce((total, record) => total + record.amount, 0)

export function LandingPlaygroundDemo() {
  const [stage, setStage] = useState<DemoStage>("idle")
  const [draft, setDraft] = useState(prompt)

  function runDemo(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (stage !== "idle") {
      return
    }

    setStage("thinking")
    window.setTimeout(() => setStage("metric-loading"), 700)
    window.setTimeout(() => setStage("data-loading"), 1500)
    window.setTimeout(() => setStage("actions-loading"), 2500)
    window.setTimeout(() => setStage("complete"), 3400)
  }

  function resetDemo() {
    setStage("idle")
    setDraft(prompt)
  }

  const hasStarted = stage !== "idle"
  const showMetric = ["metric-loading", "data-loading", "actions-loading", "complete"].includes(stage)
  const showData = ["data-loading", "actions-loading", "complete"].includes(stage)
  const showActions = ["actions-loading", "complete"].includes(stage)

  return (
    <section className="mx-auto max-w-6xl flex w-full flex-col gap-4 px-4 pb-16 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-secondary/20 pb-4">
        <div className="grid sm:min-h-[620px]">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="truncate">New Chat</span>
              </div>
              <button
                type="button"
                onClick={resetDemo}
                className="inline-flex h-8  w-8 justify-center items-center gap-1.5 rounded-2xl border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasStarted}
              >
                <RotateCw className="size-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-10">
                <UserBubble>{hasStarted ? prompt : "Try the prompt below to browse a mock sales workflow."}</UserBubble>
                {stage === "thinking" ? <ThinkingMessage /> : null}
                {showMetric ? (
                  <AssistantBlock>
                    <p>I am pulling this month&apos;s data from the connected data source.</p>
                    <ToolCall label="metric_card" isLoading={stage === "metric-loading"} />
                    <DemoMetricCard isLoading={stage === "metric-loading"} />
                  </AssistantBlock>
                ) : null}
                {showData ? (
                  <AssistantBlock>
                    <ToolCall label="data_browser" isLoading={stage === "data-loading"} />
                    <DemoDataBrowser isLoading={stage === "data-loading"} />
                  </AssistantBlock>
                ) : null}
                {showActions ? (
                  <AssistantBlock>
                    <ToolCall label="suggestion_actions" isLoading={stage === "actions-loading"} />
                    <DemoSuggestedActions isLoading={stage === "actions-loading"} />
                  </AssistantBlock>
                ) : null}
              </div>
              <DemoComposer
                value={draft}
                onChange={setDraft}
                onSubmit={() => runDemo()}
                isBusy={hasStarted && stage !== "complete"}
                disabled={hasStarted}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-3 text-muted-foreground">{children}</div>
    </div>
  )
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[86%] rounded-[1.5rem] bg-muted px-4 py-2 text-sm text-foreground sm:max-w-[70%]">{children}</div>
    </div>
  )
}

function AssistantBlock({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-sm leading-6 text-foreground">{children}</div>
}

function ThinkingMessage() {
  return (
    <AssistantBlock>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Thinking...</span>
      </div>
    </AssistantBlock>
  )
}

function ToolCall({ label, isLoading }: { label: string; isLoading: boolean }) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
      {isLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />}
      <span>{label}</span>
    </div>
  )
}

function DemoMetricCard({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5">
      <div className="p-5 pb-2">
        {isLoading ? <Skeleton className="h-4 w-36" /> : <p className="text-sm font-medium text-muted-foreground">This Month&apos;s Sales (MTD)</p>}
      </div>
      <div className="flex flex-col gap-4 p-5 pt-0">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-48" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </>
        ) : (
          <>
            <p className="break-words font-mono text-4xl font-semibold leading-tight tabular-nums text-foreground">
              {currencyFormatter.format(monthlySales)}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-fit text-nowrap rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-400">
                +18.4% vs last month
              </span>
              <p className="text-sm leading-6 text-muted-foreground sm:text-right max-w-56">32 transactions from connected sales data</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DemoDataBrowser({ isLoading }: { isLoading: boolean }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [plan, setPlan] = useState("Enterprise")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return salesRecords
      .filter((record) => {
        const matchesSearch =
          normalizedQuery.length === 0 ||
          [record.transactionId, record.date, record.customer, record.plan, record.status, currencyFormatter.format(record.amount)]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        const matchesStatus = status === "all" || record.status === status
        const matchesPlan = plan === "all" || record.plan === plan

        return matchesSearch && matchesStatus && matchesPlan
      })
      .sort((a, b) => {
        const aValue = a[sortKey]
        const bValue = b[sortKey]
        const comparison = typeof aValue === "number" && typeof bValue === "number" ? aValue - bValue : String(aValue).localeCompare(String(bValue))

        return sortDirection === "asc" ? comparison : -comparison
      })
  }, [plan, query, sortDirection, sortKey, status])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDirection(key === "amount" ? "desc" : "asc")
  }

  return (
    <div className="w-full overflow-hidden rounded-[1.5rem] bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-medium">Recent Sales Transactions</h3>
          <p className="mt-1 text-sm text-muted-foreground">July 2026 sales records powering the monthly metric.</p>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{isLoading ? "Loading" : `${filteredRecords.length} rows`}</span>
      </div>

      <div className="space-y-3 px-5 pb-5">
        {isLoading ? (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_160px_160px]">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
            <div className="space-y-2 rounded-xl border border-border p-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search rows"
                  className="h-9 w-full rounded-2xl border border-transparent bg-input/50 px-9 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </label>
             <div className="flex gap-1 items-center">
               <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={"Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Settled">Settled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={plan} onValueChange={setPlan} >
                <SelectTrigger>
                  <SelectValue placeholder={"Plan"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Team Annual">Team Annual</SelectItem>
                  <SelectItem value="Growth Monthly">Growth Monthly</SelectItem>
                  <SelectItem value="Pro Monthly">Pro Monthly</SelectItem>
                  <SelectItem value="Starter Annual">Starter Annual</SelectItem>
                </SelectContent>
              </Select>
             </div>

            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="pl-3 py-3 font-medium">Transaction ID</th>
                      <SortableHead label="Date" sortKey="date" activeKey={sortKey} direction={sortDirection} onClick={toggleSort} />
                      <SortableHead label="Customer" sortKey="customer" activeKey={sortKey} direction={sortDirection} onClick={toggleSort} />
                      <SortableHead label="Plan" sortKey="plan" activeKey={sortKey} direction={sortDirection} onClick={toggleSort} />
                      <SortableHead label="Amount" sortKey="amount" activeKey={sortKey} direction={sortDirection} onClick={toggleSort} align="right" />
                      <SortableHead label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onClick={toggleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.transactionId} className="border-t border-border">
                        <td className="pl-3 py-3 font-mono text-xs text-muted-foreground">{record.transactionId}</td>
                        <td className="px-3 py-3">{dateFormatter.format(new Date(`${record.date}T12:00:00`))}</td>
                        <td className="px-3 py-3 font-medium">{record.customer}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.plan}</td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{currencyFormatter.format(record.amount)}</td>
                        <td className="px-3 py-3"><StatusPill status={record.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredRecords.length === 0 ? (
                <div className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">No records match the current search and filters.</div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SelectLike({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (

    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="h-9 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
    >
      {children}
    </select>
  )
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onClick,
  align = "left",
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onClick: (key: SortKey) => void
  align?: "left" | "right"
}) {
  const isActive = activeKey === sortKey

  return (
    <th className={cn("px-3 py-3 font-medium", align === "right" && "text-right")}>
      <button type="button" onClick={() => onClick(sortKey)} className={cn("inline-flex items-center gap-1.5 hover:text-foreground", align === "right" && "justify-end")}>
        {label}
        {isActive && direction === "desc" ? <ArrowDown className="size-3.5" aria-hidden="true" /> : <ArrowUpDown className="size-3.5" aria-hidden="true" />}
      </button>
    </th>
  )
}

function StatusPill({ status }: { status: SaleRecord["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "Paid" && "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-400",
        status === "Settled" && "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-400",
        status === "Pending" && "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300"
      )}
    >
      {status}
    </span>
  )
}

function DemoSuggestedActions({ isLoading }: { isLoading: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  const actions = [
    {
      icon: Filter,
      label: "Filter high value transactions",
      description: "Show only sales records above $4,000.",
    },
    {
      icon: Database,
      label: "View weekly breakdown",
      description: "Group July sales into weekly revenue buckets.",
    },
    {
      icon: Download,
      label: "Export sales data",
      description: "Prepare the visible table as a CSV export.",
    },
  ]

  return (
    <div className="w-full overflow-hidden rounded-[1.5rem] bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-3 p-5 pb-2">
        <div>
          <h3 className="text-base font-medium">Quick Actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">What would you like to explore next on your sales dashboard?</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">safe prompts</span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {isLoading ? (
          <>
            <Skeleton className="h-14 rounded-md" />
            <Skeleton className="h-14 rounded-md" />
            <Skeleton className="h-14 rounded-md" />
          </>
        ) : (
          actions.map((action) => {
            const Icon = action.icon
            const isSelected = selected === action.label

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => setSelected(action.label)}
                className={cn(
                  "flex h-auto items-center gap-3 whitespace-normal rounded-2xl border border-border bg-background px-3 py-3 text-left transition hover:bg-muted",
                  isSelected && "border-foreground/15 bg-muted"
                )}
              >
                <Icon className="mt-0.5 ml-1 size-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{isSelected ? "Selected for the next mock prompt." : action.description}</span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function DemoComposer({
  value,
  onChange,
  onSubmit,
  isBusy,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isBusy: boolean
  disabled: boolean
}) {

  function submitIfReady() {
    onSubmit()
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="sticky bottom-0 z-10  px-4 pb-4 pt-3 backdrop-blur-xl sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <div className="min-h-10 rounded-[2rem] bg-card/90 p-2  ring-1 ring-foreground/5">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            disabled={disabled}
            rows={2}
            aria-label="Prompt"
            placeholder="Ask fable-UI to inspect data, confirm an action, or show an interface..."
            className="min-h-10 w-full resize-none rounded-[1.5rem] bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-75"
          />
          <div className="flex items-center justify-end gap-3 p-4">
            <button
              type="button"
              disabled={disabled || value.trim().length === 0}
              onPointerDown={submitIfReady}

              aria-label="Send message"
              className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />
}
