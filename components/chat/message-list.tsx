"use client";

import { memo, useMemo } from "react";
import type { FileUIPart } from "ai";
import { Loading03Icon } from "@hugeicons/core-free-icons";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { HugeIcon } from "@/components/hugeicon";
import { cn } from "@/lib/utils";
import { MarkdownResponse } from "./markdown-response";
import { AttachmentGrid, type AttachmentGridItem } from "./attachment-grid";
import {
  ToolPartRenderer,
  type ToolRenderPart,
} from "@/lib/fable-ui/tool-router";
import type { ToolRenderHandlers } from "@/lib/fable-ui/core";
import type { FableUIMessage } from "@/lib/fable-ui/tools";

type MessageListProps = {
  messages: FableUIMessage[];
  isLoading?: boolean;
  onSuggestedAction?: ToolRenderHandlers["onSuggestedAction"];
};

type TimelineItem =
  | { key: string; type: "marker" }
  | { key: string; type: "message"; message: FableUIMessage }
  | { key: string; type: "loading" };

function toAttachmentItem(
  part: FileUIPart & { size?: number },
  index: number,
): AttachmentGridItem {
  return {
    id: `${part.url}-${index}`,
    url: part.url,
    filename: part.filename,
    mediaType: part.mediaType || "application/octet-stream",
    size: part.size,
  };
}

const MessageRow = memo(function MessageRow({
  message,
  onSuggestedAction,
}: {
  message: FableUIMessage;
  onSuggestedAction?: ToolRenderHandlers["onSuggestedAction"];
}) {
  const isUser = message.role === "user";
  const align = isUser ? "end" : "start";
  const parts = message.parts ?? [];

  const attachments = parts
    .filter((part) => part.type === "file")
    .map((part, index) =>
      toAttachmentItem(part as FileUIPart & { size?: number }, index),
    );

  return (
    <Message align={align}>
      <MessageContent
        className={cn("gap-3", isUser ? "items-end" : "items-stretch")}
      >
        {attachments.length > 0 ? (
          <AttachmentGrid attachments={attachments} align={align} />
        ) : null}

        {parts.map((part, index) => {
          if (part.type === "file") {
            return null;
          }

          if (part.type === "text") {
            return (
              <Bubble
                key={`${message.id}-text-${index}`}
                align={align}
                variant={isUser ? "tinted" : "ghost"}
                className={cn(
                  isUser ? "w-fit max-w-[75%]" : "w-full max-w-full",
                )}
              >
                <BubbleContent
                  className={cn(
                    "border-none",
                    isUser
                      ? "w-full px-4"
                      : "w-full max-w-3xl px-0",
                  )}
                >
                  <MarkdownResponse>{part.text}</MarkdownResponse>
                </BubbleContent>
              </Bubble>
            );
          }

          if (part.type === "tool-get_rendered_data") {
            const isLoading =
              part.state === "input-streaming" ||
              part.state === "input-available"
            const isError = part.state === "output-error"
            let description =
              "Render the data view before asking the assistant to reason about it."

            if (isLoading) {
              description = "Reading the current rendered data..."
            } else if (isError) {
              description =
                "The rendered data could not be shared with the assistant."
            } else if (part.state === "output-available") {
              description =
                part.output.status === "available"
                  ? "The assistant can now reason about the current rendered data."
                  : part.output.reason === "too-large"
                    ? "The rendered data is too large. Narrow the visible view first."
                    : description
            }

            return (
              <Marker
                key={`${message.id}-tool-${index}`}
                role={isError ? "alert" : "status"}
              >
                {isLoading ? (
                  <MarkerIcon>
                    <HugeIcon
                      icon={Loading03Icon}
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  </MarkerIcon>
                ) : null}
                <MarkerContent>{description}</MarkerContent>
              </Marker>
            );
          }

          if (part.type.startsWith("tool-")) {
            return (
              <div
                key={`${message.id}-tool-${index}`}
                className="w-full max-w-5xl px-0.5"
              >
                <ToolPartRenderer
                  part={part as ToolRenderPart}
                  handlers={{ onSuggestedAction }}
                />
              </div>
            );
          }

          return null;
        })}
      </MessageContent>
    </Message>
  );
});

function ThinkingRow() {
  return (
    <Marker role="status">
      <MarkerIcon>
        <HugeIcon
          icon={Loading03Icon}
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      </MarkerIcon>
      <MarkerContent>
        <span className="shimmer">Thinking...</span>
      </MarkerContent>
    </Marker>
  );
}

export function MessageList({ messages, isLoading, onSuggestedAction }: MessageListProps) {
  const items = useMemo<TimelineItem[]>(() => {
    const next: TimelineItem[] = []

    for (const message of messages) {
      next.push({ key: message.id, type: "message", message })
    }

    if (isLoading) {
      next.push({ key: "assistant-thinking", type: "loading" })
    }

    return next
  }, [messages, isLoading])

  return (
    <MessageScroller className="min-h-0 flex-1">
      <MessageScrollerViewport>
        <MessageScrollerContent
          aria-busy={isLoading}
          className="mx-auto flex w-full justify-end max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6"
        >
          {items.map((item) => (
            <MessageScrollerItem
              key={item.key}
              messageId={item.key}
              scrollAnchor={
                item.type === "message" && item.message.role === "user"
              }
            >
              {item.type === "message" ? (
                <MessageRow message={item.message} onSuggestedAction={onSuggestedAction} />
              ) : null}

              {item.type === "loading" ? <ThinkingRow /> : null}
            </MessageScrollerItem>
          ))}
        </MessageScrollerContent>
      </MessageScrollerViewport>

      <MessageScrollerButton />
    </MessageScroller>
  )
}
