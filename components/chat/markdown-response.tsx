"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function MarkdownResponse({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex max-w-none flex-col gap-3 text-sm leading-7 text-foreground",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:border-s [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight",
        "[&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-tight",
        "[&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-tight",
        "[&_li]:ms-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:min-w-96 [&_table]:border-collapse [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_ul]:list-disc",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
