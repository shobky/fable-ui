"use client"

import * as React from "react"

import type { FableImagePolicy } from "./safety"

type Scalar = string | number | boolean | null

export interface FableHostAction {
  /** Shown in the confirmation step, e.g. "Send this email to 3 people?" */
  confirm?: string
  /** Runs the side effect. Throw to show an error; return a string to show a success note. */
  run: (payload: Record<string, Scalar>) => Promise<string | void> | string | void
}

export interface FableConfig {
  /** Sends a message as the user. Powers `reply` actions and form submits. */
  onReply?: (message: string) => void
  /** Side effects your app allows the model to request by name. */
  actions?: Record<string, FableHostAction>
  images?: FableImagePolicy
  locale?: string
  /** Disables every interactive control, e.g. while a response is streaming. */
  readOnly?: boolean
}

interface FableContextValue extends FableConfig {
  store: Map<string, unknown>
}

const FableContext = React.createContext<FableContextValue>({ store: new Map() })
const ScopeContext = React.createContext("fable")

export function FableProvider({ children, ...config }: FableConfig & { children: React.ReactNode }) {
  const [store] = React.useState(() => new Map<string, unknown>())
  const { onReply, actions, images, locale, readOnly } = config
  const value = React.useMemo(
    () => ({ onReply, actions, images, locale, readOnly, store }),
    [onReply, actions, images, locale, readOnly, store]
  )
  return <FableContext.Provider value={value}>{children}</FableContext.Provider>
}

/** Scopes widget state to one response (usually the tool call id). */
export function FableScope({ id, children }: { id: string; children: React.ReactNode }) {
  return <ScopeContext.Provider value={id}>{children}</ScopeContext.Provider>
}

export function useFable() {
  return React.useContext(FableContext)
}

/**
 * Like useState, but the value outlives remounts (tab switches, list
 * virtualization, re-renders of a streaming message) for this provider.
 */
export function useFableState<T>(key: string, initial: T | (() => T)) {
  const { store } = useFable()
  const scope = React.useContext(ScopeContext)
  const fullKey = `${scope}:${key}`
  const [value, setValue] = React.useState<T>(() =>
    store.has(fullKey) ? (store.get(fullKey) as T) : typeof initial === "function" ? (initial as () => T)() : initial
  )
  const update = React.useCallback(
    (next: React.SetStateAction<T>) => {
      setValue((current) => {
        const resolved = typeof next === "function" ? (next as (value: T) => T)(current) : next
        store.set(fullKey, resolved)
        return resolved
      })
    },
    [store, fullKey]
  )
  return [value, update] as const
}
