import { describe, expect, it, vi } from "vitest"

import { createMemoryKeyStore, maskKey, pickKey } from "./key-store"

describe("BYOK key store", () => {
  it("encrypts keys, returns metadata, and reveals only through the store", async () => {
    const store = createMemoryKeyStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    const saved = await store.add({ provider: "openai", apiKey: "  sk-proj-secret-1234  ", label: "  Work key  " })

    expect(saved).toMatchObject({
      provider: "openai",
      label: "Work key",
      preview: "sk-proj-…1234",
      status: "untested",
    })
    expect(saved).not.toHaveProperty("cipher")
    expect(await store.reveal(saved.id)).toBe("sk-proj-secret-1234")
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    await store.remove(saved.id)
    expect(listener).toHaveBeenCalledTimes(1)
    await expect(store.reveal(saved.id)).rejects.toThrow("This key was removed")
  })

  it("serializes metadata updates so concurrent writes keep both fields", async () => {
    const store = createMemoryKeyStore()
    const saved = await store.add({ provider: "anthropic", apiKey: "sk-ant-secret" })

    await Promise.all([store.setStatus(saved.id, "valid"), store.markUsed(saved.id)])

    expect((await store.list())[0]).toMatchObject({ status: "valid" })
    expect((await store.list())[0]?.lastUsedAt).toEqual(expect.any(Number))
  })

  it("rejects short keys and skips invalid keys when choosing one", async () => {
    const store = createMemoryKeyStore()
    await expect(store.add({ provider: "openai", apiKey: "short" })).rejects.toThrow("does not look")

    const keys = [
      { id: "old", provider: "openai" as const, label: "Old", preview: "…", createdAt: 10, status: "valid" as const },
      { id: "new", provider: "openai" as const, label: "New", preview: "…", createdAt: 20, status: "invalid" as const },
      { id: "other", provider: "google" as const, label: "Other", preview: "…", createdAt: 30, status: "valid" as const },
    ]
    expect(pickKey(keys, "openai")?.id).toBe("old")
  })

  it("masks short and provider-prefixed keys without exposing the whole value", () => {
    expect(maskKey("12345678")).toBe("••••••••")
    expect(maskKey("sk-proj-abcdefghijklmnop")).toBe("sk-proj-…mnop")
  })
})
