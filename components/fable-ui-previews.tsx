"use client"

import * as React from "react"

import { ComponentPreviewTabs } from "@/components/component-preview-tabs"
import { Charts } from "@/components/fable-ui/charts/charts"
import type { ChartsProps } from "@/components/fable-ui/charts/charts.types"
import {
  ConfirmationCard,
  type ConfirmationCardProps,
} from "@/components/fable-ui/confirmation-card/confirmation-card"
import { DataBrowser } from "@/components/fable-ui/data-browser/data-browser"
import type { DataBrowserProps } from "@/components/fable-ui/data-browser/data-browser.types"
import { ShowTable } from "@/components/fable-ui/data-browser/show-table"
import { CodeBlockCard } from "@/components/fable-ui/code-block-card"
import { EmailComposerCard } from "@/components/fable-ui/email-composer-card"
import {
  FormCard,
  type FormCardProps,
} from "@/components/fable-ui/form-card/form-card"
import {
  MetricCard,
  type MetricCardProps,
} from "@/components/fable-ui/metric-card/metric-card"
import {
  SuggestedActions,
  type SuggestedActionsProps,
} from "@/components/fable-ui/suggested-actions/suggested-actions"
import { TextEditorCard } from "@/components/fable-ui/text-editor-card"
import { HighlightedSourceBlock } from "@/components/highlighted-source-block"
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

const contentCardPreviewStates = [
  { value: "ready", label: "Ready" },
  { value: "loading", label: "Loading" },
  { value: "streaming", label: "Streaming" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
  { value: "disabled", label: "Disabled" },
] as const

type ContentCardPreviewState =
  (typeof contentCardPreviewStates)[number]["value"]

function PreviewStateTabs({
  value,
  onValueChange,
}: {
  value: PreviewState
  onValueChange: (value: PreviewState) => void
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as PreviewState)}
    >
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

function SourceBlock({
  children,
  preview = false,
}: {
  children: string
  preview?: boolean
}) {
  return (
    <HighlightedSourceBlock
      code={children}
      previewLines={preview ? 10 : undefined}
    />
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
    <div className="flex w-full flex-col items-center gap-4">
      <div className="absolute top-4">
        <PreviewStateTabs value={state} onValueChange={onStateChange} />
      </div>
      <div className="flex h-full w-full justify-center pt-10">{children}</div>
    </div>
  )
}

function ContentCardPreviewFrame({
  children,
  state,
  onStateChange,
}: {
  children: React.ReactNode
  state: ContentCardPreviewState
  onStateChange: (state: ContentCardPreviewState) => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Tabs
        value={state}
        onValueChange={(next) => onStateChange(next as ContentCardPreviewState)}
      >
        <TabsList className="flex-wrap">
          {contentCardPreviewStates.map((previewState) => (
            <TabsTrigger key={previewState.value} value={previewState.value}>
              {previewState.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex h-full w-full justify-center">{children}</div>
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

const suggestedActionsPropsByState: Record<
  PreviewState,
  SuggestedActionsProps
> = {
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
    actions: [
      { label: "Compare to yesterday", prompt: "Compare this to yesterday." },
    ],
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
      sourcePreview={
        <SourceBlock preview>{suggestedActionsSource}</SourceBlock>
      }
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
  {
    name: "reason",
    label: "Reason",
    type: "textarea",
    required: true,
    placeholder: "Why is this needed?",
  },
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

const chartsSource = `import { Charts } from "@/components/fable-ui/charts/charts"

const data = [
  { month: "Jan", direct: 120, referral: 84 },
  { month: "Feb", direct: 148, referral: 96 },
  { month: "Mar", direct: 172, referral: 118 },
  { month: "Apr", direct: 196, referral: 132 },
  { month: "May", direct: 214, referral: 151 },
]

export function RevenueCharts() {
  return (
    <Charts
      title="Monthly signups"
      description="Static AI-provided chart data."
      data={data}
      xKey="month"
      series={[
        { key: "direct", label: "Direct" },
        { key: "referral", label: "Referral" },
      ]}
      availableChartTypes={["line", "bar"]}
      defaultChartType="line"
    />
  )
}`

const pieChartSource = `import { Charts } from "@/components/fable-ui/charts/charts"

const data = [
  { channel: "Direct", value: 38 },
  { channel: "Referral", value: 27 },
  { channel: "Organic", value: 21 },
  { channel: "Paid", value: 14 },
]

export function ChannelMixPieChart() {
  return (
    <Charts
      title="Signup channel mix"
      description="Part-to-whole breakdown for the current period."
      data={data}
      categoryKey="channel"
      valueKey="value"
      availableChartTypes={["pie", "bar"]}
      defaultChartType="pie"
      format={{ value: "percent" }}
    />
  )
}`

const chartRows = [
  { month: "Jan", direct: 120, referral: 84 },
  { month: "Feb", direct: 148, referral: 96 },
  { month: "Mar", direct: 172, referral: 118 },
  { month: "Apr", direct: 196, referral: 132 },
  { month: "May", direct: 214, referral: 151 },
]

const chartsPropsByState: Record<PreviewState, ChartsProps> = {
  ready: {
    title: "Monthly signups",
    description: "Static AI-provided chart data.",
    data: chartRows,
    xKey: "month",
    series: [
      { key: "direct", label: "Direct" },
      { key: "referral", label: "Referral" },
    ],
    availableChartTypes: ["line", "bar"],
    defaultChartType: "line",
  },
  loading: {
    title: "Monthly signups",
    data: [],
    isLoading: true,
  },
  empty: {
    title: "Monthly signups",
    data: [],
    emptyState: {
      title: "No chart data",
      description: "The tool payload did not include rows.",
    },
  },
  error: {
    title: "Monthly signups",
    data: chartRows,
    error: {
      title: "Chart unavailable",
      description: "The chart payload failed validation.",
    },
  },
  disabled: {
    title: "Monthly signups",
    data: chartRows,
    xKey: "month",
    series: [
      { key: "direct", label: "Direct" },
      { key: "referral", label: "Referral" },
    ],
    availableChartTypes: ["line", "bar"],
    defaultChartType: "bar",
    isDisabled: true,
  },
}

export function ChartsPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <Charts {...chartsPropsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{chartsSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{chartsSource}</SourceBlock>}
      previewClassName="h-auto min-h-[34rem] p-6"
      align="center"
    />
  )
}

const pieChartRows = [
  { channel: "Direct", value: 38 },
  { channel: "Referral", value: 27 },
  { channel: "Organic", value: 21 },
  { channel: "Paid", value: 14 },
]

export function PieChartPreview() {
  const [state, setState] = React.useState<PreviewState>("ready")

  const propsByState = {
    ready: {
      title: "Signup channel mix",
      description: "Part-to-whole breakdown for the current period.",
      data: pieChartRows,
      categoryKey: "channel",
      valueKey: "value",
      availableChartTypes: ["pie", "bar"],
      defaultChartType: "pie",
      format: { value: "percent" },
    },
    loading: {
      title: "Signup channel mix",
      data: [],
      isLoading: true,
    },
    empty: {
      title: "Signup channel mix",
      data: [],
      emptyState: {
        title: "No channel data",
        description: "The tool payload did not include slices.",
      },
    },
    error: {
      title: "Signup channel mix",
      data: [],
      error: {
        title: "Pie chart unavailable",
        description: "The chart payload failed validation.",
      },
    },
    disabled: {
      title: "Signup channel mix",
      description: "Part-to-whole breakdown for the current period.",
      data: pieChartRows,
      categoryKey: "channel",
      valueKey: "value",
      availableChartTypes: ["pie", "bar"],
      defaultChartType: "pie",
      format: { value: "percent" },
      isDisabled: true,
    },
  } satisfies Record<PreviewState, ChartsProps>

  return (
    <ComponentPreviewTabs
      component={
        <PreviewFrame state={state} onStateChange={setState}>
          <Charts {...propsByState[state]} />
        </PreviewFrame>
      }
      source={<SourceBlock>{pieChartSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{pieChartSource}</SourceBlock>}
      previewClassName="h-auto min-h-[34rem] p-6"
      align="center"
    />
  )
}

const orderColumns: DataColumn[] = [
  { key: "customer", label: "Customer", sortable: true },
  { key: "orderNumber", label: "Order #", width: 132 },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
    width: 128,
  },
  { key: "region", label: "Region", filterable: true, width: 128 },
  {
    key: "total",
    label: "Total",
    type: "currency",
    align: "right",
    width: 136,
  },
]

const orderNames = [
  "Nadia Ali",
  "Mina Fahmy",
  "Sarah Adel",
  "Omar Saleh",
  "Lina Nasser",
  "Youssef Mansour",
]
const orderStatuses = ["paid", "new", "review", "canceled"]
const orderRegions = ["Cairo", "Giza", "Alexandria", "Mansoura"]

function createPreviewAvatar(name: string) {
  return `https://api.dicebear.com/10.x/stripes/svg?seed=${encodeURIComponent(name)}`
}

const orderRows: DataRow[] = Array.from({ length: 50 }, (_, index) => {
  const customer = orderNames[index % orderNames.length]

  return {
    id: `ord_${1001 + index}`,
    orderNumber: String(1001 + index),
    customer,
    avatarUrl: customer && createPreviewAvatar(customer),
    status: orderStatuses[index % orderStatuses.length],
    region: orderRegions[index % orderRegions.length],
    total: 75 + ((index * 37) % 850),
  }
})

const dataBrowserSource = `import { DataBrowser } from "@/components/fable-ui/data-browser/data-browser"

const columns = [
  { key: "customer", label: "Customer", sortable: true },
  { key: "orderNumber", label: "Order #", width: 132 },
  { key: "status", label: "Status", type: "badge", filterable: true },
  { key: "region", label: "Region", filterable: true },
  { key: "total", label: "Total", type: "currency", align: "right" },
]

const rows = [
  {
    id: "ord_1001",
    customer: "Nadia Ali",
    orderNumber: "1001",
    status: "paid",
    region: "Cairo",
    total: 420,
  },
  {
    id: "ord_1002",
    customer: "Mina Fahmy",
    orderNumber: "1002",
    status: "review",
    region: "Giza",
    total: 185,
  },
  {
    id: "ord_1003",
    customer: "Sarah Adel",
    orderNumber: "1003",
    status: "new",
    region: "Alexandria",
    total: 268,
  },
  {
    id: "ord_1004",
    customer: "Omar Saleh",
    orderNumber: "1004",
    status: "paid",
    region: "Mansoura",
    total: 512,
  },
]

export function OrdersBrowser() {
  return (
    <DataBrowser
      title="Orders"
      entityLabel="orders"
      columns={columns}
      rows={rows}
      pageSize={6}
      searchPlaceholder="Search orders"
    />
  )
}`

const dataBrowserPropsByState: Record<PreviewState, DataBrowserProps> = {
  ready: {
    title: "Orders",
    entityLabel: "orders",
    description:
      "Static local rows use the same surface as registered resources.",
    columns: orderColumns,
    rows: orderRows,
    pageSize: 6,
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
      description="A paginated static snapshot."
      columns={columns}
      rows={rows}
      pageSize={6}
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
    ready: { ...common, rows: orderRows, pageSize: 6 },
    loading: { ...common, rows: [], isLoading: true },
    empty: { ...common, rows: [] },
    error: {
      ...common,
      rows: [],
      error: {
        title: "Table unavailable",
        description: "Rows failed validation.",
      },
    },
    disabled: { ...common, rows: orderRows, pageSize: 8, isDisabled: true },
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

const textEditorSource = `import { TextEditorCard } from "@/components/fable-ui/text-editor-card"

export function ProposalDraft() {
  return (
    <TextEditorCard
      label="Proposal notes"
      content="Start with a short summary."
      format="markdown"
      filename="proposal-notes.md"
      maxLength={1200}
    />
  )
}`

export function TextEditorCardPreview() {
  const [state, setState] = React.useState<ContentCardPreviewState>("ready")
  const propsByState = {
    ready: {
      label: "Proposal notes",
      content: "## Launch notes\n\nKeep the summary direct and useful.",
      format: "markdown",
      filename: "launch-notes.md",
      maxLength: 1200,
    },
    loading: { label: "Proposal notes", content: "", isLoading: true },
    streaming: {
      label: "Proposal notes",
      content: "## Launch notes\n\nDrafting the next section…",
      format: "markdown",
      isStreaming: true,
    },
    empty: { label: "Proposal notes", content: "" },
    error: {
      label: "Proposal notes",
      content: "## Partial notes\n\nThe completed portion is still available.",
      format: "markdown",
      error: {
        title: "Draft interrupted",
        description: "Copy or download the available text before retrying.",
      },
    },
    disabled: {
      label: "Proposal notes",
      content: "This approved note stays selectable and exportable.",
      isDisabled: true,
    },
  } satisfies Record<
    ContentCardPreviewState,
    React.ComponentProps<typeof TextEditorCard>
  >

  return (
    <ComponentPreviewTabs
      component={
        <ContentCardPreviewFrame state={state} onStateChange={setState}>
          <TextEditorCard key={state} {...propsByState[state]} />
        </ContentCardPreviewFrame>
      }
      source={<SourceBlock>{textEditorSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{textEditorSource}</SourceBlock>}
      previewClassName="h-auto min-h-[30rem] p-6"
      align="center"
    />
  )
}

const emailComposerSource = `import { EmailComposerCard } from "@/components/fable-ui/email-composer-card"

export function WelcomeEmail() {
  return (
    <EmailComposerCard
      to={["reader@example.com"]}
      subject="Welcome to the team"
      body="Hi there,\\n\\nHere is your first-week checklist."
    />
  )
}`

export function EmailComposerCardPreview() {
  const [state, setState] = React.useState<ContentCardPreviewState>("ready")
  const propsByState = {
    ready: {
      to: ["reader@example.com"],
      subject: "Welcome to the team",
      body: "Hi there,\n\nHere is your first-week checklist.",
    },
    loading: { subject: "", body: "", isLoading: true },
    streaming: {
      to: ["reader@example.com"],
      subject: "Welcome to the team",
      body: "Hi there,\n\nDrafting the remaining details…",
      isStreaming: true,
    },
    empty: { subject: "", body: "" },
    error: {
      to: ["reader@example.com"],
      subject: "Welcome to the team",
      body: "Hi there,\n\nThe completed email remains available to copy.",
      error: {
        title: "Email draft interrupted",
        description: "Copy the available package before retrying.",
      },
    },
    disabled: {
      to: ["reader@example.com"],
      subject: "Approved announcement",
      body: "This read-only draft can still be copied.",
      isDisabled: true,
    },
  } satisfies Record<
    ContentCardPreviewState,
    React.ComponentProps<typeof EmailComposerCard>
  >

  return (
    <ComponentPreviewTabs
      component={
        <ContentCardPreviewFrame state={state} onStateChange={setState}>
          <EmailComposerCard key={state} {...propsByState[state]} />
        </ContentCardPreviewFrame>
      }
      source={<SourceBlock>{emailComposerSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{emailComposerSource}</SourceBlock>}
      previewClassName="h-auto min-h-[34rem] p-6"
      align="center"
    />
  )
}

const codeBlockSource = `import { CodeBlockCard } from "@/components/fable-ui/code-block-card"

export function InstallCommand() {
  return (
    <CodeBlockCard
      language="ts"
      filename="welcome.ts"
      code={'export const welcome = "Hello"'}
    />
  )
}`

export function CodeBlockCardPreview() {
  const [state, setState] = React.useState<ContentCardPreviewState>("ready")
  const propsByState = {
    ready: {
      language: "ts",
      filename: "welcome.ts",
      code: 'export const welcome = "Hello"',
    },
    loading: { language: "ts", code: "", isLoading: true },
    streaming: {
      language: "ts",
      filename: "welcome.ts",
      code: 'export const welcome = "Drafting"',
      isStreaming: true,
    },
    empty: { language: "ts", code: "" },
    error: {
      language: "ts",
      filename: "partial.ts",
      code: "export const partial = true",
      error: {
        title: "Code generation interrupted",
        description: "The available source can still be copied or downloaded.",
      },
    },
    disabled: {
      language: "ts",
      filename: "approved.ts",
      code: "export const approved = true",
      isDisabled: true,
    },
  } satisfies Record<
    ContentCardPreviewState,
    React.ComponentProps<typeof CodeBlockCard>
  >

  return (
    <ComponentPreviewTabs
      component={
        <ContentCardPreviewFrame state={state} onStateChange={setState}>
          <CodeBlockCard key={state} {...propsByState[state]} />
        </ContentCardPreviewFrame>
      }
      source={<SourceBlock>{codeBlockSource}</SourceBlock>}
      sourcePreview={<SourceBlock preview>{codeBlockSource}</SourceBlock>}
      previewClassName="h-auto min-h-[30rem] p-6"
      align="center"
    />
  )
}
