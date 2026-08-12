import { collectInput } from "@/lib/fable-ui/tools/collect-input-tool"
import { requestConfirmation } from "@/lib/fable-ui/tools/request-confirmation-tool"
import { showChart } from "@/lib/fable-ui/tools/show-chart-tool"
import { showDataBrowser } from "@/lib/fable-ui/tools/show-data-browser-tool"
import { showCodeBlock } from "@/lib/fable-ui/tools/show-code-block-tool"
import { showEmailComposer } from "@/lib/fable-ui/tools/show-email-composer-tool"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"
import { showNextActions } from "@/lib/fable-ui/tools/show-next-actions-tool"
import { showTable } from "@/lib/fable-ui/tools/show-table-tool"
import { showTextEditor } from "@/lib/fable-ui/tools/show-text-editor-tool"
import { getRenderedDataTool } from "@/lib/fable-ui/tools/get-rendered-data-tool"
import type { InferUITools, ToolSet, UIDataTypes, UIMessage } from "ai"

export const toolRegistry = {
  show_code_block: showCodeBlock,
  show_email_composer: showEmailComposer,
  show_metric: showMetric,
  show_next_actions: showNextActions,
  request_confirmation: requestConfirmation,
  collect_input: collectInput,
  show_data_browser: showDataBrowser,
  show_table: showTable,
  show_chart: showChart,
  show_text_editor: showTextEditor,
}

export const fableTools = {
  show_code_block: showCodeBlock.tool,
  show_email_composer: showEmailComposer.tool,
  show_metric: showMetric.tool,
  show_next_actions: showNextActions.tool,
  request_confirmation: requestConfirmation.tool,
  collect_input: collectInput.tool,
  show_data_browser: showDataBrowser.tool,
  show_table: showTable.tool,
  show_chart: showChart.tool,
  show_text_editor: showTextEditor.tool,
  get_rendered_data: getRenderedDataTool,
} satisfies ToolSet

export type FableUIMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<typeof fableTools>
>

export type FableToolName = keyof typeof toolRegistry

export function getToolNames() {
  return Object.keys(toolRegistry) as FableToolName[]
}
