import { collectInput } from "@/lib/fable-ui/tools/collect-input-tool"
import { requestConfirmation } from "@/lib/fable-ui/tools/request-confirmation-tool"
import { showChart } from "@/lib/fable-ui/tools/show-chart-tool"
import { showDataBrowser } from "@/lib/fable-ui/tools/show-data-browser-tool"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"
import { showNextActions } from "@/lib/fable-ui/tools/show-next-actions-tool"
import { showTable } from "@/lib/fable-ui/tools/show-table-tool"

export const toolRegistry = {
  show_metric: showMetric,
  show_next_actions: showNextActions,
  request_confirmation: requestConfirmation,
  collect_input: collectInput,
  show_data_browser: showDataBrowser,
  show_table: showTable,
  show_chart: showChart,
}

export type FableToolName = keyof typeof toolRegistry

export function getToolNames() {
  return Object.keys(toolRegistry) as FableToolName[]
}
