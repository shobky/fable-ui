import type { ReactNode } from "react"

import {
  getToolNameFromPart,
  ToolPayloadError,
  type FableToolRegistry,
  type ToolPartLike,
  type ToolRenderHandlers,
} from "./definitions"

function UnknownToolPart({ name }: { name: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
      Unknown Fable tool part: <code>{name}</code>
    </div>
  )
}

export function renderFableToolPart({
  part,
  registry,
  handlers = {},
}: {
  part: ToolPartLike
  registry: FableToolRegistry
  handlers?: ToolRenderHandlers
}): ReactNode {
  const toolName = getToolNameFromPart(part)
  const def = toolName ? registry[toolName] : undefined

  if (!def) {
    return <UnknownToolPart name={toolName ?? part.type} />
  }

  const fableState = part.toolMetadata?.fableState
  const isDisabled = fableState === "disabled"

  if (part.state === "input-streaming" || fableState === "loading") {
    return <def.renderer.Component {...def.renderer.loadingProps} />
  }

  if (part.state === "output-error" || fableState === "error") {
    return (
      <def.renderer.Component
        {...def.renderer.errorProps(part.errorText || "The tool result could not be rendered.")}
      />
    )
  }

  if (fableState === "empty") {
    return <def.renderer.Component {...def.renderer.emptyProps} />
  }

  const parsed = def.schema.safeParse(part.output ?? part.input)

  if (!parsed.success) {
    return (
      <def.renderer.Component
        {...def.renderer.errorProps("The tool result did not match the expected data contract.")}
      />
    )
  }

  try {
    return (
      <def.renderer.Component
        {...def.renderer.toProps(parsed.data, handlers)}
        {...({ isDisabled } as object)}
      />
    )
  } catch (error) {
    const description =
      error instanceof ToolPayloadError ? error.message : "Unexpected error rendering component."

    return <def.renderer.Component {...def.renderer.errorProps(description)} />
  }
}

export function FableToolPart({
  part,
  registry,
  handlers,
}: {
  part: ToolPartLike
  registry: FableToolRegistry
  handlers?: ToolRenderHandlers
}) {
  return <>{renderFableToolPart({ part, registry, handlers })}</>
}
