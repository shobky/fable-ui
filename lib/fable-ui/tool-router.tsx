import { FableToolPart, type ToolPartLike, type ToolRenderHandlers } from "@/lib/fable-ui/core"
import { toolRegistry } from "@/lib/fable-ui/tools"

export type ToolRenderPart = ToolPartLike

export function ToolPartRenderer({
  part,
  handlers,
}: {
  part: ToolRenderPart
  handlers?: ToolRenderHandlers
}) {
  return <FableToolPart part={part} registry={toolRegistry} handlers={handlers} />
}
