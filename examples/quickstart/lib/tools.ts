import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"
import { showNextActions } from "@/lib/fable-ui/tools/show-next-actions-tool"

export const fableToolRegistry = {
  show_metric: showMetric,
  show_next_actions: showNextActions,
}

export const fableTools = Object.fromEntries(
  Object.entries(fableToolRegistry).map(([name, def]) => [name, def.tool]),
)
