import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent } from "@/components/ui/message"
import type { ToolRenderHandlers } from "@/lib/fable-ui/core/definitions"
import { cn } from "@/lib/utils"
import { FableToolPart } from "@/components/fable-ui/chat/fable-tool-part"

function MarkdownResponse({ children }: { children: string }) {
  return (
    <div
      className={cn(
        "flex max-w-none flex-col gap-3 text-sm leading-7",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

export function FableMessage({
  message,
  onSuggestedAction,
}: {
  message: UIMessage
  onSuggestedAction?: ToolRenderHandlers["onSuggestedAction"]
}) {
  const isUser = message.role === "user"
  const align = isUser ? "end" : "start"

  return (
    <Message align={align}>
      <MessageContent className={cn("gap-3", isUser ? "items-end" : "items-stretch")}>
        {(message.parts ?? []).map((part, index) => {
          if (part.type === "text") {
            return (
              <Bubble
                key={`${message.id}-text-${index}`}
                align={align}
                variant={isUser ? "tinted" : "ghost"}
                className={isUser ? "w-fit max-w-[75%]" : "w-full max-w-full"}
              >
                <BubbleContent
                  className={cn(
                    "border-none",
                    isUser ? "rounded-tr-sm" : "w-full max-w-3xl px-0",
                  )}
                >
                  <MarkdownResponse>{part.text}</MarkdownResponse>
                </BubbleContent>
              </Bubble>
            )
          }

          if (part.type.startsWith("tool-")) {
            return (
              <div key={`${message.id}-tool-${index}`} className="w-full max-w-5xl">
                <FableToolPart part={part} onSuggestedAction={onSuggestedAction} />
              </div>
            )
          }

          return null
        })}
      </MessageContent>
    </Message>
  )
}
