"use client"

import * as React from "react"

import { ComponentPreviewTabs } from "@/components/component-preview-tabs"
import { ConfirmationCard, type ConfirmationCardProps } from "@/components/fable-ui/confirmation-card/confirmation-card"
import { DataBrowser } from "@/components/fable-ui/data-browser/data-browser"
import type { DataBrowserProps } from "@/components/fable-ui/data-browser/data-browser.types"
import { ShowTable } from "@/components/fable-ui/data-browser/show-table"
import { FormCard, type FormCardProps } from "@/components/fable-ui/form-card/form-card"
import { MetricCard, type MetricCardProps } from "@/components/fable-ui/metric-card/metric-card"
import { SuggestedActions, type SuggestedActionsProps } from "@/components/fable-ui/suggested-actions/suggested-actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DataColumn, DataRow } from "@/lib/fable-ui/core"

const previewStates = [
  { value: "ready", label: "Ready" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
  { value: "disabled", label: "Disabled" },
] as const

type PreviewState = (typeof previewStates)[number]["value"]

function PreviewStateTabs({
  value,
  onValueChange,
}: {
  value: PreviewState
  onValueChange: (value: PreviewState) => void
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as PreviewState)}>
      <TabsList className="flex-wrap">
        {previewStates.map((state) => (
          <TabsTrigger key={state.value} value={state.value}>
            {state.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function SourceBlock({ children, preview = false }: { children: string; preview?: boolean }) {
  const code = preview ? children.split("\n").slice(0, 10).join("\n") : children

  return (
    <pre className="m-0 overflow-x-auto bg-code px-4 py-3.5 text-sm text-code-foreground">
      <code>{code}</code>
    </pre>
  )
}

function PreviewFrame({
  children,
  state,
  onStateChange,
}: {
  children: React.ReactNode
  state: PreviewState
  onStateChange: (state: PreviewState) => void
}) {
  return (
    <div className=" flex w-full flex-col items-center gap-4">
      <div className="absolute top-4">
        <PreviewStateTabs value={state} onValueChange={onStateChange} />
      </div>
      <div className="w-full h-full pt-10">
        {children}
      </div>
    </div>
  )
}

const metricCardSource = `import { MetricCard } from "@/components/fable-ui/metric-card/metric-card"

export function RevenueMetric() {
  return (
    <MetricCard
      label="Revenue today"
      value="EGP 4,200"
      trend={{ direction: "up", delta: "+18% vs yesterday" }}
      context="Best Monday this month"
      variant="elevated"
    />
  )
}`

const metricPropsByState: Record<PreviewState, MetricCardProps> = {
  ready: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "up", delta: "+18% vs yesterday" },
    context: "Best Monday this month",
    variant: "elevated",
  },
  loading: {
    label: "Revenue today",
    value: "EGP 4,200",
    isLoading: true,
    variant: "elevated",
  },
  empty: {
    label: "",
    value: "",
    variant: "elevated",
  },
  error: {
    label: "Revenue today",
    value: "",
    error: {
      title: "Metric unavailable",
      description: "The tool result did not match the expected data contract.",
    },
    variant: "elevated",
  },
  disabled: {
    label: "Revenue today",
    value: "EGP 4,200",
    trend: { direction: "neutral", delta: "Needs approval" },
    context: "Waiting for the host app",
    isDisabled: true,
    variant: "elevated",
  },
}

export function MetricCardPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <MetricCard {...metricPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{metricCardSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{metricCardSource}</SourceBlock>}
      previewClassName="h-auto min-h-80 p-6"
      align="center"
    />
  )
}

const suggestedActionsSource = `import { SuggestedActions } from "@/components/fable-ui/suggested-actions/suggested-actions"

export function FollowUps() {
  return (
    <SuggestedActions
      title="Next safe actions"
      description="Prompt-only follow ups for the current answer."
      actions={[
        { label: "Compare to yesterday", prompt: "Compare this to yesterday." },
        { label: "Show source rows", prompt: "Show the source rows." },
      ]}
    />
  )
}`

const suggestedActionsPropsByState: Record<PreviewState, SuggestedActionsProps> = {
  ready: {
    title: "Next safe actions",
    description: "Prompt-only follow ups for the current answer.",
    actions: [
      { label: "Compare to yesterday", prompt: "Compare this to yesterday." },
      { label: "Show source rows", prompt: "Show the source rows." },
    ],
  },
  loading: {
    title: "Next safe actions",
    actions: [],
    isLoading: true,
  },
  empty: {
    title: "Next safe actions",
    actions: [],
  },
  error: {
    title: "Next safe actions",
    actions: [],
    error: {
      title: "Suggestions unavailable",
      description: "The model returned an invalid suggestion payload.",
    },
  },
  disabled: {
    title: "Next safe actions",
    description: "Buttons are visible but cannot be sent yet.",
    actions: [{ label: "Compare to yesterday", prompt: "Compare this to yesterday." }],
    isDisabled: true,
  },
}

export function SuggestedActionsPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <SuggestedActions {...suggestedActionsPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{suggestedActionsSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{suggestedActionsSource}</SourceBlock>}
      previewClassName="h-auto min-h-96 p-6"
      align="center"
    />
  )
}

const confirmationSource = `import { ConfirmationCard } from "@/components/fable-ui/confirmation-card/confirmation-card"

export function RefundConfirmation() {
  return (
    <ConfirmationCard
      id="refund-1007"
      title="Refund order 1007?"
      description="The host app will run the refund after confirmation."
      variant="warning"
      details={["Amount: EGP 420", "Reason: duplicate charge"]}
    />
  )
}`

const confirmationPropsByState: Record<PreviewState, ConfirmationCardProps> = {
  ready: {
    id: "refund-1007",
    title: "Refund order 1007?",
    description: "The host app will run the refund after confirmation.",
    variant: "warning",
    details: ["Amount: EGP 420", "Reason: duplicate charge"],
  },
  loading: {
    id: "refund-1007",
    title: "Preparing confirmation",
    description: "Checking the action contract.",
    isLoading: true,
  },
  empty: {
    id: "empty-confirmation",
    title: "",
    description: "No confirmation details are available yet.",
    details: [],
  },
  error: {
    id: "refund-1007",
    title: "Refund order 1007?",
    description: "The host app will run the refund after confirmation.",
    error: {
      title: "Confirmation unavailable",
      description: "The requested action is not allowlisted.",
    },
  },
  disabled: {
    id: "refund-1007",
    title: "Refund order 1007?",
    description: "The host app will run the refund after confirmation.",
    variant: "warning",
    details: ["Amount: EGP 420", "Reason: duplicate charge"],
    isDisabled: true,
  },
}

export function ConfirmationCardPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <ConfirmationCard {...confirmationPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{confirmationSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{confirmationSource}</SourceBlock>}
      previewClassName="h-auto min-h-96 p-6"
      align="center"
    />
  )
}

const formSource = `import { FormCard } from "@/components/fable-ui/form-card/form-card"

export function CollectRefundReason() {
  return (
    <FormCard
      title="Collect refund reason"
      description="The host validates submitted values before writing."
      fields={[
        { name: "reason", label: "Reason", type: "textarea", required: true },
        { name: "notify", label: "Notify customer", type: "toggle" },
      ]}
    />
  )
}`

const readyFormFields: FormCardProps["fields"] = [
  { name: "reason", label: "Reason", type: "textarea", required: true, placeholder: "Why is this needed?" },
  { name: "notify", label: "Notify customer", type: "toggle" },
]

const formPropsByState: Record<PreviewState, FormCardProps> = {
  ready: {
    title: "Collect refund reason",
    description: "The host validates submitted values before writing.",
    fields: readyFormFields,
  },
  loading: {
    title: "Collect refund reason",
    fields: [],
    isLoading: true,
  },
  empty: {
    title: "Collect input",
    description: "No fields were supplied by the tool payload.",
    fields: [],
  },
  error: {
    title: "Collect refund reason",
    fields: readyFormFields,
    error: {
      title: "Form unavailable",
      description: "One field failed schema validation.",
    },
  },
  disabled: {
    title: "Collect refund reason",
    description: "Inputs are locked while the host checks permissions.",
    fields: readyFormFields,
    isDisabled: true,
  },
}

export function FormCardPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <FormCard key={state} {...formPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{formSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{formSource}</SourceBlock>}
      previewClassName="h-auto min-h-[30rem] p-6"
      align="center"
    />
  )
}

const orderColumns: DataColumn[] = [
  { key: "orderNumber", label: "Order #" },
  { key: "customer", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total", type: "currency", align: "right" },
]

const orderRows: DataRow[] = [
  { id: "ord_1001", orderNumber: "1001", customer: "Nadia Ali", status: "paid", total: 420 },
  { id: "ord_1002", orderNumber: "1002", customer: "Mina Fahmy", status: "new", total: 180 },
  { id: "ord_1003", orderNumber: "1003", customer: "Sarah Adel", status: "canceled", total: 75 },
]

const dataBrowserSource = `import { DataBrowser } from "@/components/fable-ui/data-browser/data-browser"

export function OrdersBrowser() {
  return (
    <DataBrowser
      title="Orders"
      entityLabel="orders"
      columns={columns}
      rows={rows}
      pageSize={5}
      searchPlaceholder="Search orders"
    />
  )
}`

const dataBrowserPropsByState: Record<PreviewState, DataBrowserProps> = {
  ready: {
    title: "Orders",
    entityLabel: "orders",
    description: "Static local rows use the same surface as registered resources.",
    columns: orderColumns,
    rows: orderRows,
    pageSize: 5,
    searchPlaceholder: "Search orders",
  },
  loading: {
    title: "Orders",
    entityLabel: "orders",
    columns: orderColumns,
    rows: [],
    isLoading: true,
  },
  empty: {
    title: "Orders",
    entityLabel: "orders",
    columns: orderColumns,
    rows: [],
  },
  error: {
    title: "Orders",
    entityLabel: "orders",
    columns: orderColumns,
    rows: [],
    error: {
      title: "Unable to load orders",
      description: "The registered resource returned an error.",
    },
  },
  disabled: {
    title: "Orders",
    entityLabel: "orders",
    columns: orderColumns,
    rows: orderRows,
    isDisabled: true,
  },
}

export function DataBrowserPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <DataBrowser {...dataBrowserPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{dataBrowserSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{dataBrowserSource}</SourceBlock>}
      previewClassName="h-auto min-h-[34rem] p-6"
      align="center"
    />
  )
}

const showTableSource = `import { ShowTable } from "@/components/fable-ui/data-browser/show-table"

export function RecentOrdersTable() {
  return (
    <ShowTable
      title="Recent orders"
      description="A small static snapshot."
      columns={columns}
      rows={rows}
    />
  )
}`

export function ShowTablePreview() {
  const [state, setState] = React.useState<PreviewState>("ready")
  const common = {
    title: "Recent orders",
    description: "A small static snapshot for answer context.",
    columns: orderColumns,
  }
  const propsByState = {
    ready: { ...common, rows: orderRows },
    loading: { ...common, rows: [], isLoading: true },
    empty: { ...common, rows: [] },
    error: {
      ...common,
      rows: [],
      error: { title: "Table unavailable", description: "Rows failed validation." },
    },
    disabled: { ...common, rows: orderRows, isDisabled: true },
  } satisfies Record<PreviewState, React.ComponentProps<typeof ShowTable>>

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <ShowTable {...propsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{showTableSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{showTableSource}</SourceBlock>}
      previewClassName="h-auto min-h-[34rem] p-6"
      align="center"
    />
  )
}
