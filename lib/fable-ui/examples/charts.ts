import type { ShowChartInput } from "@/components/fable-ui/charts/tool-definition"

export const lineChartExample: ShowChartInput = {
  title: "Monthly signups",
  description: "Static chart payload for the Charts component.",
  data: [
    { month: "Jan", direct: 120, referral: 84 },
    { month: "Feb", direct: 148, referral: 96 },
    { month: "Mar", direct: 172, referral: 118 },
  ],
  xKey: "month",
  series: [
    { key: "direct", label: "Direct" },
    { key: "referral", label: "Referral" },
  ],
  availableChartTypes: ["line", "bar"],
  defaultChartType: "line",
}

export const barChartExample: ShowChartInput = {
  title: "Revenue by region",
  data: [
    { region: "North", revenue: 4200 },
    { region: "South", revenue: 3700 },
    { region: "West", revenue: 3150 },
  ],
  xKey: "region",
  series: [{ key: "revenue", label: "Revenue" }],
  availableChartTypes: ["bar"],
  defaultChartType: "bar",
  format: { value: "currency", currency: "USD", compact: true },
}

export const pieChartExample: ShowChartInput = {
  title: "Ticket mix",
  data: [
    { type: "Bug", count: 42 },
    { type: "Question", count: 28 },
    { type: "Request", count: 18 },
  ],
  categoryKey: "type",
  valueKey: "count",
  availableChartTypes: ["pie"],
  defaultChartType: "pie",
}
