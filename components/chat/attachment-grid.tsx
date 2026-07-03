"use client";

import { Cancel01Icon, File01Icon } from "@hugeicons/core-free-icons";

import { HugeIcon } from "@/components/hugeicon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AttachmentGridItem = {
  id?: string;
  url: string;
  filename?: string;
  mediaType: string;
  size?: number;
};

type AttachmentGridProps = {
  attachments: AttachmentGridItem[];
  align?: "start" | "end";
  onRemove?: (attachment: AttachmentGridItem) => void;
  className?: string;
};

function formatBytes(size?: number) {
  if (!size) {
    return "File";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getGridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1 max-w-[180px]";
  }

  if (count === 2) {
    return "grid-cols-2 max-w-[220px]";
  }

  return "grid-cols-3 max-w-[252px]";
}

export function AttachmentGrid({ attachments, align = "start", onRemove, className }: AttachmentGridProps) {
  if (attachments.length === 0) {
    return null;
  }

  const hasOverflow = attachments.length > 9;
  const visibleAttachments = hasOverflow ? attachments.slice(0, 8) : attachments.slice(0, 9);
  const displayCount = hasOverflow ? 9 : visibleAttachments.length;
  const overflowCount = attachments.length - 8;

  return (
    <div
      data-testid="attachment-grid"
      className={cn(
        "grid gap-0.5",
        getGridClass(displayCount),
        align === "end" && "ml-auto",
        className,
      )}
    >
      {visibleAttachments.map((attachment, index) => {
        const isImage = attachment.mediaType.startsWith("image/");
        const key = attachment.id || `${attachment.url}-${index}`;

        return (
          <div
            key={key}
            className={cn(
              "group relative aspect-square min-h-12 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
              displayCount === 1 ? "size-[180px] max-w-full" : "size-[68px] sm:size-[76px]",
            )}
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.url}
                alt={attachment.filename || "Attached image"}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col justify-between p-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeIcon icon={File01Icon} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {attachment.filename || "Attachment"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
                </span>
              </div>
            )}
            {onRemove ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Remove ${attachment.filename || "attachment"}`}
                className="absolute right-1 top-1 opacity-0 shadow-sm group-hover:opacity-100 group-focus-within:opacity-100"
                onClick={() => onRemove(attachment)}
              >
                <HugeIcon icon={Cancel01Icon} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      })}

      {hasOverflow ? (
        <div className="flex aspect-square size-[68px] items-center justify-center rounded-xl border bg-muted text-sm font-semibold text-foreground shadow-sm sm:size-[76px]">
          +{overflowCount}
        </div>
      ) : null}
    </div>
  );
}
