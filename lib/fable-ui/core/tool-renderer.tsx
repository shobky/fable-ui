import * as React from "react"
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
    <div
      role="alert"
      className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground"
    >
      Unknown Fable tool part: <code>{name}</code>
    </div>
  )
}

function renderComponent(
  Component: FableToolRegistry[string]["renderer"]["Component"],
  props: Record<string, unknown>
) {
  return (
    <React.Suspense fallback={null}>
      <Component {...props} />
    </React.Suspense>
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

  if (fableState === "loading") {
    return renderComponent(def.renderer.Component, def.renderer.loadingProps)
  }

  if (part.state === "input-streaming") {
    if (!def.renderer.streamingProps) {
      return renderComponent(def.renderer.Component, def.renderer.loadingProps)
    }

    try {
      return renderComponent(
        def.renderer.Component,
        def.renderer.streamingProps(part.input)
      )
    } catch (error) {
      const description =
        error instanceof ToolPayloadError
          ? error.message
          : "Unexpected error rendering component."

      return renderComponent(
        def.renderer.Component,
        def.renderer.errorProps(description, part)
      )
    }
  }

  if (part.state === "output-error" || fableState === "error") {
    return renderComponent(
      def.renderer.Component,
      def.renderer.errorProps(
        part.errorText || "The tool result could not be rendered.",
        part
      )
    )
  }

  if (fableState === "empty") {
    return renderComponent(def.renderer.Component, def.renderer.emptyProps)
  }

  const parsed = def.schema.safeParse(part.output ?? part.input)

  if (!parsed.success) {
    return renderComponent(
      def.renderer.Component,
      def.renderer.errorProps(
        "The tool result did not match the expected data contract.",
        part
      )
    )
  }

  try {
    return renderComponent(def.renderer.Component, {
      ...def.renderer.toProps(parsed.data, handlers),
      isDisabled,
    })
  } catch (error) {
    const description =
      error instanceof ToolPayloadError
        ? error.message
        : "Unexpected error rendering component."

    return renderComponent(
      def.renderer.Component,
      def.renderer.errorProps(description, part)
    )
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
