import { IDBFactory } from "fake-indexeddb"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { indexedDbDatabase } from "./indexed-db"

describe("IndexedDB tables", () => {
  beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()))
  afterEach(() => vi.unstubAllGlobals())

  it("elects the same value when separate connections initialize together", async () => {
    const first = indexedDbDatabase("keys", 1, ["cipher"])
    const second = indexedDbDatabase("keys", 1, ["cipher"])
    const [a, b] = await Promise.all([
      first.getOrCreate("cipher", "default", "key-a"),
      second.getOrCreate("cipher", "default", "key-b"),
    ])
    expect(a).toBe(b)
    expect(await first.table("cipher").get("default")).toBe(a)
    expect(await second.getOrCreate("cipher", "default", "key-c")).toBe(a)
  })

  it("commits table writes and returns cloned values", async () => {
    const db = indexedDbDatabase("workspace", 1, ["chats"])
    const chats = db.table<{ title: string }>("chats")
    const row = { title: "Research" }
    await chats.put("a", row)
    row.title = "Changed"
    expect(await chats.get("a")).toEqual({ title: "Research" })
    await chats.delete("a")
    expect(await chats.get("a")).toBeUndefined()
    await chats.put("b", row)
    await chats.clear()
    expect(await chats.getAll()).toEqual([])
  })
})
