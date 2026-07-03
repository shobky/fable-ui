import type { ShowDataBrowserInput } from "@/lib/fable-ui/tools/show-data-browser-tool"
import type { ShowTableInput } from "@/lib/fable-ui/tools/show-table-tool"

export const tableExample: ShowTableInput = {
  title: "Recent orders",
  columns: [
    { key: "order", label: "Order" },
    { key: "total", label: "Total" },
    { key: "status", label: "Status" },
  ],
  rows: [
    { id: "1", cells: { order: "#1001", total: "EGP 420", status: "Paid" } },
    { id: "2", cells: { order: "#1002", total: "EGP 215", status: "Pending" } },
  ],
}

export const dataBrowserExample: ShowDataBrowserInput = {
  ...tableExample,
  pageSize: 10,
}
