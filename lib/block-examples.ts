import type { ContentBlock, ContentBlockType, FableBlock } from "@/components/fable-ui/schema"

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`

/** One small, valid example per block, used by the docs previews and the tests. */
export const BLOCK_EXAMPLES: Record<ContentBlockType, ContentBlock> = {
  markdown: {
    type: "markdown",
    text: "**Short answer:** yes, but only for read-heavy pages.\n\nCaching the product list cuts p95 latency from 420 ms to 60 ms. Keep checkout uncached:\n\n- prices change per user\n- stock must be exact\n- the gain is small there",
  },
  heading: {
    type: "heading",
    eyebrow: "Weekly report",
    text: "Signups are up, activation is flat",
    description: "Traffic from the launch post converted well; onboarding is now the bottleneck.",
  },
  callout: { type: "callout", tone: "warning", title: "Before you migrate", text: "Back up the `users` table. The migration rewrites primary keys and **cannot be rolled back**." },
  metrics: {
    type: "metrics",
    items: [
      { label: "Monthly revenue", value: 128400, format: "currency", currency: "USD", delta: 12.4, deltaLabel: "vs last month" },
      { label: "Active users", value: 18240, format: "compact", delta: 4.1 },
      { label: "Churn", value: 1.8, format: "percent", delta: -0.3, invertDelta: true },
    ],
  },
  table: {
    type: "table",
    title: "Open invoices",
    sortable: true,
    columns: [
      { key: "client", label: "Client" },
      { key: "amount", label: "Amount", type: "currency", currency: "EUR" },
      { key: "due", label: "Due", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    rows: [
      { client: "Northwind", amount: 4200, due: "2026-11-12", status: "Overdue" },
      { client: "Kite Studio", amount: 1850, due: "2026-11-28", status: "Pending" },
      { client: "Harbor Labs", amount: 9600, due: "2026-12-04", status: "Paid" },
    ],
    footer: { client: "Total", amount: 15650 },
  },
  chart: {
    type: "chart",
    kind: "bar",
    title: "Weekly active users",
    xKey: "week",
    series: [
      { key: "web", label: "Web" },
      { key: "mobile", label: "Mobile" },
    ],
    data: [
      { week: "W1", web: 4200, mobile: 2400 },
      { week: "W2", web: 4600, mobile: 2900 },
      { week: "W3", web: 4400, mobile: 3300 },
      { week: "W4", web: 5100, mobile: 3800 },
    ],
  },
  details: {
    type: "details",
    title: "Booking",
    items: [
      { label: "Guest", value: "Sam Rivera" },
      { label: "Check-in", value: "Fri 14 Nov, 15:00" },
      { label: "Room", value: "Deluxe double, city view" },
      { label: "Status", value: "Confirmed", tone: "success" },
    ],
  },
  list: {
    type: "list",
    style: "steps",
    items: [
      { title: "Create the project", status: "done" },
      { title: "Install Fable UI", status: "current", description: "One shadcn command." },
      { title: "Connect your model", status: "upcoming" },
    ],
  },
  checklist: {
    type: "checklist",
    title: "Launch checklist",
    items: [{ label: "Write release notes", checked: true }, { label: "Record the demo video" }, { label: "Schedule the announcement" }],
  },
  code: { type: "code", language: "bash", code: "pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json" },
  quote: { type: "quote", text: "Make the common case fast and the rare case possible.", author: "Butler Lampson" },
  image: {
    type: "image",
    aspect: "wide",
    image: { src: photo("1476514525535-07fb3b4ae5f1"), alt: "A wooden boat on a turquoise mountain lake", caption: "Lake Braies at 7 am", credit: "Unsplash" },
  },
  gallery: {
    type: "gallery",
    layout: "featured",
    images: [
      { src: photo("1618221195710-dd6b41faaea6"), alt: "Long living room with a low sofa" },
      { src: photo("1586023492125-27b2c045efd7"), alt: "Living room with a yellow armchair" },
      { src: photo("1567016432779-094069958ea5"), alt: "Orange sofa with a pink cushion" },
    ],
  },
  cards: {
    type: "cards",
    columns: 2,
    items: [
      {
        title: "Starter",
        badge: "Popular",
        meta: "$12 / month",
        description: "For solo builders. One project, community support.",
        action: { type: "reply", label: "Choose Starter", message: "I'd like the Starter plan" },
      },
      {
        title: "Team",
        meta: "$49 / month",
        description: "Five seats, shared projects and priority support.",
        action: { type: "reply", label: "Choose Team", message: "I'd like the Team plan" },
      },
    ],
  },
  hero: {
    type: "hero",
    variant: "editorial",
    eyebrow: "Field guide",
    title: "Ship the boring version first",
    description: "A short guide to launching small, learning fast and earning the right to add complexity.",
    stats: [
      { label: "Read time", value: "4 min" },
      { label: "Checklists", value: "3" },
    ],
  },
  article: {
    type: "article",
    title: "Why your onboarding stalls on day two",
    byline: "Growth team",
    readingTime: "3 min read",
    sections: [
      { heading: "The pattern", body: "Most users finish setup, then never come back. The drop happens **before** they see value." },
      { heading: "The fix", body: "Move the first real result into setup. Make day two a reminder of something they already got." },
    ],
  },
  form: {
    type: "form",
    title: "Project details",
    submitLabel: "Get my estimate",
    fields: [
      { name: "name", label: "Project name", type: "text", required: true },
      { name: "budget", label: "Budget", type: "select", options: ["Under $5k", "$5k – $20k", "$20k +"] },
      { name: "timeline", label: "Timeline", type: "radio", options: ["ASAP", "This quarter", "Flexible"] },
    ],
  },
  template: {
    type: "template",
    title: "Follow-up after a call",
    variables: [
      { name: "name", label: "Their name" },
      { name: "topic", label: "What you discussed" },
    ],
    body: "Hi {{name}},\n\nThanks for the time today. As promised, here are my notes on {{topic}}.\n\nTalk soon,\nAlex",
  },
  email: {
    type: "email",
    to: ["jordan@example.com"],
    subject: "Quick question about the Q4 roadmap",
    body: "Hi Jordan,\n\nCould we move the roadmap review to Thursday? I want to include the usage numbers that land Wednesday.\n\nThanks,\nAlex",
  },
  actions: {
    type: "actions",
    items: [
      { type: "reply", label: "Explain the trade-offs", message: "Explain the trade-offs in more detail", icon: "sparkles" },
      { type: "copy", label: "Copy summary", text: "Cache read-heavy pages; keep checkout uncached." },
      { type: "link", label: "Open docs", url: "https://nextjs.org/docs" },
    ],
  },
  file: {
    type: "file",
    filename: "contacts.csv",
    description: "3 contacts",
    mimeType: "text/csv",
    content: "name,email\nSam Rivera,sam@example.com\nJordan Lee,jordan@example.com\nAlex Kim,alex@example.com",
  },
  sources: {
    type: "sources",
    items: [
      { title: "Route Handlers", url: "https://nextjs.org/docs/app/getting-started/route-handlers", publisher: "Next.js" },
      { title: "Chatbot tool usage", url: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage", publisher: "AI SDK" },
    ],
  },
  faq: {
    type: "faq",
    items: [
      { question: "Can I use my own components?", answer: "Yes. Every block is source code in your repo. Edit it or add new blocks to the catalog." },
      { question: "Does the model run code?", answer: "No. The model writes JSON; Fable validates it and renders your components." },
    ],
  },
  divider: { type: "divider", label: "Appendix" },
}

export const LAYOUT_EXAMPLES: Record<"columns" | "section" | "tabs", FableBlock> = {
  columns: {
    type: "columns",
    ratio: "wide-left",
    columns: [{ blocks: [BLOCK_EXAMPLES.chart] }, { blocks: [BLOCK_EXAMPLES.details] }],
  },
  section: {
    type: "section",
    variant: "muted",
    title: "Recommendation",
    blocks: [BLOCK_EXAMPLES.markdown, BLOCK_EXAMPLES.actions],
  },
  tabs: {
    type: "tabs",
    tabs: [
      { label: "Monthly", blocks: [BLOCK_EXAMPLES.metrics] },
      { label: "Details", blocks: [BLOCK_EXAMPLES.table] },
    ],
  },
}
