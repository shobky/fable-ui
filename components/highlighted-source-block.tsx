"use client"

import * as React from "react"
import { codeToHtml } from "shiki"
import type { ShikiTransformer } from "shiki"

const highlightedCodeCache = new Map<string, string>()

const codeBlockTransformers = [
  {
    pre(node) {
      node.properties["class"] =
        "no-scrollbar m-0 min-w-0 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto bg-code px-4 py-3.5 text-sm outline-none !bg-transparent"
    },
    code(node) {
      node.properties["data-line-numbers"] = ""
    },
    line(node) {
      node.properties["data-line"] = ""
    },
  },
] as ShikiTransformer[]

export function HighlightedSourceBlock({
  code,
  language = "tsx",
  previewLines,
}: {
  code: string
  language?: string
  previewLines?: number
}) {
  const visibleCode = React.useMemo(() => {
    if (!previewLines) {
      return code
    }

    return code.split("\n").slice(0, previewLines).join("\n")
  }, [code, previewLines])

  const [highlightedCode, setHighlightedCode] = React.useState<string | null>(
    () => highlightedCodeCache.get(`${language}:${visibleCode}`) ?? null
  )

  React.useEffect(() => {
    const cacheKey = `${language}:${visibleCode}`
    const cachedCode = highlightedCodeCache.get(cacheKey)
    let isCurrent = true

    if (cachedCode) {
      Promise.resolve(cachedCode).then((html) => {
        if (isCurrent) {
          setHighlightedCode(html)
        }
      })

      return () => {
        isCurrent = false
      }
    }

    codeToHtml(visibleCode, {
      lang: language,
      themes: {
        dark: "github-dark",
        light: "github-light",
      },
      transformers: codeBlockTransformers,
    }).then((html) => {
      highlightedCodeCache.set(cacheKey, html)

      if (isCurrent) {
        setHighlightedCode(html)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [language, visibleCode])

  return (
    <figure
      data-rehype-pretty-code-figure=""
      className="m-0! rounded-none! border-0! bg-code"
    >
      {highlightedCode ? (
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      ) : (
        <pre className="m-0 overflow-x-auto bg-code px-4 py-3.5 text-sm text-code-foreground">
          <code>{visibleCode}</code>
        </pre>
      )}
    </figure>
  )
}
