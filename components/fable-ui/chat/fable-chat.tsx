"use client"

import { useCallback, useMemo, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { LoaderCircle, SendHorizontal } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { FableMessage } from "@/components/fable-ui/chat/fable-message"

function describeClientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")

  if (/rate limit|quota|429/i.test(message)) {
    return "The AI provider is rate limited right now. Wait a moment and try again."
  }

  if (/api key|unauthorized|authentication|401|403/i.test(message)) {
    return "The AI provider rejected the request. Check `FABLE_AI_API_KEY` and model access."
  }

  if (/network|fetch|timeout|econn|enotfound/i.test(message)) {
    return "The chat request could not reach the server. Check your connection and try again."
  }

  return "The chat request failed. Please try again."
}

function ThinkingRow() {
  return (
    <Marker role="status" className="mx-auto w-full max-w-3xl px-4">
      <MarkerIcon>
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      </MarkerIcon>
      <MarkerContent>
        <span className="inline-flex animate-pulse bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent">
          Thinking...
        </span>
      </MarkerContent>
    </Marker>
  )
}

export function FableChat() {
  const [input, setInput] = useState("")
  const [clientError, setClientError] = useState<string | null>(null)
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/fable-chat" }), [])
  const { messages, sendMessage, status, error, clearError } = useChat<UIMessage>({
    transport,
    messages: [],
    experimental_throttle: 80,
    onError: (nextError) => {
      setClientError(describeClientError(nextError))
    },
  })
  const isBusy = status === "submitted" || status === "streaming"
  const visibleError = clientError || (error ? describeClientError(error) : null)

  const sendText = useCallback(
    async (text: string) => {
      const prompt = text.trim()

      if (!prompt || isBusy) {
        return false
      }

      setClientError(null)
      clearError()

      try {
        await sendMessage({ text: prompt })
        return true
      } catch (nextError) {
        setClientError(describeClientError(nextError))
        return false
      }
    },
    [clearError, isBusy, sendMessage],
  )

  async function submitPrompt() {
    const text = input.trim()

    if (!text || isBusy) {
      return
    }

    setInput("")

    const wasSent = await sendText(text)

    if (!wasSent) {
      setInput(text)
    }
  }

  const handleSuggestedAction = useCallback(
    (action: { prompt: string }) => {
      void sendText(action.prompt)
    },
    [sendText],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitPrompt()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submitPrompt()
    }
  }

  return (
    <MessageScrollerProvider
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
    >
      <section className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <header className="border-b px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">Fable Chat</h1>
              <p className="truncate text-xs text-muted-foreground">
                Live AI responses with Fable UI tool rendering
              </p>
            </div>
          </div>
        </header>

        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-4 px-4 py-6 sm:px-6">
              {messages.length === 0 && !isBusy ? (
                <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
                  <p className="max-w-md text-balance text-sm leading-6">
                    Ask a question. If a Fable UI surface is useful, the model can render it inline.
                  </p>
                </div>
              ) : null}

              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <FableMessage
                    message={message}
                    onSuggestedAction={isBusy ? undefined : handleSuggestedAction}
                  />
                </MessageScrollerItem>
              ))}

              {isBusy ? (
                <MessageScrollerItem messageId="assistant-thinking">
                  <ThinkingRow />
                </MessageScrollerItem>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>

          <MessageScrollerButton />
        </MessageScroller>

        <form onSubmit={handleSubmit} className="border-t bg-background/95 px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {visibleError ? (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {visibleError}
              </div>
            ) : null}

            <InputGroup className="min-h-24 rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
              <InputGroupTextarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Fable Chat..."
                aria-label="Message"
                rows={1}
                disabled={isBusy}
                className="min-h-12 px-3 text-base"
              />
              <InputGroupAddon align="block-end" className="justify-end pt-2">
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  disabled={isBusy || input.trim().length === 0}
                  aria-label="Send message"
                >
                  {isBusy ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <SendHorizontal aria-hidden="true" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </form>
      </section>
    </MessageScrollerProvider>
  )
}
