"use client"

import * as React from "react"
import { ArrowUpIcon, SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FableComposer({
  onSend,
  onStop,
  busy,
  placeholder = "Ask anything",
  autoFocus,
  className,
  footer,
}: {
  onSend: (text: string) => void
  onStop?: () => void
  busy?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
  footer?: React.ReactNode
}) {
  const [value, setValue] = React.useState("")
  const inputId = React.useId()
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !busy

  const send = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue("")
    ref.current?.focus()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      className={cn(
        "rounded-[1.5rem] bg-card p-2 ring-1 ring-foreground/10 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] transition-shadow focus-within:ring-foreground/20 dark:shadow-none",
        className
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Message
      </label>
      <textarea
        id={inputId}
        ref={ref}
        value={value}
        rows={1}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            send()
          }
        }}
        className="field-sizing-content block max-h-48 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 text-[0.9375rem] leading-6 outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 ps-2">
        <div className="min-w-0 text-xs text-muted-foreground">{footer}</div>
        {busy && onStop ? (
          <Button type="button" size="icon" onClick={onStop} aria-label="Stop" className="rounded-full">
            <SquareIcon className="size-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send"
            className="rounded-full transition-[scale,opacity] active:scale-[0.96]"
          >
            <ArrowUpIcon />
          </Button>
        )}
      </div>
    </form>
  )
}
