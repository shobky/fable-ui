"use client"

import type { ToolPartLike } from "@/lib/fable-ui/core/definitions"
import { FableToolPart as RenderFableToolPart } from "@/lib/fable-ui/core/tool-renderer"
import { fableToolRegistry } from "@/lib/fable-ui/demo/tools"

export function FableToolPart({ part }: { part: ToolPartLike }) {
  return (
    <RenderFableToolPart
      part={part}
      registry={fableToolRegistry}
      handlers={{
        onSuggestedAction: (action) => {
          console.info("Suggested Fable action selected:", action)
        },
      }}
    />
  )
}
