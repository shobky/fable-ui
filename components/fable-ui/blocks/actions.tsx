"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useFable, useFableState } from "../provider"
import { downloadText, safeLinkUrl } from "../safety"
import type { BlockOf, FableAction } from "../schema"
import { ICONS, SwapIcon, useCopy } from "./shared"

const variants = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
} as const

type HostState = { status: "idle" | "confirm" | "running" | "done" | "error"; note?: string }

export function ActionButton({
  action,
  stateKey,
  size = "default",
  className,
  fallbackStyle = "outline",
}: {
  action: FableAction
  stateKey: string
  size?: "sm" | "default" | "lg"
  className?: string
  fallbackStyle?: keyof typeof variants
}) {
  const { onReply, actions, readOnly } = useFable()
  const { copied, copy } = useCopy()
  const [done, setDone] = React.useState(false)
  const [host, setHost] = useFableState<HostState>(`${stateKey}:host`, { status: "idle" })
  const variant = variants[action.style ?? fallbackStyle]
  const Icon = action.icon ? ICONS[action.icon] : null
  const icon = Icon ? <Icon data-icon="inline-start" aria-hidden /> : null
  const press = "transition-[scale,background-color,color] active:scale-[0.96]"

  if (action.type === "link") {
    const href = safeLinkUrl(action.url)
    if (!href) return null
    return (
      <Button asChild variant={variant} size={size} className={cn(press, className)}>
        <a href={href} target="_blank" rel="noopener noreferrer nofollow">
          {icon}
          {action.label}
          {!Icon ? <ExternalLinkIcon data-icon="inline-end" className="opacity-60" aria-hidden /> : null}
        </a>
      </Button>
    )
  }

  if (action.type === "copy") {
    return (
      <Button variant={variant} size={size} className={cn(press, className)} onClick={() => void copy(action.text)}>
        <SwapIcon swapped={copied} from={Icon ?? CopyIcon} to={CheckIcon} />
        {copied ? "Copied" : action.label}
      </Button>
    )
  }

  if (action.type === "download") {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(press, className)}
        onClick={() => {
          downloadText(action.filename, action.content, action.mimeType)
          setDone(true)
          setTimeout(() => setDone(false), 1600)
        }}
      >
        <SwapIcon swapped={done} from={Icon ?? DownloadIcon} to={CheckIcon} />
        {done ? "Downloaded" : action.label}
      </Button>
    )
  }

  if (action.type === "reply") {
    const button = (
      <Button
        variant={variant}
        size={size}
        className={cn(press, className)}
        disabled={!onReply || readOnly}
        onClick={() => onReply?.(action.message)}
      >
        {icon}
        {action.label}
      </Button>
    )
    return button
  }

  const handler = actions?.[action.action]
  if (!handler) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            <Button variant={variant} size={size} disabled className={className}>
              {icon}
              {action.label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>This app has not enabled “{action.action}”.</TooltipContent>
      </Tooltip>
    )
  }

  const run = async () => {
    setHost({ status: "running" })
    try {
      const note = await handler.run(action.payload ?? {})
      setHost({ status: "done", note: typeof note === "string" ? note : "Done" })
    } catch (error) {
      setHost({ status: "error", note: error instanceof Error ? error.message : "Something went wrong" })
    }
  }

  if (host.status === "confirm") {
    return (
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm action">
        <span className="text-sm text-muted-foreground">{handler.confirm}</span>
        <Button size={size} className={press} onClick={() => void run()} autoFocus>
          Confirm
        </Button>
        <Button size={size} variant="ghost" onClick={() => setHost({ status: "idle" })}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant={variant}
        size={size}
        className={cn(press, className)}
        disabled={readOnly || host.status === "running" || host.status === "done"}
        onClick={() => (handler.confirm ? setHost({ status: "confirm" }) : void run())}
      >
        {host.status === "running" ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" aria-hidden />
        ) : host.status === "done" ? (
          <CheckIcon data-icon="inline-start" aria-hidden />
        ) : (
          icon
        )}
        {action.label}
      </Button>
      {host.note ? (
        <span
          role="status"
          className={cn("text-xs", host.status === "error" ? "text-destructive" : "text-muted-foreground")}
        >
          {host.note}
        </span>
      ) : null}
    </span>
  )
}

export function ActionsBlock({ block, stateKey }: { block: BlockOf<"actions">; stateKey: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {block.items.map((action, index) => (
        <ActionButton
          key={index}
          action={action}
          stateKey={`${stateKey}.${index}`}
          fallbackStyle={index === 0 && block.items.length > 1 ? "primary" : "outline"}
        />
      ))}
    </div>
  )
}
