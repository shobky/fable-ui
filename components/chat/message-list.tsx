"use client";

import { memo, useMemo } from "react";
import type { FileUIPart, UIMessage } from "ai";
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

type MessageListProps = {
  messages: UIMessage[];
  isLoading?: boolean;
};

type TimelineItem =
  | { key: string; type: "marker" }
  | { key: string; type: "message"; message: UIMessage }
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
}: {
  message: UIMessage;
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
                      ? "w-full rounded-tr-sm"
                      : "w-full max-w-3xl px-0",
                  )}
                >
                  <MarkdownResponse>{part.text}</MarkdownResponse>
                </BubbleContent>
              </Bubble>
            );
          }

          if (part.type.startsWith("tool-")) {
            return (
              <div
                key={`${message.id}-tool-${index}`}
                className="w-full max-w-5xl"
              >
                <ToolPartRenderer part={part as ToolRenderPart} />
              </div>
            );
          }

          return null;
        })}
      </MessageContent>
    </Message>
  );
});

function TimelineMarker() {
  return (
    <div className="flex justify-center py-2 text-xs text-muted-foreground">
      Today
    </div>
  );
}

function ThinkingRow() {
  return (
    <Marker role="status">
      <MarkerIcon>
        <HugeIcon
          icon={Loading03Icon}
          className="animate-spin"
          aria-hidden="true"
        />
      </MarkerIcon>
      <MarkerContent>
        <span className="shimmer">Thinking...</span>
      </MarkerContent>
    </Marker>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
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
                <MessageRow message={item.message} />
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