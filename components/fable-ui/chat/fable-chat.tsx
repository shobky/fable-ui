"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { AlertCircleIcon, ArrowDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { FableProvider, type FableHostAction } from "../provider"
import type { FableImagePolicy } from "../safety"
import { FableComposer } from "./fable-composer"
import { FableMessage, Thinking } from "./fable-message"

export interface FableChatController {
  send: (text: string) => void
  clear: () => void
}

export interface FableChatProps {
  /** Route that streams AI SDK UI messages. */
  api?: string
  /** Extra JSON sent with every request, e.g. a model id. */
  body?: Record<string, unknown> | (() => Record<string, unknown>)
  title?: React.ReactNode
  description?: React.ReactNode
  suggestions?: { label: string; prompt: string }[]
  placeholder?: string
  images?: FableImagePolicy
  actions?: Record<string, FableHostAction>
  composerFooter?: React.ReactNode
  /** Show skipped-block diagnostics. */
  debug?: boolean
  /** Prevent requests while the host needs a key or valid model selection. */
  disabled?: boolean
  onMessagesChange?: (messages: UIMessage[]) => void
  /** Lets a parent send prompts or clear the thread. */
  controllerRef?: React.Ref<FableChatController>
  className?: string
}

const resolveBody = (body: FableChatProps["body"]) =>
  typeof body === "function" ? body() : (body ?? {})

/** Keeps the thread pinned to the newest message unless the reader scrolls up. */
function useStickToBottom(dependency: unknown) {
  const ref = React.useRef<HTMLDivElement>(null)
  const pinned = React.useRef(true)
  const [away, setAway] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight
      pinned.current = distance < 80
      setAway(distance > 240)
    }
    node.addEventListener("scroll", onScroll, { passive: true })
    const observer = new ResizeObserver(() => {
      if (pinned.current) node.scrollTop = node.scrollHeight
    })
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    observer.observe(node)
    return () => {
      node.removeEventListener("scroll", onScroll)
      observer.disconnect()
    }
  }, [])

  React.useLayoutEffect(() => {
    const node = ref.current
    if (node && pinned.current) node.scrollTop = node.scrollHeight
  }, [dependency])

  const toBottom = React.useCallback(() => {
    pinned.current = true
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" })
  }, [])
  const pin = React.useCallback(() => {
    pinned.current = true
  }, [])

  return [ref, away, toBottom, pin] as const
}

export function FableChat({
  api = "/api/fable-chat",
  body,
  title = "What can I help with?",
  description,
  suggestions = [],
  placeholder,
  images,
  actions,
  composerFooter,
  debug,
  disabled = false,
  onMessagesChange,
  controllerRef,
  className,
}: FableChatProps) {
  const bodyRef = React.useRef(body)
  React.useLayoutEffect(() => {
    bodyRef.current = body
  })
  const [transport] = React.useState(() => new DefaultChatTransport({ api }))
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    regenerate,
    clearError,
  } = useChat({ transport, experimental_throttle: 50 })
  const busy = status === "submitted" || status === "streaming"
  const [scrollRef, away, toBottom, pin] = useStickToBottom(messages)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const composerRef = React.useRef<HTMLDivElement>(null)

  // Keep the fade and scroll clearance aligned as the textarea grows, and
  // account for native scrollbars so messages and composer share one column.
  React.useLayoutEffect(() => {
    const frame = frameRef.current
    const viewport = scrollRef.current
    const composer = composerRef.current
    if (!frame || !viewport || !composer) return
    const measure = () => {
      frame.style.setProperty(
        "--chat-composer-height",
        `${composer.offsetHeight}px`
      )
      frame.style.setProperty(
        "--chat-scrollbar-width",
        `${viewport.offsetWidth - viewport.clientWidth}px`
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(composer)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [scrollRef])

  React.useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  // Always calls the latest chat helpers, but keeps one identity so blocks don't re-render on every chunk.
  const latest = React.useRef({
    disabled,
    sendMessage,
    clearError,
    stop,
    setMessages,
    pin,
  })
  React.useLayoutEffect(() => {
    latest.current = {
      disabled,
      sendMessage,
      clearError,
      stop,
      setMessages,
      pin,
    }
  })
  const send = React.useCallback((text: string) => {
    if (!text.trim() || latest.current.disabled) return
    latest.current.pin()
    latest.current.clearError()
    void latest.current.sendMessage(
      { text },
      { body: resolveBody(bodyRef.current) }
    )
  }, [])

  React.useImperativeHandle(
    controllerRef,
    () => ({
      send,
      clear: () => {
        void latest.current.stop()
        latest.current.setMessages([])
        latest.current.clearError()
      },
    }),
    [send]
  )

  const last = messages[messages.length - 1]
  const waiting =
    status === "submitted" ||
    (status === "streaming" &&
      last?.role === "assistant" &&
      last.parts.every((part) => part.type === "step-start"))

  return (
    <FableProvider
      onReply={send}
      actions={actions}
      images={images}
      readOnly={busy || disabled}
    >
      <div
        ref={frameRef}
        className={cn(
          "relative isolate min-h-0 flex-1 overflow-hidden",
          className
        )}
      >
        <div
          ref={scrollRef}
          data-slot="chat-viewport"
          className="absolute inset-0 overflow-y-auto overscroll-contain"
          style={{
            scrollPaddingBottom:
              "calc(var(--chat-composer-height, 7rem) + 1.5rem)",
            maskImage:
              "linear-gradient(to bottom, black calc(100% - var(--chat-composer-height, 7rem)), transparent calc(100% - var(--chat-composer-height, 7rem) + 4rem))",
          }}
        >
          <div
            data-slot="chat-messages"
            className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 sm:px-6"
            style={{
              paddingBottom: "calc(var(--chat-composer-height, 7rem) + 1.5rem)",
            }}
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
                <div className="space-y-2">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mx-auto max-w-md text-sm text-pretty text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                {suggestions.length ? (
                  <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        disabled={disabled}
                        onClick={() => send(suggestion.prompt)}
                        className="rounded-xl bg-card px-4 py-3 text-start text-sm ring-1 ring-foreground/[0.08] transition-[background-color,box-shadow,scale] outline-none hover:bg-muted/50 hover:ring-foreground/15 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                      >
                        <span className="font-medium">{suggestion.label}</span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                          {suggestion.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              messages.map((message, index) => (
                <FableMessage
                  key={message.id}
                  message={message}
                  debug={debug}
                  streaming={busy && index === messages.length - 1}
                  onRegenerate={
                    !busy && !disabled && index === messages.length - 1
                      ? () =>
                          void regenerate({
                            body: resolveBody(bodyRef.current),
                          })
                      : undefined
                  }
                />
              ))
            )}
            {waiting ? <Thinking /> : null}
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl bg-destructive/[0.06] px-4 py-3 text-sm ring-1 ring-destructive/20"
              >
                <AlertCircleIcon
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">The response failed.</p>
                  <p className="text-muted-foreground">
                    Check the server logs or try again.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    void regenerate({ body: resolveBody(bodyRef.current) })
                  }
                >
                  Try again
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={composerRef}
          data-slot="chat-composer-overlay"
          className="pointer-events-none absolute inset-s-0 bottom-0 z-10"
          style={{ insetInlineEnd: "var(--chat-scrollbar-width, 0px)" }}
        >
          <div className="relative mx-auto w-full max-w-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {away ? (
              <Button
                size="icon-sm"
                variant="outline"
                onClick={toBottom}
                aria-label="Scroll to latest"
                className="pointer-events-auto absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-background shadow-sm"
              >
                <ArrowDownIcon />
              </Button>
            ) : null}
            <FableComposer
              className="pointer-events-auto"
              onSend={send}
              onStop={stop}
              busy={busy}
              disabled={disabled}
              placeholder={placeholder}
              footer={composerFooter}
              autoFocus
            />
          </div>
        </div>
      </div>
    </FableProvider>
  )
}
