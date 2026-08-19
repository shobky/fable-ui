"use client"

import * as React from "react"
import { Check, Copy, Download } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

import {
  resolveTextDirection,
  usePlainTextDraft,
  type TextDirection,
} from "./use-plain-text-draft"

export type TextEditorFormat = "plain" | "markdown"

export type TextEditorCardProps = {
  label?: string
  content: string
  format?: TextEditorFormat
  filename?: string
  editable?: boolean
  direction?: TextDirection
  maxLength?: number
  isLoading?: boolean
  isStreaming?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  onContentChange?: (content: string) => void
}

function downloadText({
  content,
  filename,
  format,
}: {
  content: string
  filename: string
  format: TextEditorFormat
}) {
  const blob = new Blob([content], {
    type:
      format === "markdown"
        ? "text/markdown;charset=utf-8"
        : "text/plain;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getDownloadFilename({
  filename,
  label,
  format,
}: {
  filename?: string
  label?: string
  format: TextEditorFormat
}) {
  const extension = format === "markdown" ? "md" : "txt"
  const source = (filename || label || "text").trim()
  const safeBase = source
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^\.+/, "")
    .replace(/\.(?:txt|md|markdown)$/iu, "")
    .slice(0, 80)

  return `${safeBase || "text"}.${extension}`
}

function TextEditorContent({
  content,
  direction,
  editable,
  isDisabled,
  maxLength,
  onContentChange,
  onActionableContentChange,
  editorRef,
}: Pick<
  TextEditorCardProps,
  | "content"
  | "direction"
  | "editable"
  | "isDisabled"
  | "maxLength"
  | "onContentChange"
> & {
  onActionableContentChange: (hasContent: boolean) => void
  editorRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const contentId = React.useId()
  const draft = usePlainTextDraft<HTMLTextAreaElement>({
    initialValue: content,
  })
  const softLimitExceeded = Boolean(maxLength && draft.value.length > maxLength)

  return (
    <FieldGroup>
      <Field data-disabled={isDisabled || !editable || undefined}>
        <FieldLabel htmlFor={contentId}>Content</FieldLabel>
        <Textarea
          id={contentId}
          ref={editorRef}
          defaultValue={content}
          dir={direction}
          readOnly={isDisabled || !editable}
          onInput={(event) => {
            draft.onInput(event)
            onActionableContentChange(Boolean(event.currentTarget.value))
          }}
          onBlur={(event) => onContentChange?.(event.currentTarget.value)}
          className="max-h-80 min-h-40 overflow-auto leading-6"
        />
        {maxLength ? (
          <p className="text-xs text-muted-foreground">
            {draft.value.length} / {maxLength} characters
          </p>
        ) : null}
        {softLimitExceeded ? (
          <FieldError className="text-muted-foreground">
            Soft limit exceeded. The text is still available to copy or
            download.
          </FieldError>
        ) : null}
      </Field>
    </FieldGroup>
  )
}

function ReadOnlyText({
  content,
  direction,
}: {
  content: string
  direction: TextDirection
}) {
  return (
    <pre
      dir={direction}
      className="max-h-80 overflow-auto rounded-2xl border bg-muted/30 p-3 text-sm break-words whitespace-pre-wrap"
    >
      {content}
    </pre>
  )
}

export function TextEditorCard({
  label = "Text editor",
  content,
  format = "plain",
  filename,
  editable = true,
  direction = "auto",
  maxLength,
  isLoading,
  isStreaming,
  isDisabled,
  error,
  onContentChange,
}: TextEditorCardProps) {
  const [copyError, setCopyError] = React.useState(false)
  const editorRef = React.useRef<HTMLTextAreaElement>(null)
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const hasContent = content.length > 0
  const isReady = !isLoading && !isStreaming && !error && hasContent
  const [draftActionability, setDraftActionability] = React.useState(() => ({
    source: content,
    hasContent,
  }))
  const downloadFilename = getDownloadFilename({ filename, label, format })
  const title = label || "Text editor"
  const copyLabel = isCopied ? "Copied text" : "Copy text"
  const downloadLabel = `Download .${format === "markdown" ? "md" : "txt"}`
  const hasActionableContent = isReady
    ? draftActionability.source === content
      ? draftActionability.hasContent
      : hasContent
    : hasContent

  async function copyContent() {
    setCopyError(false)
    const currentContent = isReady
      ? (editorRef.current?.value ?? content)
      : content
    const didCopy = await copyToClipboard(currentContent)

    setCopyError(!didCopy)
  }

  function downloadContent() {
    const currentContent = isReady
      ? (editorRef.current?.value ?? content)
      : content

    downloadText({
      content: currentContent,
      filename: downloadFilename,
      format,
    })
  }

  return (
    <Card
      size="sm"
      className="w-full max-w-2xl"
      data-fable-ui="text-editor-card"
      aria-busy={isLoading || isStreaming || undefined}
    >
      <CardHeader>
        <CardTitle
          className={
            title === "Text editor" ? "sr-only" : "text-sm font-medium"
          }
        >
          {title}
        </CardTitle>
        <CardAction>
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copyLabel}
                    disabled={!hasActionableContent}
                    onClick={copyContent}
                  >
                    {isCopied ? <Check /> : <Copy />}
                    <span className="sr-only">{copyLabel}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copyLabel}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={downloadLabel}
                    disabled={!hasActionableContent}
                    onClick={downloadContent}
                  >
                    <Download />
                    <span className="sr-only">{downloadLabel}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{downloadLabel}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || (isStreaming && !hasContent) ? (
          <>
            <p role="status" className="sr-only">
              Preparing text editor...
            </p>
            <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
            <Skeleton className="h-40 w-full motion-reduce:animate-none" />
          </>
        ) : null}
        {isStreaming && hasContent ? (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              Generating text...
            </p>
            <ReadOnlyText content={content} direction={direction} />
          </>
        ) : null}
        {!isLoading && !isStreaming && error ? (
          <>
            <Alert variant="destructive">
              <AlertTitle>{error.title}</AlertTitle>
              {error.description ? (
                <AlertDescription>{error.description}</AlertDescription>
              ) : null}
            </Alert>
            {hasContent ? (
              <ReadOnlyText content={content} direction={direction} />
            ) : null}
          </>
        ) : null}
        {!isLoading && !isStreaming && !error && !hasContent ? (
          <Empty className="min-h-40 p-6">
            <EmptyHeader>
              <EmptyTitle>No text yet</EmptyTitle>
              <EmptyDescription>
                There is no content to edit or export.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {!isLoading && !isStreaming && !error && hasContent ? (
          <TextEditorContent
            key={`${format}:${content}`}
            content={content}
            direction={direction}
            editable={editable}
            isDisabled={isDisabled}
            maxLength={maxLength}
            onContentChange={onContentChange}
            onActionableContentChange={(nextHasContent) => {
              setDraftActionability({
                source: content,
                hasContent: nextHasContent,
              })
            }}
            editorRef={editorRef}
          />
        ) : null}
        {copyError ? (
          <p role="status" className="text-sm text-destructive">
            Could not copy. Select the text and copy it manually.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default TextEditorCard

// shadcn rewrites imports from a registry dependency's barrel to its primary
// component file. Keep the shared draft contract available at that boundary.
export { resolveTextDirection, usePlainTextDraft }
export type { TextDirection }
