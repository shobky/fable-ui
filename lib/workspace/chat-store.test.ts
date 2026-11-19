import type { UIMessage } from "ai"
import { describe, expect, it, vi } from "vitest"

import { createMemoryChatStore, deriveTitle } from "./chat-store"

const user = (id: string, text: string): UIMessage => ({ id, role: "user", parts: [{ type: "text", text }] })
const assistant = (id: string, text: string): UIMessage => ({ id, role: "assistant", parts: [{ type: "text", text }] })

describe("chat store", () => {
  it("derives the title from the first prompt and keeps a rename", async () => {
    const store = createMemoryChatStore()
    await store.saveChat("a", [user("1", "Plan a  trip\nto Lisbon"), assistant("2", "Sure")])
    expect((await store.listChats())[0]).toMatchObject({ id: "a", title: "Plan a trip to Lisbon", messageCount: 2 })

    await store.renameChat("a", "Lisbon")
    await store.saveChat("a", [user("1", "Plan a trip"), assistant("2", "Sure"), user("3", "More")])
    expect((await store.listChats())[0]).toMatchObject({ title: "Lisbon", messageCount: 3 })
  })

  it("marks a renamed chat as recently updated", async () => {
    vi.useFakeTimers()
    const store = createMemoryChatStore()
    vi.setSystemTime(1000)
    await store.saveChat("a", [user("1", "First")])
    vi.setSystemTime(2000)
    await store.saveChat("b", [user("1", "Second")])
    vi.setSystemTime(3000)
    await store.renameChat("a", "Renamed")

    expect((await store.listChats()).map((chat) => chat.id)).toEqual(["a", "b"])
    vi.useRealTimers()
  })

  it("lists the most recently updated chat first", async () => {
    vi.useFakeTimers()
    const store = createMemoryChatStore()
    vi.setSystemTime(1000)
    await store.saveChat("old", [user("1", "old")])
    vi.setSystemTime(2000)
    await store.saveChat("new", [user("1", "new")])
    vi.setSystemTime(3000)
    await store.saveChat("old", [user("1", "old"), assistant("2", "hi")])
    expect((await store.listChats()).map((chat) => chat.id)).toEqual(["old", "new"])
    vi.useRealTimers()
  })

  it("deletes a chat with its messages", async () => {
    const store = createMemoryChatStore()
    await store.saveChat("a", [user("1", "hi")])
    await store.deleteChat("a")
    expect(await store.listChats()).toEqual([])
    expect(await store.getMessages("a")).toEqual([])
  })

  it("saves and removes answers, and notifies subscribers", async () => {
    const store = createMemoryChatStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    const saved = await store.saveAnswer({ chatId: "a", messageId: "2", title: "Answer", message: assistant("2", "x") })
    expect(await store.listSaved()).toHaveLength(1)
    await store.removeSaved(saved.id)
    expect(await store.listSaved()).toHaveLength(0)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    await store.clearAll()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("returns copies, not live references", async () => {
    const store = createMemoryChatStore()
    const messages = [user("1", "hi")]
    await store.saveChat("a", messages)
    messages.push(user("2", "mutated"))
    expect(await store.getMessages("a")).toHaveLength(1)
  })

  it("falls back to a generic title", () => {
    expect(deriveTitle([])).toBe("New chat")
    expect(deriveTitle([user("1", "x".repeat(100))])).toHaveLength(64)
  })
})
