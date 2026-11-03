"use client"

import * as React from "react"
import type { UIMessage } from "ai"
import {
  CheckIcon,
  CodeXmlIcon,
  LanguagesIcon,
  ListIcon,
  MoonIcon,
  PanelRightIcon,
  RotateCcwIcon,
  SunIcon,
  ZapIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

import { FableChat, type FableChatController } from "@/components/fable-ui/chat/fable-chat"
import type { FableHostAction } from "@/components/fable-ui/provider"
import { resolveSpec } from "@/components/fable-ui/resolve"
import { specToMarkdown } from "@/components/fable-ui/to-markdown"
import { isFableToolPart } from "@/components/fable-ui/tool-part"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"
import { PRESETS, type PresetId } from "@/lib/playground/presets"
import { DEMO_IMAGE_HOSTS, SCENARIOS, SUGGESTED, type Scenario } from "@/lib/playground/scenarios"

type Provider = { id: string; label: string; defaultModel: string; isConfigured: boolean; models: string[] }

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

const groups = ["Writing", "Data", "Media", "Forms & drafts", "Layouts"] as const

function PromptLibrary({ onPick, className }: { onPick: (scenario: Scenario) => void; className?: string }) {
  return (
    <nav aria-label="Example prompts" className={cn("space-y-5", className)}>
      {groups.map((group) => {
        const items = SUGGESTED.filter((scenario) => scenario.group === group)
        if (!items.length) return null
        return (
          <div key={group}>
            <p className="mb-1.5 px-2 text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">{group}</p>
            <ul className="space-y-0.5">
              {items.map((scenario) => (
                <li key={scenario.id}>
                  <button
                    type="button"
                    onClick={() => onPick(scenario)}
                    className="group/prompt w-full rounded-lg px-2 py-1.5 text-start transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block text-sm font-medium">{scenario.label}</span>
                    <span className="line-clamp-1 block text-xs text-muted-foreground">{scenario.prompt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function Inspector({ messages }: { messages: UIMessage[] }) {
  const [tab, setTab] = React.useState<"spec" | "markdown">("spec")
  const part = React.useMemo(() => {
    for (const message of [...messages].reverse()) {
      const found = [...message.parts].reverse().find((candidate) => isFableToolPart(candidate))
      if (found) return found as { input?: unknown; state: string }
    }
    return null
  }, [messages])

  if (!part) {
    return <p className="p-4 text-sm text-muted-foreground">The spec of the latest UI answer appears here as it streams.</p>
  }

  const json = JSON.stringify(part.input ?? {}, null, 2)
  const resolved = resolveSpec(part.input, part.state === "input-streaming")
  const blocks = resolved.items.length
  const pending = resolved.items.filter((item) => item.kind === "pending").length

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
      <div className="flex gap-1 border-b border-border px-2 py-1.5">
        {(["spec", "markdown"] as const).map((value) => (
          <Button key={value} size="xs" variant={tab === value ? "secondary" : "ghost"} onClick={() => setTab(value)}>
            {value === "spec" ? `JSON · ${(new Blob([json]).size / 1024).toFixed(1)} KB` : "Markdown fallback"}
          </Button>
        ))}
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[0.6875rem] leading-5 whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">
        {tab === "spec" ? json : specToMarkdown(part.input) || "Available once the spec is complete and valid."}
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
          className={className}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function PlaygroundClient() {
  const chat = React.useRef<FableChatController>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const dark = mounted && resolvedTheme === "dark"
  const [mode, setMode] = React.useState<"demo" | "live">("demo")
  const [speed, setSpeed] = React.useState(1)
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [provider, setProvider] = React.useState<string>("")
  const [preset, setPreset] = React.useState<PresetId>("neutral")
  const [rtl, setRtl] = React.useState(false)
  const [inspector, setInspector] = React.useState(false)
  const [messages, setMessages] = React.useState<UIMessage[]>([])
  const [libraryOpen, setLibraryOpen] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/playground")
      .then((response) => response.json())
      .then((list: Provider[]) => {
        setProviders(list)
        const ready = list.find((entry) => entry.isConfigured)
        setProvider(ready ? `${ready.id}:${ready.defaultModel}` : "")
      })
      .catch(() => setProviders([]))
  }, [])

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
    if (PRESETS.some((entry) => entry.id === presetParam)) setPreset(presetParam as PresetId)
    const speedParam = Number(params.get("speed"))
    if (speedParam > 0 && speedParam <= 8) setSpeed(speedParam)
    if (params.get("rtl") === "1") setRtl(true)
    if (params.get("dark") === "1") setTheme("dark")
    if (params.get("dark") === "0") setTheme("light")
    const scenario = SCENARIOS.find((entry) => entry.id === params.get("run"))
    if (scenario) setTimeout(() => chat.current?.send(scenario.prompt), 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const liveReady = providers.some((entry) => entry.isConfigured)
  const body = React.useCallback(() => {
    const [providerId, model] = provider.split(":")
    return { mode, provider: providerId, model, speed }
  }, [mode, provider, speed])

  const pick = (scenario: Scenario) => {
    setLibraryOpen(false)
    chat.current?.send(scenario.prompt)
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-[calc(100svh-var(--header-height))] min-h-0 w-full min-w-0 flex-col overflow-hidden border-t border-border/60">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-border/60 px-3 py-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
          <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <ListIcon data-icon="inline-start" />
                Prompts
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Example prompts</SheetTitle>
              </SheetHeader>
              <PromptLibrary onPick={pick} className="px-2 pb-6" />
            </SheetContent>
          </Sheet>

          <div role="radiogroup" aria-label="Agent" className="flex rounded-2xl bg-muted p-0.5">
            {(["demo", "live"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                disabled={value === "live" && !liveReady}
                title={value === "live" && !liveReady ? "Add a provider API key to .env.local to enable" : undefined}
                onClick={() => setMode(value)}
                className={cn(
                  "h-7 rounded-[0.875rem] px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
                  mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value === "demo" ? "Demo agent" : "Live model"}
              </button>
            ))}
          </div>

          {mode === "live" ? (
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger size="sm" className="w-48 shrink-0" aria-label="Model">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {providers
                  .filter((entry) => entry.isConfigured)
                  .flatMap((entry) =>
                    entry.models.map((model) => (
                      <SelectItem key={`${entry.id}:${model}`} value={`${entry.id}:${model}`}>
                        {entry.label} · {model}
                      </SelectItem>
                    ))
                  )}
              </SelectContent>
            </Select>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSpeed((value) => (value === 1 ? 3 : value === 3 ? 0.4 : 1))}
                  className="shrink-0 tabular-nums"
                  aria-label={`Streaming speed ${speed}×`}
                >
                  <ZapIcon data-icon="inline-start" />
                  {speed}×
                </Button>
              </TooltipTrigger>
              <TooltipContent>Streaming speed. Slow it down to watch blocks land.</TooltipContent>
            </Tooltip>
          )}

          <div className="ms-auto flex shrink-0 items-center gap-1">
            <div role="radiogroup" aria-label="Theme preset" className="me-1 hidden items-center gap-1 sm:flex">
              {PRESETS.map((entry) => (
                <Tooltip key={entry.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={preset === entry.id}
                      aria-label={entry.label}
                      onClick={() => setPreset(entry.id)}
                      className="relative grid size-7 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full ring-1 ring-foreground/15 transition-[scale] duration-200",
                          preset === entry.id && "scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-background"
                        )}
                        style={{ background: entry.swatch }}
                      >
                        {preset === entry.id ? <CheckIcon className="size-3 text-white" /> : null}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {entry.label} · {entry.note}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <Select value={preset} onValueChange={(value) => setPreset(value as PresetId)}>
              <SelectTrigger size="sm" className="w-28 sm:hidden" aria-label="Theme preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ToolbarButton label={dark ? "Light mode" : "Dark mode"} onClick={() => setTheme(dark ? "light" : "dark")}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </ToolbarButton>
            <ToolbarButton label="Right-to-left" active={rtl} onClick={() => setRtl((value) => !value)}>
              <LanguagesIcon />
            </ToolbarButton>
            <ToolbarButton label="New chat" onClick={() => chat.current?.clear()}>
              <RotateCcwIcon />
            </ToolbarButton>
            <ToolbarButton label="Spec inspector" active={inspector} onClick={() => setInspector((value) => !value)} className="hidden md:inline-flex">
              {inspector ? <PanelRightIcon /> : <CodeXmlIcon />}
            </ToolbarButton>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-e border-border/60 px-2 py-4 lg:block">
            <PromptLibrary onPick={pick} />
          </aside>
          <div dir={rtl ? "rtl" : "ltr"} className="flex min-w-0 flex-1 flex-col">
            <FableChat
              api="/api/playground"
              controllerRef={chat}
              body={body}
              title="Answers that look designed"
              description="A scripted agent streams real Fable specs through the AI SDK. Try a prompt, switch presets, toggle dark mode or RTL, and open the inspector to see the spec."
              suggestions={SUGGESTED.slice(0, 4).map((scenario) => ({ label: scenario.label, prompt: scenario.prompt }))}
              images={{ allowedHosts: DEMO_IMAGE_HOSTS }}
              actions={hostActions}
              onMessagesChange={setMessages}
              composerFooter={mode === "demo" ? "Demo agent · scripted, no model calls" : `Live · ${provider.replace(":", " · ")}`}
              debug
            />
          </div>
          {inspector ? (
            <aside className="hidden w-[22rem] shrink-0 border-s border-border/60 md:flex md:flex-col" aria-label="Spec inspector">
              <Inspector messages={messages} />
            </aside>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )
}
