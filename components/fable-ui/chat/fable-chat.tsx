"use client"

import { useMemo } from "react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useChat } from "@ai-sdk/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FableMessage } from "@/components/fable-ui/chat/fable-message"

export function FableChat() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/fable-chat" }), [])
  const { messages, sendMessage, status } = useChat<UIMessage>({
    transport,
    messages: [],
  })
  const isBusy = status === "submitted" || status === "streaming"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const text = String(formData.get("message") ?? "").trim()

    if (!text) {
      return
    }

    event.currentTarget.reset()
    await sendMessage({ text }, { body: { mode: "mock" } })
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-1 flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border bg-muted/30 p-8 text-center text-muted-foreground">
            Ask for a metric. Mock mode works without provider keys.
          </div>
        ) : (
          messages.map((message) => <FableMessage key={message.id} message={message} />)
        )}
      </div>
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input name="message" placeholder="Show today's revenue" disabled={isBusy} />
        <Button type="submit" disabled={isBusy}>
          Send
        </Button>
      </form>
    </section>
  )
}
