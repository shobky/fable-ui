"use client"

import { AlertCircleIcon } from "lucide-react"

import { FableRenderer } from "./renderer"
import { FABLE_TOOL_NAME } from "./protocol"

/** The subset of an AI SDK tool UI part that Fable reads. */
export interface FableToolPartLike {
  type: string
  toolCallId: string
  state: string
  input?: unknown
  errorText?: string
}

export function isFableToolPart(part: { type: string }, toolName = FABLE_TOOL_NAME): part is FableToolPartLike {
  return part.type === `tool-${toolName}`
}

/**
 * Drop-in renderer for `tool-render_ui` parts from `useChat`:
 *
 *   message.parts.map((part) => isFableToolPart(part) ? <FableToolPart part={part} active={isActiveResponse} /> : …)
 */
export function FableToolPart({
  part,
  active = true,
  debug,
  className,
}: {
  part: FableToolPartLike
  /**
   * Whether the response is still streaming. Pass false once the chat is
   * idle: a part left in "input-streaming" (stopped, cut off, network drop)
   * then renders its finished blocks and drops the half-written one.
   */
  active?: boolean
  debug?: boolean
  className?: string
}) {
  if (part.state === "output-error" && !part.input) {
    return (
      <p role="alert" className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircleIcon className="size-4" aria-hidden />
        This answer could not be displayed.
      </p>
    )
  }
  const interrupted = part.state === "input-streaming" && !active
  return (
    <>
      <FableRenderer
        id={part.toolCallId}
        spec={part.input}
        streaming={part.state === "input-streaming" && active}
        debug={debug}
        className={className}
      />
      {interrupted ? (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircleIcon className="size-3.5" aria-hidden />
          This answer stopped before it finished.
        </p>
      ) : null}
    </>
  )
}
