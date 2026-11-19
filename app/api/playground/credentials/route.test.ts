import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, GET, POST } from "./route"

const request = (url = "http://localhost/api/playground/credentials", init: RequestInit = {}) =>
  new Request(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
      ...(init.headers ?? {}),
    },
  })

describe("playground credential cookies", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("NODE_ENV", "test")
  })

  it("lists provider metadata without exposing key material", async () => {
    const response = await GET(request())
    const body = await response.json()
    expect(body).toEqual({ credentials: [] })
    expect(JSON.stringify(body)).not.toContain("API_KEY")
  })

  it("stores a key in a strict HttpOnly cookie and returns only a preview", async () => {
    const apiKey = "AIza-test-key-1234"
    const response = await POST(request("http://localhost/api/playground/credentials", {
      method: "POST",
      body: JSON.stringify({ provider: "google", apiKey }),
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ provider: "google", hasKey: true, preview: "AIza-…1234" })
    const cookie = response.headers.get("set-cookie")
    expect(cookie).toContain("fable-ai-key-google=")
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Strict")
    expect(cookie).toContain("Path=/api/playground")
    expect(cookie).not.toContain(apiKey)
  })

  it("rejects cross-origin writes and malformed credentials", async () => {
    expect((await POST(request("http://localhost/api/playground/credentials", {
      method: "POST",
      body: JSON.stringify({ provider: "google", apiKey: "AIza-test-key-1234" }),
      headers: { Origin: "https://evil.example" },
    }))).status).toBe(403)
    expect((await POST(request("http://localhost/api/playground/credentials", {
      method: "POST",
      body: JSON.stringify({ provider: "google", apiKey: "short" }),
    }))).status).toBe(400)
  })

  it("checks the public host when Next supplies an internal request URL", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const save = (origin: string) => POST(request("https://internal.example/api/playground/credentials", {
      method: "POST",
      body: JSON.stringify({ provider: "google", apiKey: "AIza-test-key-1234" }),
      headers: { Host: "fable.example", Origin: origin },
    }))
    expect((await save("https://fable.example")).status).toBe(200)
    expect((await save("https://internal.example")).status).toBe(403)
    expect((await save("http://fable.example")).status).toBe(403)
  })

  it("enforces the body limit even when Content-Length is missing or inaccurate", async () => {
    const body = JSON.stringify({ provider: "google", apiKey: "AIza-test-key-1234", padding: "x".repeat(20_000) })
    const response = await POST(request("http://localhost/api/playground/credentials", {
      method: "POST",
      body,
      headers: { "Content-Length": "1" },
    }))
    expect(response.status).toBe(413)
  })

  it("expires one provider cookie on delete", async () => {
    const response = await DELETE(request("http://localhost/api/playground/credentials?provider=google", { method: "DELETE" }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ provider: "google", hasKey: false, preview: null })
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })

  it("accepts the client key-manager's JSON delete contract", async () => {
    const response = await DELETE(request("http://localhost/api/playground/credentials", {
      method: "DELETE",
      body: JSON.stringify({ provider: "google" }),
    }))
    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("fable-ai-key-google=")
  })

  it("ignores malformed cookies and requires an origin in production", async () => {
    const listed = await GET(new Request("http://localhost/api/playground/credentials", {
      headers: { Cookie: "fable-ai-key-google=%E0%A4%A" },
    })).then((response) => response.json())
    expect(listed).toEqual({ credentials: [] })

    vi.stubEnv("NODE_ENV", "production")
    const response = await POST(new Request("http://localhost/api/playground/credentials", {
      method: "POST",
      body: JSON.stringify({ provider: "google", apiKey: "AIza-test-key-1234" }),
      headers: { "Content-Type": "application/json", Referer: "https://evil.example/settings" },
    }))
    expect(response.status).toBe(403)
  })
})
