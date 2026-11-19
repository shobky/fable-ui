import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import * as React from "react"
import { afterEach, expect, it, vi } from "vitest"
import {
  buildPlaygroundBody,
  getConfiguredProviderOptions,
  getProviderModelIds,
  getProviderSelection,
  isCustomModelIdValid,
  PromptLibrary,
  type Provider,
  ProviderModelSettings,
  ProviderKeyManager,
} from "./playground-client"
import { SUGGESTED } from "@/lib/playground/scenarios"

afterEach(() => {
  vi.unstubAllGlobals()
})

it("labels search, filters examples, resets an empty result and sends one selection", () => {
  const pick = vi.fn()
  render(<PromptLibrary onPick={pick} />)
  const search = screen.getByRole("searchbox", { name: "Search examples" })
  expect(screen.getByRole("status").textContent).toContain(
    String(SUGGESTED.length)
  )
  fireEvent.change(search, { target: { value: "no matching example" } })
  expect(screen.getByText("No examples found")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Reset search" }))
  expect(document.activeElement).toBe(search)
  fireEvent.change(search, { target: { value: "comparison" } })
  fireEvent.click(screen.getByRole("button", { name: /Comparison table/ }))
  expect(pick).toHaveBeenCalledExactlyOnceWith(
    SUGGESTED.find((s) => s.id === "table")
  )
})

it("only renders provider credentials that actually have a key and uses the credential API contract", async () => {
  const fetchMock = vi.fn()
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      provider: "google",
      hasKey: true,
      preview: "AIza-…1234",
    }),
  })
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ provider: "google", hasKey: false, preview: null }),
  })
  vi.stubGlobal("fetch", fetchMock)
  const onRefresh = vi.fn(async () => undefined)

  render(
    <ProviderKeyManager
      providers={[
        {
          id: "google",
          label: "Google",
          defaultModel: "gemini-3.1-pro",
          isConfigured: false,
          models: ["gemini-3.1-pro"],
        },
        {
          id: "openai",
          label: "OpenAI",
          defaultModel: "gpt-5.5",
          isConfigured: false,
          models: ["gpt-5.5"],
        },
      ]}
      credentials={[
        { id: "google", label: "Google", hasKey: true, preview: "AIza-…1234" },
        { id: "openai", label: "OpenAI", hasKey: false, preview: null },
      ]}
      onRefresh={onRefresh}
    />
  )

  expect(screen.getAllByText("Google").length).toBeGreaterThan(0)
  expect(screen.queryByText("Saved key")).toBeNull()
  expect(screen.getByText("AIza-…1234")).toBeTruthy()

  fireEvent.change(screen.getByLabelText("API key"), {
    target: { value: "AIza-test-key-1234" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Replace key" }))

  await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce())
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "/api/playground/credentials",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        provider: "google",
        apiKey: "AIza-test-key-1234",
      }),
    })
  )
  expect((screen.getByLabelText("API key") as HTMLInputElement).value).toBe("")

  fireEvent.click(screen.getByRole("button", { name: "Remove" }))
  await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2))
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    "/api/playground/credentials?provider=google",
    { method: "DELETE" }
  )
})

it("clears an unsaved key when the controlled provider changes", async () => {
  const onRefresh = vi.fn(async () => undefined)
  const providers: Provider[] = [
    {
      id: "google",
      label: "Google",
      defaultModel: "gemini-3.1-pro",
      isConfigured: false,
      models: ["gemini-3.1-pro"],
    },
    {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-5.5",
      isConfigured: false,
      models: ["gpt-5.5"],
    },
  ]
  const view = render(
    <ProviderKeyManager
      selectedProviderId="google"
      providers={providers}
      credentials={[]}
      onRefresh={onRefresh}
    />
  )

  const apiKey = () =>
    view.container.querySelector<HTMLInputElement>("#playground-api-key")!
  fireEvent.change(apiKey(), {
    target: { value: "AIza-test-key-1234" },
  })
  expect(apiKey().value).toBe("AIza-test-key-1234")

  view.rerender(
    <ProviderKeyManager
      selectedProviderId="openai"
      providers={providers}
      credentials={[]}
      onRefresh={onRefresh}
    />
  )
  await waitFor(() => expect(apiKey().value).toBe(""))
})

it("keeps provider refs intact and bounds custom model IDs", () => {
  expect(
    buildPlaygroundBody({
      mode: "live",
      providerRef: "openrouter:vendor/model:variant",
      customModel: "",
      speed: 1,
    })
  ).toEqual({
    mode: "live",
    provider: "openrouter",
    model: "vendor/model:variant",
    speed: 1,
  })

  const body = buildPlaygroundBody({
    mode: "live",
    providerRef: "openai:gpt-5.5",
    customModel: "x".repeat(200),
    speed: 1,
  })
  expect(body.model).toHaveLength(128)
})

it("scopes model choices to the selected configured provider", () => {
  const providers: Provider[] = [
    {
      id: "anthropic",
      label: "Anthropic",
      defaultModel: "claude-sonnet-5-5",
      isConfigured: true,
      models: ["claude-opus-5-5", "claude-sonnet-5-5"],
    },
    {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-6.2-sol",
      isConfigured: true,
      models: ["gpt-6.2-astra", "gpt-6.2-sol"],
    },
  ]

  expect(getConfiguredProviderOptions(providers, new Set())).toEqual(providers)
  expect(getProviderModelIds(providers, "anthropic")).toEqual([
    "claude-opus-5-5",
    "claude-sonnet-5-5",
  ])
  expect(getProviderModelIds(providers, "anthropic")).not.toContain(
    "gpt-6.2-sol"
  )
  expect(getProviderModelIds(providers, "openai")).toEqual([
    "gpt-6.2-astra",
    "gpt-6.2-sol",
  ])
})

it("resets the model and custom ID when changing provider", () => {
  const providers: Provider[] = [
    {
      id: "anthropic",
      label: "Anthropic",
      defaultModel: "claude-sonnet-5-5",
      isConfigured: true,
      models: ["claude-sonnet-5-5"],
    },
    {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-6.2-sol",
      isConfigured: true,
      models: ["gpt-6.2-sol"],
    },
  ]

  expect(getProviderSelection(providers, "openai")).toEqual({
    providerId: "openai",
    model: "gpt-6.2-sol",
    customModel: "",
  })
})

it("keeps the provider-first picker scoped when switching to a custom model", async () => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  })
  const providers: Provider[] = [
    {
      id: "anthropic",
      label: "Anthropic",
      defaultModel: "claude-sonnet-5-5",
      isConfigured: true,
      models: ["claude-opus-5-5", "claude-sonnet-5-5"],
    },
    {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-6.2-sol",
      isConfigured: true,
      models: ["gpt-6.2-astra", "gpt-6.2-sol"],
    },
  ]

  function PickerHarness() {
    const [provider, setProvider] = React.useState("anthropic")
    const [selectedModel, setSelectedModel] =
      React.useState("claude-sonnet-5-5")
    const [customModel, setCustomModel] = React.useState("")
    const [customModelMode, setCustomModelMode] = React.useState(false)
    return (
      <ProviderModelSettings
        providers={providers}
        configuredProviderIds={new Set(["anthropic", "openai"])}
        provider={provider}
        selectedModel={selectedModel}
        customModel={customModel}
        customModelMode={customModelMode}
        onProviderChange={(providerId) => {
          const next = getProviderSelection(providers, providerId)
          setProvider(next.providerId)
          setSelectedModel(next.model)
          setCustomModel(next.customModel)
          setCustomModelMode(false)
        }}
        onModelChange={setSelectedModel}
        onCustomModelChange={setCustomModel}
        onCustomModelModeChange={setCustomModelMode}
      />
    )
  }

  render(<PickerHarness />)
  fireEvent.click(screen.getByRole("combobox", { name: "Provider" }))
  fireEvent.click(screen.getByRole("option", { name: /OpenAI/ }))
  await waitFor(() =>
    expect(
      screen.getByRole("combobox", { name: "Model" }).textContent
    ).toContain("gpt-6.2-sol")
  )
  expect(
    screen.getByRole("combobox", { name: "Model" }).textContent
  ).not.toContain("claude")

  fireEvent.click(screen.getByRole("combobox", { name: "Model" }))
  fireEvent.click(screen.getByRole("option", { name: /Custom model ID/ }))
  const customInput = screen.getByLabelText("Custom model id")
  fireEvent.change(customInput, { target: { value: "openai/my-model" } })
  expect(isCustomModelIdValid("openai/my-model")).toBe(true)

  fireEvent.click(screen.getByRole("combobox", { name: "Provider" }))
  fireEvent.click(screen.getByRole("option", { name: /Anthropic/ }))
  await waitFor(() =>
    expect(screen.queryByLabelText("Custom model id")).toBeNull()
  )
  expect(screen.getByRole("combobox", { name: "Model" }).textContent).toContain(
    "claude-sonnet-5-5"
  )
})
