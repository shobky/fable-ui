"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, RefreshCwIcon, WrenchIcon } from "lucide-react"
import { getToolName, isToolUIPart, type UIMessage } from "ai"

import { cn } from "@/lib/utils"

import { MemoProse } from "../blocks/prose"
import { IconAction, SwapIcon, useCopy } from "../blocks/shared"
import { specToMarkdown } from "../to-markdown"
import { FableToolPart, isFableToolPart } from "../tool-part"

function messageMarkdown(message: UIMessage) {
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text
      if (isFableToolPart(part)) return specToMarkdown((part as { input?: unknown }).input)
      return ""
    })
    .filter(Boolean)
    .join("\n\n")
}

export function FableMessage({
  message,
  streaming,
  onRegenerate,
  debug,
}: {
  message: UIMessage
  /** True while this message is the one being streamed. */
  streaming?: boolean
  onRegenerate?: () => void
  debug?: boolean
}) {
  const { copied, copy } = useCopy()

  if (message.role === "user") {
    const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
    return (
      <div className="flex justify-end ps-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
        <div className="max-w-[85%] rounded-[1.25rem] rounded-ee-md bg-muted px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-foreground [overflow-wrap:anywhere]">
          {text}
        </div>
      </div>
    )
  }

  const hasContent = message.parts.some((part) => (part.type === "text" && part.text.trim()) || isFableToolPart(part))

  return (
    <div className="group/message flex flex-col gap-5" data-role="assistant">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          if (!part.text.trim()) return null
          return <MemoProse key={index}>{part.text}</MemoProse>
        }
        if (isFableToolPart(part)) {
          return <FableToolPart key={part.toolCallId} part={part} active={Boolean(streaming)} debug={debug} />
        }
        if (isToolUIPart(part)) {
          const name = getToolName(part).replace(/[_-]+/g, " ")
          const state = (part as { state?: string }).state
          return (
            <p key={index} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <WrenchIcon className={cn("size-3", state?.startsWith("input") && "motion-safe:animate-pulse")} aria-hidden />
              {state?.startsWith("input") ? `Using ${name}…` : `Used ${name}`}
            </p>
          )
        }
        return null
      })}
      {!streaming && hasContent ? (
        <div className="-ms-1.5 -mt-3 flex gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100 [@media(hover:none)]:opacity-100">
          <IconAction label={copied ? "Copied" : "Copy response"} onClick={() => void copy(messageMarkdown(message))}>
            <SwapIcon swapped={copied} from={CopyIcon} to={CheckIcon} />
          </IconAction>
          {onRegenerate ? (
            <IconAction label="Regenerate" onClick={onRegenerate}>
              <RefreshCwIcon className="size-4" />
            </IconAction>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function Thinking() {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
            style={{ animationDelay: `${dot * 120}ms`, animationDuration: "900ms" }}
          />
        ))}
      </span>
      Thinking
    </p>
  )
}
