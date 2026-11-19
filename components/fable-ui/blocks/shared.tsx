"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HeartIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  Share2Icon,
  SparklesIcon,
  StarIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import type { FABLE_ICONS } from "../schema"

export const ICONS: Record<(typeof FABLE_ICONS)[number], LucideIcon> = {
  "arrow-right": ArrowRightIcon,
  calendar: CalendarIcon,
  check: CheckIcon,
  copy: CopyIcon,
  download: DownloadIcon,
  edit: PencilIcon,
  "external-link": ExternalLinkIcon,
  file: FileTextIcon,
  heart: HeartIcon,
  info: InfoIcon,
  mail: MailIcon,
  "map-pin": MapPinIcon,
  phone: PhoneIcon,
  play: PlayIcon,
  plus: PlusIcon,
  refresh: RefreshCwIcon,
  search: SearchIcon,
  send: SendIcon,
  share: Share2Icon,
  sparkles: SparklesIcon,
  star: StarIcon,
}

/**
 * The one surface every framed block uses. A hairline ring plus a soft
 * shadow reads as depth on any background, in any preset.
 */
export const surface =
  "rounded-xl bg-card text-card-foreground ring-1 ring-foreground/[0.07] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_-8px_rgb(0_0_0/0.08)] dark:ring-foreground/10 dark:shadow-none"

/** Image edge: pure black/white at 10%, never a tinted neutral. */
export const imageOutline =
  "outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"

export const enter =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:ease-out"

export function BlockHeader({
  title,
  description,
  actions,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  if (!title && !description && !actions) return null
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-0.5">
        {title ? (
          <h3 className="font-heading text-[0.9375rem] leading-6 font-semibold tracking-tight text-balance text-foreground">
            {title}
          </h3>
        ) : null}
        {description ? (
          <p className="text-sm leading-5 text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="-me-1 -mt-0.5 flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </div>
  )
}

export function useCopy(timeout = 1600) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), timeout)
        return true
      } catch {
        return false
      }
    },
    [timeout]
  )
  return { copied, copy }
}

/** Two icons stay mounted and cross-fade, so the swap has an enter and an exit. */
export function SwapIcon({ swapped, from, to }: { swapped: boolean; from: LucideIcon; to: LucideIcon }) {
  const From = from
  const To = to
  const transition = "transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
  return (
    <span className="relative inline-grid size-4 place-items-center" aria-hidden>
      <From className={cn("col-start-1 row-start-1 size-4", transition, swapped && "scale-25 opacity-0 blur-[4px]")} />
      <To className={cn("col-start-1 row-start-1 size-4", transition, !swapped && "scale-25 opacity-0 blur-[4px]")} />
    </span>
  )
}

export function IconAction({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="text-muted-foreground hover:text-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function CopyAction({ text, label = "Copy" }: { text: string; label?: string }) {
  const { copied, copy } = useCopy()
  return (
    <IconAction label={copied ? "Copied" : label} onClick={() => void copy(text)}>
      <SwapIcon swapped={copied} from={CopyIcon} to={CheckIcon} />
    </IconAction>
  )
}

/** Polite live region for confirmations that have no visible change. */
export function useAnnounce() {
  const [message, setMessage] = React.useState("")
  const node = (
    <span className="sr-only" role="status" aria-live="polite">
      {message}
    </span>
  )
  return { announce: setMessage, node }
}
