"use client"

import * as React from "react"

type PlainTextControl = HTMLInputElement | HTMLTextAreaElement

export function usePlainTextDraft<TControl extends PlainTextControl>({
  initialValue,
}: {
  initialValue: string
}) {
  const [value, setValue] = React.useState(initialValue)

  const onInput = React.useCallback((event: React.FormEvent<TControl>) => {
    const nextValue = event.currentTarget.value

    setValue(nextValue)
  }, [])

  return {
    onInput,
    value,
  }
}

export type TextDirection = "ltr" | "rtl" | "auto"

export function resolveTextDirection(
  direction: TextDirection,
  content: string
) {
  if (direction !== "auto") {
    return direction
  }

  return /[\u0590-\u08ff]/u.test(content) ? "rtl" : "ltr"
}
