import type { ComponentType, LazyExoticComponent } from "react"
import type { Tool } from "ai"
import type { z } from "zod"

export class ToolPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ToolPayloadError"
  }
}

export type ToolRenderHandlers = {
  onSuggestedAction?: (action: { label: string; prompt: string; description?: string }) => void
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
  | ComponentType<TProps>
  | LazyExoticComponent<ComponentType<TProps>>

export interface FableComponent<TSchema extends z.ZodType = z.ZodType, TProps extends object = Record<string, unknown>> {
  name: string
  schema: TSchema
  tool: Tool
  renderer: {
    Component: FableRenderableComponent<TProps>
    loadingProps: TProps
    emptyProps: TProps
    errorProps: (description: string) => TProps
    toProps: (data: z.infer<TSchema>, handlers: ToolRenderHandlers) => TProps
  }
}

export type FableToolRegistry = Record<string, FableComponent<z.ZodType, any>>

export function defineFableComponent<TSchema extends z.ZodType, TProps extends object>(
  def: FableComponent<TSchema, TProps>,
) {
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
