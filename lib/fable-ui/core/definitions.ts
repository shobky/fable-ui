import type { ComponentType, LazyExoticComponent } from "react"
import type { Tool } from "ai"
import type { z } from "zod"
import { fableRegistry, type DataSourceRegistry } from "@/lib/fable-ui/core"

export class ToolPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ToolPayloadError"
  }
}

export type ToolRenderHandlers = {
  onSuggestedAction?: (action: {
    label: string
    prompt: string
    description?: string
  }) => void
  onConfirm?: (confirmation: { id: string; label: string }) => void
  onCancel?: (confirmation: { id: string; label: string }) => void
  onFormSubmit?: (values: Record<string, string | number | boolean>) => void
  onRowAction?: (action: { id: string; rowId: string }) => void
}

export type ToolPartLike = {
  type: string
  toolName?: string
  toolCallId?: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
  toolMetadata?: {
    fableState?: "loading" | "empty" | "error" | "disabled"
  }
}

export type FableRenderableComponent<TProps extends object> =
  ComponentType<TProps> | LazyExoticComponent<ComponentType<TProps>>

export interface FableComponent<
  TSchema extends z.ZodType = z.ZodType,
  TProps extends object = Record<string, unknown>,
  TTool extends Tool = Tool,
> {
  name: string
  schema: TSchema
  tool: TTool
  renderer: {
    Component: FableRenderableComponent<TProps>
    loadingProps: TProps
    streamingProps?: (input: unknown) => TProps
    emptyProps: TProps
    errorProps: (description: string, part?: ToolPartLike) => TProps
    toProps: (data: z.infer<TSchema>, handlers: ToolRenderHandlers) => TProps
  }
}

export type FableToolRegistry = Record<
  string,
  // Registry entries intentionally have heterogeneous component props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FableComponent<z.ZodType, any, Tool>
>

export function defineFableComponent<
  TSchema extends z.ZodType,
  TProps extends object,
  TTool extends Tool,
>(def: FableComponent<TSchema, TProps, TTool>) {
  return def
}

export function getToolNameFromPart(part: ToolPartLike) {
  if (part.toolName) {
    return part.toolName
  }

  if (part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length)
  }

  return null
}

// move to utils or resources related files.
export function describeAvailableResources(
  registry: DataSourceRegistry = fableRegistry
) {
  return JSON.stringify(registry.getAgentResourceManifest(), null, 2)
}
