"use client"

import type { ToolPartLike, ToolRenderHandlers } from "@/lib/fable-ui/core/definitions"
import { FableToolPart as RenderFableToolPart } from "@/lib/fable-ui/core/tool-renderer"
import { fableToolRegistry } from "@/lib/fable-ui/quickstart/tools"

export function FableToolPart({
  part,
  onSuggestedAction,
}: {
  part: ToolPartLike
  onSuggestedAction?: ToolRenderHandlers["onSuggestedAction"]
}) {
  return (
    <RenderFableToolPart
      part={part}
      registry={fableToolRegistry}
      handlers={{ onSuggestedAction }}
    />
  )
}
