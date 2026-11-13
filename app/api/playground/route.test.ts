import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createModel, demoAgentResponse, streamText } = vi.hoisted(() => ({
  createModel: vi.fn(),
  demoAgentResponse: vi.fn(() => new Response("demo")),
  streamText: vi.fn(() => ({ toUIMessageStreamResponse: () => new Response("live") })),
}))

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn(async (messages) => messages),
  validateUIMessages: vi.fn(async ({ messages }) => messages),
  hasToolCall: vi.fn(), stepCountIs: vi.fn(), streamText,
}))
vi.mock("@/lib/ai/provider-config", () => ({
  createModel,
  serverReadiness: () => ({ google: true, openai: false }),
}))
vi.mock("@/lib/playground/agent", () => ({ PLAYGROUND_SYSTEM: "test", playgroundTools: {} }))
vi.mock("@/lib/playground/demo-agent", () => ({ demoAgentResponse }))

import { GET, POST } from "./route"

const request = (body: unknown) => new Request("http://localhost/api/playground", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
})

describe("playground provider contract", () => {
  afterEach(() => vi.unstubAllEnvs())
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv("AI_PROVIDER", "google")
    vi.stubEnv("AI_MODEL", "")
  })

  it("keeps the picker response compatible with the shared catalog", async () => {
    const providers = await GET().json()
    expect(providers.find((p: { id: string }) => p.id === "google")).toMatchObject({
      isConfigured: true, models: expect.arrayContaining(["gemini-3.1-pro"]),
    })
    expect(JSON.stringify(providers)).not.toContain("API_KEY")
  })

  it("does not expose server-funded live mode in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const providers = await GET().json()
    expect(providers.every((p: { isConfigured: boolean }) => !p.isConfigured)).toBe(true)
    expect((await POST(request({ mode: "live", messages: [] }))).status).toBe(403)
    expect(createModel).not.toHaveBeenCalled()
    expect(streamText).not.toHaveBeenCalled()
    expect(await (await POST(request({ mode: "demo", messages: [] }))).text()).toBe("demo")
  })

  it("rejects unknown providers, unknown models and missing credentials before model creation", async () => {
    for (const config of [{ provider: "unknown" }, { provider: "google", model: "unknown" }, { provider: "openai" }]) {
      expect((await POST(request({ mode: "live", messages: [], ...config }))).status).toBe(400)
    }
    expect(createModel).not.toHaveBeenCalled()
  })

  it("rejects invalid request shapes without starting a response", async () => {
    for (const body of [null, [], { provider: {} }, { model: 7 }]) {
      expect((await POST(request(body))).status).toBe(400)
    }
    expect(demoAgentResponse).not.toHaveBeenCalled()
    expect(createModel).not.toHaveBeenCalled()
  })

  it("uses the new model factory for a configured development provider", async () => {
    const response = await POST(request({ mode: "live", messages: [], provider: "google" }))
    expect(await response.text()).toBe("live")
    expect(createModel).toHaveBeenCalledWith("google", "gemini-3.1-pro")
  })
})
