"use client"

import * as React from "react"
import {
  Braces,
  Check,
  Copy,
  Database,
  Download,
  FileCode2,
  FileJson2,
  Globe2,
  Terminal,
} from "lucide-react"
import { codeToHtml } from "shiki"
import type { LucideIcon } from "lucide-react"
import type { ShikiTransformer } from "shiki"

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export type CodeBlockCardProps = {
  language: string
  code: string
  filename?: string
  showLineNumbers?: boolean
  isLoading?: boolean
  isStreaming?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
}

const highlightedCodeCache = new Map<string, string>()
const highlightedCodeCacheLimit = 40
const streamingHighlightInterval = 150

function getHighlightedCodeCache(cacheKey: string) {
  const cached = highlightedCodeCache.get(cacheKey)

  if (cached === undefined) {
    return undefined
  }

  highlightedCodeCache.delete(cacheKey)
  highlightedCodeCache.set(cacheKey, cached)
  return cached
}

function cacheHighlightedCode(cacheKey: string, html: string) {
  highlightedCodeCache.delete(cacheKey)
  highlightedCodeCache.set(cacheKey, html)

  const oldestCacheKey = highlightedCodeCache.keys().next().value
  if (
    highlightedCodeCache.size > highlightedCodeCacheLimit &&
    oldestCacheKey !== undefined
  ) {
    highlightedCodeCache.delete(oldestCacheKey)
  }
}

const languageIcons: Record<string, LucideIcon> = {
  bash: Terminal,
  css: Globe2,
  html: Globe2,
  javascript: Braces,
  js: Braces,
  json: FileJson2,
  jsx: Braces,
  sql: Database,
  ts: Braces,
  tsx: Braces,
  typescript: Braces,
}

const languageExtensions: Record<string, string> = {
  bash: "sh",
  css: "css",
  html: "html",
  javascript: "js",
  js: "js",
  json: "json",
  jsx: "jsx",
  markdown: "md",
  python: "py",
  shell: "sh",
  sql: "sql",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
}

const lineNumberTransformer = {
  line(node, line) {
    node.properties["data-line"] = String(line)
  },
} as ShikiTransformer

function getDownloadFilename(filename: string | undefined, language: string) {
  const extension = languageExtensions[language.toLowerCase()] || "txt"
  const source = (filename || `code.${extension}`).trim()
  const safeName = source
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 100)

  return /\.[a-z0-9]+$/iu.test(safeName)
    ? safeName || `code.${extension}`
    : `${safeName || "code"}.${extension}`
}

function downloadCode(code: string, filename: string) {
  const blob = new Blob([code], { type: "text/plain;charset=utf-8" })
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

function RawCode({
  code,
  showLineNumbers,
}: {
  code: string
  showLineNumbers: boolean
}) {
  const lines = code.split("\n")

  return (
    <pre className="m-0 min-w-max p-3 text-sm leading-6 [tab-size:2]">
      <code>
        {showLineNumbers
          ? lines.map((line, index) => (
              <span
                key={`${index}:${line}`}
                data-line={index + 1}
                className="block before:me-4 before:inline-block before:w-8 before:text-end before:text-muted-foreground before:content-[attr(data-line)]"
              >
                {line}
                {index < lines.length - 1 ? "\n" : null}
              </span>
            ))
          : code}
      </code>
    </pre>
  )
}

function HighlightedCode({
  code,
  language,
  showLineNumbers,
  isStreaming = false,
}: {
  code: string
  language: string
  showLineNumbers: boolean
  isStreaming?: boolean
}) {
  const cacheKey = `${language}:${showLineNumbers}:${code}`
  const cachedHtml = getHighlightedCodeCache(cacheKey)
  const [highlight, setHighlight] = React.useState(() => ({
    cacheKey,
    html: null as string | null,
  }))
  const nextStreamingHighlightAt = React.useRef<number | null>(null)
  const requestId = React.useRef(0)

  React.useEffect(() => {
    const currentRequestId = ++requestId.current
    let isCurrent = true
    let timeout: number | undefined

    if (cachedHtml !== undefined) {
      if (!isStreaming) {
        nextStreamingHighlightAt.current = null
      }

      return () => {
        isCurrent = false
      }
    }

    // While input streams, coalesce updates and highlight only the latest code about every 150ms.
    // A completed part flushes immediately; stale requests can never replace its exact output.
    function highlightCurrentCode() {
      if (isStreaming) {
        nextStreamingHighlightAt.current =
          Date.now() + streamingHighlightInterval
      } else {
        nextStreamingHighlightAt.current = null
      }

      codeToHtml(code, {
        lang: language,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
        transformers: showLineNumbers ? [lineNumberTransformer] : [],
      })
        .then((nextHtml) => {
          if (!isCurrent || requestId.current !== currentRequestId) {
            return
          }

          cacheHighlightedCode(cacheKey, nextHtml)
          setHighlight({ cacheKey, html: nextHtml })
        })
        .catch(() => {
          if (isCurrent && requestId.current === currentRequestId) {
            setHighlight({ cacheKey, html: "" })
          }
        })
    }

    if (isStreaming) {
      const now = Date.now()
      const nextAt =
        nextStreamingHighlightAt.current ?? now + streamingHighlightInterval

      nextStreamingHighlightAt.current = nextAt
      timeout = window.setTimeout(
        highlightCurrentCode,
        Math.max(0, nextAt - now)
      )
    } else {
      highlightCurrentCode()
    }

    return () => {
      isCurrent = false
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
      }
    }
  }, [cacheKey, cachedHtml, code, isStreaming, language, showLineNumbers])

  const html =
    cachedHtml ?? (highlight.cacheKey === cacheKey ? highlight.html : null)

  if (html === "") {
    return <RawCode code={code} showLineNumbers={showLineNumbers} />
  }

  if (!html) {
    return <RawCode code={code} showLineNumbers={showLineNumbers} />
  }

  return (
    <div
      className="[&_.line[data-line]]:before:me-4 [&_.line[data-line]]:before:inline-block [&_.line[data-line]]:before:w-8 [&_.line[data-line]]:before:text-end [&_.line[data-line]]:before:text-muted-foreground [&_.line[data-line]]:before:content-[attr(data-line)] [&_.shiki]:!m-0 [&_.shiki]:!min-w-max [&_.shiki]:!bg-[var(--shiki-light-bg)] [&_.shiki]:!p-3 [&_.shiki]:[tab-size:2] [&_.shiki]:!text-[var(--shiki-light)] dark:[&_.shiki]:!bg-[var(--shiki-dark-bg)] dark:[&_.shiki]:!text-[var(--shiki-dark)] [&_.shiki_span]:!text-[var(--shiki-light)] dark:[&_.shiki_span]:!text-[var(--shiki-dark)]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function CodeBlockCard({
  language,
  code,
  filename,
  showLineNumbers = true,
  isLoading,
  isStreaming,
  isDisabled,
  error,
}: CodeBlockCardProps) {
  const [copyError, setCopyError] = React.useState(false)
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const normalizedLanguage = language.toLowerCase()
  const LanguageIcon = languageIcons[normalizedLanguage] || FileCode2
  const hasCode = code.length > 0
  const downloadFilename = getDownloadFilename(filename, language)
  const copyLabel = isCopied ? "Copied code" : "Copy code"
  const downloadLabel = `Download ${downloadFilename}`

  async function copyCode() {
    setCopyError(false)
    setCopyError(!(await copyToClipboard(code)))
  }

  return (
    <Card
      size="sm"
      className="w-full max-w-3xl"
      data-fable-ui="code-block-card"
      aria-busy={isLoading || isStreaming || undefined}
    >
      <CardHeader className="bg-card">
        <div className="flex items-center gap-2">
          <LanguageIcon data-icon="inline-start" />
          <CardTitle className="text-base">
            {filename || language || "Code"}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {language || "plain text"}
        </p>
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
                    disabled={!hasCode}
                    onClick={copyCode}
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
                    disabled={!hasCode}
                    onClick={() => downloadCode(code, downloadFilename)}
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
      <CardContent className="flex flex-col gap-3">
        {isLoading || (isStreaming && !hasCode) ? (
          <>
            <p role="status" className="sr-only">
              Preparing code block...
            </p>
            <Skeleton className="h-64 w-full motion-reduce:animate-none" />
          </>
        ) : null}
        {isStreaming && hasCode ? (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              Generating code...
            </p>
            <div
              dir="ltr"
              className="max-h-96 overflow-auto rounded-2xl border bg-muted/30"
            >
              <HighlightedCode
                code={code}
                language={language}
                showLineNumbers={showLineNumbers}
                isStreaming
              />
            </div>
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
            {hasCode ? (
              <div
                dir="ltr"
                className="max-h-96 overflow-auto rounded-2xl border bg-muted/30"
              >
                <RawCode code={code} showLineNumbers={showLineNumbers} />
              </div>
            ) : null}
          </>
        ) : null}
        {!isLoading && !isStreaming && !error && !hasCode ? (
          <Empty className="min-h-48 p-6">
            <EmptyHeader>
              <EmptyTitle>No code yet</EmptyTitle>
              <EmptyDescription>
                There is no source to highlight or export.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {!isLoading && !isStreaming && !error && hasCode ? (
          <div
            dir="ltr"
            className="max-h-96 overflow-auto rounded-2xl border bg-muted/30"
          >
            <HighlightedCode
              key={`${language}:${showLineNumbers}:${code}`}
              code={code}
              language={language}
              showLineNumbers={showLineNumbers}
            />
          </div>
        ) : null}
        {copyError ? (
          <p role="status" className="text-sm text-destructive">
            Could not copy. Select the code and copy it manually.
          </p>
        ) : null}
        {isDisabled ? (
          <p className="text-xs text-muted-foreground">
            This code block is read-only.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export {
  getDownloadFilename as getCodeDownloadFilename,
  languageExtensions,
  languageIcons,
}
