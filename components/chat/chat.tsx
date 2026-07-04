"use client"

import { ProviderId, ProviderReadiness } from "@/lib/ai/provider-config"
import { DefaultChatTransport, UIMessage } from "ai"
import { useCallback, useMemo, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { describeChatError } from "@/lib/helpers/chat.helpers"
import { SubmittedPrompt } from "@/lib/types/chat.types"
import { useProviderSettings } from "@/hooks/use-provider-settings"
import { MessageList } from "./message-list"
import ChatComposer from "./chat-composer"
import { MessageScrollerProvider } from "../ui/message-scroller"

type ChatPlaygroundProps = {
  providerDefaults: {
    provider: ProviderId
    model: string
  }
  providerReadiness: ProviderReadiness[]
  initialPrompt?: string
  autoSend?: boolean
}

export default function Chat({
  providerDefaults,
  providerReadiness,
  initialPrompt,
  autoSend,
}: ChatPlaygroundProps) {
  const [clientError, setClientError] = useState<string | null>(null)
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  )
  const providerSettings = useProviderSettings({
    defaults: providerDefaults,
    serverReadiness: providerReadiness,
  })
  const { messages, sendMessage, status, error, clearError } =
    useChat<UIMessage>({
      transport,
      messages: [],
      experimental_throttle: 80,
      onError: (nextError) => {
        setClientError(describeChatError(nextError))
      },
    })

  const isBusy = status === "submitted" || status === "streaming"
  const errorText = clientError || (error ? describeChatError(error) : null)

  const clearVisibleError = useCallback(() => {
    clearError()
    setClientError(null)
  }, [clearError])

  const sendPrompt = useCallback(
    async ({ text, attachments }: SubmittedPrompt) => {
      clearVisibleError()

      try {
        const credentials = await providerSettings.resolveRequestCredentials()
        await sendMessage(
          {
            text,
            files: attachments.map(({ mediaType, filename, url }) => ({
              type: "file",
              mediaType,
              filename,
              url,
            })),
          },
          {
            body: {
              provider: providerSettings.provider,
              model: providerSettings.model,
              mode:
                credentials.credentialSource === "none" ? "mock" : undefined,
              credentialSource: credentials.credentialSource,
              selectedKeyId: credentials.selectedKeyId,
              apiKey: credentials.apiKey,
            },
          }
        )

        return true
      } catch (nextError) {
        setClientError(describeChatError(nextError))
        return false
      }
    },
    [clearVisibleError, providerSettings, sendMessage]
  )

  return (
    <MessageScrollerProvider
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
    >
      <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div
          data-testid="playground-content"
          className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        >
          {messages.length === 0 && !isBusy ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-12 text-center sm:px-6">
              <p className="text-2xl leading-tight text-foreground">
                Ask for data, a decision, or a workflow step.
                <br />
                I&apos;ll choose the right fable-UI surface and render it
                inline.
              </p>
            </div>
          ) : (
            <MessageList messages={messages} isLoading={isBusy} />
          )}
        </div>

        <ChatComposer
          provider={providerSettings.provider}
          model={providerSettings.model}
          selectedProvider={providerSettings.selectedProviderReadiness}
          providerReadiness={providerSettings.readiness}
          selectedKeyId={providerSettings.selectedKeyId}
          localKeys={providerSettings.localKeys}
          credentialSource={providerSettings.credentialSource}
          storeError={providerSettings.storeError}
          isBusy={isBusy}
          errorText={errorText}
          initialPrompt={initialPrompt}
          autoSend={autoSend}
          onProviderChange={providerSettings.setProvider}
          onModelChange={providerSettings.setModel}
          onCredentialSourceChange={providerSettings.setCredentialSource}
          onSelectedKeyChange={providerSettings.setSelectedKeyId}
          onAddKey={providerSettings.addKey}
          onDeleteKey={providerSettings.deleteKey}
          onRenameKey={providerSettings.renameKey}
          onTestKey={providerSettings.testKey}
          onClearError={clearVisibleError}
          onSend={sendPrompt}
        />
      </section>
    </MessageScrollerProvider>
  )
}
