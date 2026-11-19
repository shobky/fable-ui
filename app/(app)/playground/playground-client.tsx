"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import type { UIMessage } from "ai"
import {
  CheckIcon,
  CodeXmlIcon,
  CopyIcon,
  Settings2Icon,
  ListIcon,
  MoonIcon,
  PanelLeftIcon,
  RotateCcwIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  FableChat,
  type FableChatController,
} from "@/components/fable-ui/chat/fable-chat"
import type { FableHostAction } from "@/components/fable-ui/provider"
import { resolveSpec } from "@/components/fable-ui/resolve"
import { specToMarkdown } from "@/components/fable-ui/to-markdown"
import { isFableToolPart } from "@/components/fable-ui/tool-part"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"
import { PRESETS, type PresetId } from "@/lib/playground/presets"
import {
  DEMO_IMAGE_HOSTS,
  SCENARIOS,
  SUGGESTED,
  type Scenario,
} from "@/lib/playground/scenarios"

export type Provider = {
  id: string
  label: string
  defaultModel: string
  isConfigured: boolean
  models: string[]
  keyUrl?: string
}

type Credential = {
  id: string
  label?: string
  hasKey: boolean
  preview?: string | null
}

/** Providers that can be used for a live request in this browser. */
export function getConfiguredProviderOptions(
  providers: readonly Provider[],
  configuredProviderIds: ReadonlySet<string>
) {
  return providers.filter(
    (entry) => entry.isConfigured || configuredProviderIds.has(entry.id)
  )
}

/** Return model IDs only for the provider selected by the user. */
export function getProviderModelIds(
  providers: readonly Provider[],
  providerId: string
) {
  return providers.find((entry) => entry.id === providerId)?.models ?? []
}

/** Select a provider's default model and clear any provider-specific custom ID. */
export function getProviderSelection(
  providers: readonly Provider[],
  providerId: string
) {
  const provider = providers.find((entry) => entry.id === providerId)
  return {
    providerId: provider?.id ?? "",
    model: provider?.defaultModel ?? "",
    customModel: "",
  }
}

const CUSTOM_MODEL_OPTION = "__fable_custom_model__"
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/

export function isCustomModelIdValid(value: string) {
  return MODEL_ID_PATTERN.test(value.trim())
}

const hostActions: Record<string, FableHostAction> = {
  "email.send": {
    confirm: "Send this email?",
    run: async (payload) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      const to = String(payload.to || "nobody")
      return `Demo: would send to ${to}. Nothing left this page.`
    },
  },
}

const groups = [
  "Writing",
  "Data",
  "Media",
  "Forms & drafts",
  "Layouts",
] as const

export function PromptLibrary({
  onPick,
  className,
}: {
  onPick: (scenario: Scenario) => void
  className?: string
}) {
  const [query, setQuery] = React.useState("")
  const input = React.useRef<HTMLInputElement>(null)
  const clear = () => {
    setQuery("")
    input.current?.focus()
  }
  const id = React.useId()
  const filtered = SUGGESTED.filter((scenario) =>
    [scenario.label, scenario.prompt, scenario.group].some((text) =>
      text.toLowerCase().includes(query.trim().toLowerCase())
    )
  )
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      <div className="shrink-0 space-y-2 px-4">
        <label htmlFor={id} className="sr-only">
          Search examples
        </label>
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={input}
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search examples…"
            className="h-10 rounded-xl ps-9 pe-10 text-sm"
          />
          {query ? (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Clear search"
              onClick={clear}
              className="absolute end-1 top-1"
            >
              <XIcon aria-hidden className="size-4" />
            </Button>
          ) : null}
        </div>
        <p
          role="status"
          aria-atomic="true"
          className="text-xs text-muted-foreground"
        >
          {filtered.length} examples
        </p>
      </div>
      <nav
        aria-label="Examples"
        className="min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto overscroll-contain px-2 pb-4"
      >
        {filtered.length ? (
          groups.map((group) => {
            const entries = filtered.filter(
              (scenario) => scenario.group === group
            )
            return entries.length ? (
              <section
                key={group}
                aria-label={group}
                className="mb-5 last:mb-0"
              >
                <h3 className="px-3 pb-1 text-xs font-medium text-muted-foreground">
                  {group}
                </h3>
                <ul className="space-y-0.5">
                  {entries.map((scenario) => (
                    <li key={scenario.id}>
                      <button
                        type="button"
                        onClick={() => onPick(scenario)}
                        className="flex w-full min-w-0 flex-col gap-1 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                      >
                        <span className="text-sm font-medium [overflow-wrap:anywhere]">
                          {scenario.label}
                        </span>
                        <span className="line-clamp-2 text-xs leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                          {scenario.prompt}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null
          })
        ) : (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            <p>No examples found</p>
            <Button variant="link" onClick={clear}>
              Reset search
            </Button>
          </div>
        )}
      </nav>
    </div>
  )
}

function Inspector({ messages }: { messages: UIMessage[] }) {
  const [tab, setTab] = React.useState<"spec" | "markdown">("spec")
  const [copied, setCopied] = React.useState(false)
  const part = React.useMemo(() => {
    for (const message of [...messages].reverse()) {
      const found = [...message.parts]
        .reverse()
        .find((candidate) => isFableToolPart(candidate))
      if (found) return found as { input?: unknown; state: string }
    }
    return null
  }, [messages])

  if (!part) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
        <CodeXmlIcon className="mb-2 size-8 opacity-40" />
        <p className="font-medium text-foreground">Spec Inspector</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          The generative UI spec and markdown fallback stream here in real-time.
        </p>
      </div>
    )
  }

  const json = JSON.stringify(part.input ?? {}, null, 2)
  const resolved = resolveSpec(part.input, part.state === "input-streaming")
  const blocks = resolved.items.length
  const pending = resolved.items.filter(
    (item) => item.kind === "pending"
  ).length
  const contentToCopy = tab === "spec" ? json : specToMarkdown(part.input) || ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <dl className="grid grid-cols-3 gap-px border-b border-border bg-border text-xs">
        {[
          ["State", part.state.replace("input-", "").replace("output-", "")],
          ["Blocks", `${blocks}${pending ? ` (${pending} open)` : ""}`],
          ["Skipped", String(resolved.invalidCount)],
        ].map(([label, value]) => (
          <div key={label} className="bg-background px-3 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border px-2 py-1.5">
        <div className="flex gap-1">
          {(["spec", "markdown"] as const).map((value) => (
            <Button
              key={value}
              size="xs"
              variant={tab === value ? "secondary" : "ghost"}
              onClick={() => setTab(value)}
              className="transition-[scale] motion-safe:active:scale-[0.96]"
            >
              {value === "spec"
                ? `JSON · ${(new Blob([json]).size / 1024).toFixed(1)} KB`
                : "Markdown fallback"}
            </Button>
          ))}
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleCopy}
          title={copied ? "Copied" : "Copy to clipboard"}
          aria-label={copied ? "Copied" : "Copy"}
          className="transition-[scale] motion-safe:active:scale-[0.96]"
        >
          {copied ? (
            <CheckIcon className="size-3 text-emerald-500" />
          ) : (
            <CopyIcon className="size-3" />
          )}
        </Button>
      </div>
      <pre className="min-h-0 flex-1 [scrollbar-width:thin] overflow-auto p-3 font-mono text-[0.6875rem] leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
        {tab === "spec"
          ? json
          : specToMarkdown(part.input) ||
            "Available once the spec is complete and valid."}
      </pre>
    </div>
  )
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "transition-[scale,background-color] motion-safe:active:scale-[0.96]",
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ProviderIcon({ id, className }: { id: string; className?: string }) {
  const iconProps = { className: cn("size-4 shrink-0", className) }
  if (id === "google") return <Icons.gemini {...iconProps} />
  if (id === "anthropic") return <Icons.anthropic {...iconProps} />
  if (id === "openai") return <Icons.openai {...iconProps} />
  if (id === "openrouter") return <Icons.openrouter {...iconProps} />
  if (id === "mistral") return <Icons.mistral {...iconProps} />
  if (id === "deepseek") return <Icons.deepseek {...iconProps} />
  return (
    <span
      aria-hidden
      className={cn("size-4 shrink-0 rounded-full bg-muted", className)}
    />
  )
}

function credentialList(payload: unknown): Credential[] {
  if (Array.isArray(payload)) {
    return (payload as Credential[]).filter(
      (entry) => entry && typeof entry.id === "string" && entry.hasKey
    )
  }
  if (payload && typeof payload === "object" && "credentials" in payload) {
    const list = (payload as { credentials?: unknown }).credentials
    return Array.isArray(list)
      ? (list as Credential[]).filter(
          (entry) => entry && typeof entry.id === "string" && entry.hasKey
        )
      : []
  }
  return []
}

export function ProviderModelSettings({
  providers,
  configuredProviderIds,
  provider,
  selectedModel,
  customModel,
  customModelMode,
  onProviderChange,
  onModelChange,
  onCustomModelChange,
  onCustomModelModeChange,
}: {
  providers: Provider[]
  configuredProviderIds: ReadonlySet<string>
  provider: string
  selectedModel: string
  customModel: string
  customModelMode: boolean
  onProviderChange: (providerId: string) => void
  onModelChange: (model: string) => void
  onCustomModelChange: (model: string) => void
  onCustomModelModeChange: (active: boolean) => void
}) {
  const selectedProvider = providers.find((entry) => entry.id === provider)
  const selectedProviderReady = selectedProvider
    ? selectedProvider.isConfigured ||
      configuredProviderIds.has(selectedProvider.id)
    : false
  const modelIds = getProviderModelIds(providers, provider)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Provider</p>
      <Select value={provider} onValueChange={onProviderChange}>
        <SelectTrigger aria-label="Provider" className="w-full">
          <SelectValue placeholder="Choose a provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              <span className="flex min-w-0 items-center gap-2">
                <ProviderIcon id={entry.id} />
                <span className="truncate">{entry.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedProvider && !selectedProviderReady ? (
        <p
          role="status"
          className="text-[11px] leading-4 text-muted-foreground"
        >
          Add a key for {selectedProvider.label} below to use this provider.
        </p>
      ) : null}
      <p className="pt-1 text-sm font-medium">Model</p>
      <Select
        value={customModelMode ? CUSTOM_MODEL_OPTION : selectedModel}
        onValueChange={(value) => {
          if (value === CUSTOM_MODEL_OPTION) {
            onCustomModelModeChange(true)
            onModelChange("")
            onCustomModelChange("")
            return
          }
          onCustomModelModeChange(false)
          onCustomModelChange("")
          onModelChange(value)
        }}
        disabled={!provider}
      >
        <SelectTrigger aria-label="Model" className="w-full">
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          {modelIds.map((model) => (
            <SelectItem key={model} value={model}>
              <span className="truncate">{model}</span>
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_MODEL_OPTION}>Custom model ID…</SelectItem>
        </SelectContent>
      </Select>
      {customModelMode ? (
        <>
          <Input
            aria-label="Custom model id"
            value={customModel}
            maxLength={128}
            onChange={(event) => onCustomModelChange(event.target.value)}
            placeholder="Enter a provider model ID"
            className="h-9 rounded-xl"
          />
          {customModel.trim() && !isCustomModelIdValid(customModel) ? (
            <p role="alert" className="text-[11px] leading-4 text-destructive">
              Use 1–128 letters, numbers, dots, slashes, colons, underscores, or
              hyphens.
            </p>
          ) : !customModel.trim() ? (
            <p
              role="status"
              className="text-[11px] leading-4 text-muted-foreground"
            >
              Enter a model ID to enable live requests.
            </p>
          ) : (
            <p className="text-[11px] leading-4 text-muted-foreground">
              This ID is sent to the selected provider only.
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}

export function ProviderKeyManager({
  providers,
  credentials,
  onRefresh,
  selectedProviderId,
  onProviderChange,
}: {
  providers: Provider[]
  credentials: Credential[]
  onRefresh: () => Promise<void>
  selectedProviderId?: string
  onProviderChange?: (providerId: string) => void
}) {
  const [selected, setSelected] = React.useState(selectedProviderId ?? "")
  const [apiKey, setApiKey] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const configured = React.useMemo(
    () =>
      new Set(
        credentials.filter((entry) => entry.hasKey).map((entry) => entry.id)
      ),
    [credentials]
  )
  const savedCredentials = React.useMemo(
    () => credentials.filter((entry) => entry.hasKey),
    [credentials]
  )

  React.useEffect(() => {
    if (selectedProviderId && selectedProviderId !== selected) {
      setSelected(selectedProviderId)
      setApiKey("")
      setError(null)
      return
    }
    if (!selected && providers[0]) {
      setSelected(providers[0].id)
      onProviderChange?.(providers[0].id)
    }
  }, [onProviderChange, providers, selected, selectedProviderId])
  const selectedProvider = providers.find((entry) => entry.id === selected)

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected || apiKey.trim().length < 8) {
      setError("Enter a valid API key to continue.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/playground/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: selected, apiKey }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok)
        throw new Error(
          payload?.error || payload?.message || "Could not save this key."
        )
      setApiKey("")
      await onRefresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this key."
      )
    } finally {
      setBusy(false)
    }
  }

  const changeProvider = (providerId: string) => {
    if (providerId !== selected) {
      setApiKey("")
      setError(null)
    }
    setSelected(providerId)
    onProviderChange?.(providerId)
  }

  const remove = async (provider: string) => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/playground/credentials?provider=${encodeURIComponent(provider)}`,
        {
          method: "DELETE",
        }
      )
      const payload = await response.json().catch(() => null)
      if (!response.ok)
        throw new Error(
          payload?.error || payload?.message || "Could not remove this key."
        )
      await onRefresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not remove this key."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-5">
      <div>
        <p className="text-sm font-medium">Your provider keys</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Keys stay in an HttpOnly cookie. Only a short preview is shown here.
        </p>
      </div>
      {savedCredentials.length ? (
        <ul className="space-y-1.5" aria-label="Saved provider keys">
          {savedCredentials.map((credential) => {
            const provider = providers.find(
              (entry) => entry.id === credential.id
            )
            return (
              <li
                key={credential.id}
                className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2"
              >
                <ProviderIcon id={credential.id} />
                <span className="min-w-0 flex-1 truncate text-xs">
                  <span className="font-medium">
                    {provider?.label ?? credential.id}
                  </span>
                  <span className="ms-1 text-muted-foreground">
                    {credential.preview ?? "Saved key"}
                  </span>
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void remove(credential.id)}
                >
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
      <form onSubmit={save} className="space-y-2.5">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor="playground-provider"
        >
          Provider for this key
        </label>
        <Select value={selected} onValueChange={changeProvider} disabled={busy}>
          <SelectTrigger
            id="playground-provider"
            aria-label="Provider for this key"
            className="w-full"
          >
            <SelectValue placeholder="Choose a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                <span className="flex items-center gap-2">
                  <ProviderIcon id={entry.id} />
                  {entry.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProvider?.keyUrl ? (
          <a
            href={selectedProvider.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Get an API key for {selectedProvider.label}
          </a>
        ) : null}
        <label className="sr-only" htmlFor="playground-api-key">
          API key
        </label>
        <Input
          id="playground-api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Paste your API key"
          className="h-9 rounded-xl"
        />
        <Button
          type="submit"
          size="sm"
          className="w-full rounded-xl"
          disabled={busy || !selected || !apiKey.trim()}
        >
          {busy
            ? "Saving…"
            : configured.has(selected)
              ? "Replace key"
              : "Save key"}
        </Button>
      </form>
      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function buildPlaygroundBody({
  mode,
  providerRef,
  customModel,
  speed,
}: {
  mode: "demo" | "live"
  providerRef: string
  customModel: string
  speed: number
}) {
  const separator = providerRef.indexOf(":")
  const provider =
    separator >= 0 ? providerRef.slice(0, separator) : providerRef
  const catalogModel = separator >= 0 ? providerRef.slice(separator + 1) : ""
  const model = customModel.trim().slice(0, 128) || catalogModel
  return { mode, provider, model, speed }
}

export function PlaygroundClient() {
  const chat = React.useRef<FableChatController>(null)
  const inspectorTrigger = React.useRef<HTMLButtonElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const dark = mounted && resolvedTheme === "dark"
  const [mode, setMode] = React.useState<"demo" | "live">("demo")
  const [speed, setSpeed] = React.useState(1)
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [credentials, setCredentials] = React.useState<Credential[]>([])
  const [provider, setProvider] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState("")
  const [customModel, setCustomModel] = React.useState("")
  const [customModelMode, setCustomModelMode] = React.useState(false)
  const [preset, setPreset] = React.useState<PresetId>("neutral")
  const [rtl, setRtl] = React.useState(false)
  const [inspector, setInspector] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [messages, setMessages] = React.useState<UIMessage[]>([])
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [wide, setWide] = React.useState(false)
  const [headerSlot, setHeaderSlot] = React.useState<HTMLElement | null>(null)
  const [headerResolved, setHeaderResolved] = React.useState(false)
  React.useEffect(() => {
    const findSlot = () => {
      const slot = document.getElementById("playground-header-slot")
      if (slot) {
        setHeaderSlot(slot)
        setHeaderResolved(true)
        return true
      }
      return false
    }
    if (findSlot()) return
    const observer = new MutationObserver(() => {
      if (findSlot()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const fallback = window.setTimeout(() => {
      observer.disconnect()
      setHeaderResolved(true)
    }, 1000)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])
  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)")
    const update = () => setWide(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const refreshProviders = React.useCallback(async () => {
    try {
      const response = await fetch("/api/playground", { cache: "no-store" })
      if (!response.ok) throw new Error("Provider catalog unavailable")
      const list = (await response.json()) as Provider[]
      setProviders(list)
      setProvider((current) => {
        if (current && list.some((entry) => entry.id === current))
          return current
        return list[0]?.id ?? ""
      })
    } catch {
      setProviders([])
    }
  }, [])

  React.useEffect(() => {
    void refreshProviders()
  }, [refreshProviders])

  const refreshCredentials = React.useCallback(async () => {
    try {
      const response = await fetch("/api/playground/credentials", {
        cache: "no-store",
      })
      if (!response.ok) return
      const payload = await response.json()
      setCredentials(credentialList(payload))
    } catch {
      setCredentials([])
    }
  }, [])

  React.useEffect(() => {
    void refreshCredentials()
  }, [refreshCredentials])

  const refreshPlayground = React.useCallback(async () => {
    await refreshCredentials()
    await refreshProviders()
  }, [refreshCredentials, refreshProviders])

  // Presets apply to <html> so portalled menus and dialogs match.
  React.useEffect(() => {
    const root = document.documentElement
    root.dataset.fableTheme = preset
    return () => {
      delete root.dataset.fableTheme
    }
  }, [preset])

  // Shareable links: ?run=<scenario>&preset=<id>&speed=<n>&dark=1&rtl=1
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const presetParam = params.get("preset")
    if (PRESETS.some((entry) => entry.id === presetParam))
      setPreset(presetParam as PresetId)
    const speedParam = Number(params.get("speed"))
    if (speedParam > 0 && speedParam <= 8) setSpeed(speedParam)
    if (params.get("rtl") === "1") setRtl(true)
    if (params.get("dark") === "1") setTheme("dark")
    if (params.get("dark") === "0") setTheme("light")
    const scenario = SCENARIOS.find((entry) => entry.id === params.get("run"))
    const timer = scenario
      ? setTimeout(() => chat.current?.send(scenario.prompt), 300)
      : undefined
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const configuredProviders = React.useMemo(
    () =>
      new Set(
        credentials.filter((entry) => entry.hasKey).map((entry) => entry.id)
      ),
    [credentials]
  )
  const liveReady = providers.some(
    (entry) => entry.isConfigured || configuredProviders.has(entry.id)
  )
  React.useEffect(() => {
    if (!providers.length) return
    const selected = providers.find((entry) => entry.id === provider)
    if (!selected) {
      const initial = providers[0]
      setProvider(initial.id)
      setSelectedModel(initial.defaultModel)
      setCustomModel("")
      setCustomModelMode(false)
      return
    }
    if (
      !customModelMode &&
      (!selectedModel || !selected.models.includes(selectedModel))
    ) {
      setSelectedModel(selected.defaultModel)
    }
  }, [customModelMode, provider, providers, selectedModel])
  const selectProvider = React.useCallback(
    (providerId: string) => {
      const next = getProviderSelection(providers, providerId)
      setProvider(next.providerId)
      setSelectedModel(next.model)
      setCustomModel(next.customModel)
      setCustomModelMode(false)
    },
    [providers]
  )
  const selectedProvider = providers.find((entry) => entry.id === provider)
  const selectedProviderReady = selectedProvider
    ? selectedProvider.isConfigured ||
      configuredProviders.has(selectedProvider.id)
    : false
  const customModelInvalid =
    customModelMode && !isCustomModelIdValid(customModel)
  const liveSendDisabled =
    mode === "live" && (!selectedProviderReady || customModelInvalid)
  const providerRef =
    provider && selectedModel ? `${provider}:${selectedModel}` : provider
  const body = React.useCallback(() => {
    return buildPlaygroundBody({
      mode,
      providerRef,
      customModel,
      speed,
    })
  }, [customModel, mode, providerRef, speed])

  const pick = (scenario: Scenario) => {
    setLibraryOpen(false)
    chat.current?.send(scenario.prompt)
  }

  const toolbar = (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden sm:gap-2">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((v) => !v)}
        className="hidden lg:inline-flex"
      >
        <PanelLeftIcon aria-hidden className="size-4" />
        Examples
      </Button>
      <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Examples"
          >
            <ListIcon aria-hidden className="size-4" />
            <span className="sr-only">Examples</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          aria-describedby={undefined}
          side="left"
          className="w-80 max-w-[calc(100%_-_2rem)] gap-4 overflow-hidden p-0 motion-reduce:animate-none motion-reduce:transition-none"
        >
          <SheetHeader className="shrink-0 px-4 pt-6">
            <SheetTitle>Examples</SheetTitle>
          </SheetHeader>
          <PromptLibrary onPick={pick} />
        </SheetContent>
      </Sheet>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {mode === "demo" ? "Demo agent" : "Live model"}
      </span>
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <ToolbarButton
          label="New chat"
          onClick={() => chat.current?.clear()}
          className="hidden sm:inline-flex"
        >
          <RotateCcwIcon aria-hidden className="size-4" />
        </ToolbarButton>
        <Button
          ref={inspectorTrigger}
          variant={inspector ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Spec inspector"
          aria-expanded={inspector}
          onClick={() => setInspector((v) => !v)}
          className="hidden sm:inline-flex"
        >
          <CodeXmlIcon aria-hidden className="size-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label="Playground settings"
            >
              <Settings2Icon aria-hidden className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            aria-describedby={undefined}
            className="w-80 max-w-[calc(100%_-_2rem)] overflow-y-auto overscroll-contain motion-reduce:animate-none motion-reduce:transition-none"
          >
            <SheetHeader>
              <SheetTitle>Playground settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <div className="flex gap-2 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => chat.current?.clear()}
                >
                  New chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setInspector(true)}
                >
                  Inspector
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Agent</p>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as "demo" | "live")}
                >
                  <SelectTrigger aria-label="Agent" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo agent</SelectItem>
                    <SelectItem value="live" disabled={!providers.length}>
                      Live model
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!liveReady ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Choose a provider below and add its API key to enable live
                    requests.
                  </p>
                ) : null}
              </div>
              {mode === "live" ? (
                <ProviderModelSettings
                  providers={providers}
                  configuredProviderIds={configuredProviders}
                  provider={provider}
                  selectedModel={selectedModel}
                  customModel={customModel}
                  customModelMode={customModelMode}
                  onProviderChange={selectProvider}
                  onModelChange={setSelectedModel}
                  onCustomModelChange={setCustomModel}
                  onCustomModelModeChange={setCustomModelMode}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Streaming speed</p>
                  <Select
                    value={String(speed)}
                    onValueChange={(v) => setSpeed(Number(v))}
                  >
                    <SelectTrigger
                      aria-label="Streaming speed"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set([0.4, 1, 3, 8, speed]))
                        .sort((a, b) => a - b)
                        .map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            {v}×
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium">Theme preset</p>
                <Select
                  value={preset}
                  onValueChange={(v) => setPreset(v as PresetId)}
                >
                  <SelectTrigger aria-label="Theme preset" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="size-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                            style={{ backgroundColor: entry.swatch }}
                          />
                          <span>{entry.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  aria-pressed={dark}
                  onClick={() => setTheme(dark ? "light" : "dark")}
                >
                  {dark ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
                  Dark mode
                </Button>
                <Button
                  variant="outline"
                  aria-pressed={rtl}
                  onClick={() => setRtl((v) => !v)}
                >
                  Right-to-left
                </Button>
              </div>
              <ProviderKeyManager
                providers={providers}
                credentials={credentials}
                onRefresh={refreshPlayground}
                selectedProviderId={provider}
                onProviderChange={selectProvider}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )

  return (
    <TooltipProvider delayDuration={250}>
      <div
        data-playground
        className="flex h-[calc(100dvh-var(--header-height)-1px)] min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background"
      >
        {headerSlot
          ? createPortal(toolbar, headerSlot)
          : headerResolved
            ? toolbar
            : null}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {sidebarOpen ? (
            <aside
              className="hidden w-72 min-w-0 shrink-0 border-e border-border/60 bg-muted/10 pt-5 lg:flex lg:flex-col"
              aria-label="Example catalog"
            >
              <h2 className="mb-4 px-4 text-sm font-semibold">Examples</h2>
              <PromptLibrary onPick={pick} />
            </aside>
          ) : null}
          <div
            dir={rtl ? "rtl" : "ltr"}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <FableChat
              api="/api/playground"
              controllerRef={chat}
              body={body}
              title="Answers that look designed"
              description="A scripted agent streams real Fable specs through the AI SDK. Try a prompt, switch presets, toggle dark mode or RTL, and open the inspector to see the spec."
              suggestions={SUGGESTED.slice(0, 4).map((scenario) => ({
                label: scenario.label,
                prompt: scenario.prompt,
              }))}
              images={{ allowedHosts: DEMO_IMAGE_HOSTS }}
              actions={hostActions}
              disabled={liveSendDisabled}
              onMessagesChange={setMessages}
              composerFooter={
                mode === "demo"
                  ? "Demo agent · scripted, no model calls"
                  : `Live · ${
                      providers.find((entry) => entry.id === provider)?.label ??
                      provider
                    } · ${customModel.trim() || selectedModel}`
              }
              debug
            />
          </div>
          {inspector && wide ? (
            <aside
              className="flex w-[min(22rem,28vw)] min-w-72 shrink-0 flex-col border-s border-border/60 bg-background"
              aria-label="Spec inspector"
            >
              <Inspector messages={messages} />
            </aside>
          ) : null}
        </div>
        <Sheet open={inspector && !wide} onOpenChange={setInspector}>
          <SheetContent
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              inspectorTrigger.current?.focus()
            }}
            className="w-full min-w-0 gap-0 overflow-hidden p-0 data-[side=right]:w-full motion-reduce:animate-none motion-reduce:transition-none sm:max-w-md"
          >
            <SheetHeader className="shrink-0 border-b px-4 py-5">
              <SheetTitle>Spec inspector</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              <Inspector messages={messages} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
