import type { UIMessage } from "ai"

import { indexedDbDatabase } from "@/lib/browser-db/indexed-db"
import { createId, memoryTable, type Table } from "@/lib/browser-db/table"

/**
 * The playground workspace: chats and saved answers.
 *
 * `ChatStore` is the only thing the UI talks to. It is built on two
 * `Table`s, so swapping IndexedDB for a server database means writing a
 * Table backed by fetch — the store logic and the UI stay as they are.
 */

export interface ChatSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  /** Free-form label for where the answers came from, e.g. "Demo agent" or "anthropic · claude-sonnet-5-5". */
  agent?: string
}

export interface SavedAnswer {
  id: string
  chatId: string
  messageId: string
  title: string
  savedAt: number
  /** The prompt that produced the answer, shown as context. */
  prompt?: string
  message: UIMessage
}

export interface ChatStore {
  listChats(): Promise<ChatSummary[]>
  getMessages(chatId: string): Promise<UIMessage[]>
  /** Creates or updates a chat with its full message list. The title is derived from the first prompt unless renamed. */
  saveChat(chatId: string, messages: UIMessage[], meta?: { agent?: string }): Promise<ChatSummary>
  renameChat(chatId: string, title: string): Promise<void>
  deleteChat(chatId: string): Promise<void>
  listSaved(): Promise<SavedAnswer[]>
  saveAnswer(input: Omit<SavedAnswer, "id" | "savedAt">): Promise<SavedAnswer>
  removeSaved(id: string): Promise<void>
  clearAll(): Promise<void>
  /** Called after every write, from this store instance. */
  subscribe(listener: () => void): () => void
}

type ChatRow = ChatSummary & { renamed?: boolean }

const TITLE_MAX = 64

export function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export function deriveTitle(messages: UIMessage[]) {
  const first = messages.find((message) => message.role === "user")
  const text = first ? messageText(first) : ""
  if (!text) return "New chat"
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text
}

export function createChatStore(tables: { chats: Table<ChatRow>; messages: Table<UIMessage[]>; saved: Table<SavedAnswer> }): ChatStore {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const now = () => Date.now()

  return {
    async listChats() {
      const rows = await tables.chats.getAll()
      return rows.sort((a, b) => b.updatedAt - a.updatedAt).map(({ renamed: _renamed, ...summary }) => summary)
    },
    async getMessages(chatId) {
      return (await tables.messages.get(chatId)) ?? []
    },
    async saveChat(chatId, messages, meta) {
      const existing = await tables.chats.get(chatId)
      const time = now()
      const row: ChatRow = {
        id: chatId,
        title: existing?.renamed ? existing.title : deriveTitle(messages),
        renamed: existing?.renamed,
        createdAt: existing?.createdAt ?? time,
        updatedAt: time,
        messageCount: messages.length,
        agent: meta?.agent ?? existing?.agent,
      }
      await tables.messages.put(chatId, messages)
      await tables.chats.put(chatId, row)
      notify()
      const { renamed: _renamed, ...summary } = row
      return summary
    },
    async renameChat(chatId, title) {
      const existing = await tables.chats.get(chatId)
      const clean = title.trim().slice(0, TITLE_MAX)
      if (!existing || !clean) return
      await tables.chats.put(chatId, { ...existing, title: clean, updatedAt: now(), renamed: true })
      notify()
    },
    async deleteChat(chatId) {
      await tables.chats.delete(chatId)
      await tables.messages.delete(chatId)
      notify()
    },
    async listSaved() {
      return (await tables.saved.getAll()).sort((a, b) => b.savedAt - a.savedAt)
    },
    async saveAnswer(input) {
      const saved: SavedAnswer = { ...input, id: createId(), savedAt: now() }
      await tables.saved.put(saved.id, saved)
      notify()
      return saved
    },
    async removeSaved(id) {
      await tables.saved.delete(id)
      notify()
    },
    async clearAll() {
      await Promise.all([tables.chats.clear(), tables.messages.clear(), tables.saved.clear()])
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function createMemoryChatStore() {
  return createChatStore({ chats: memoryTable(), messages: memoryTable(), saved: memoryTable() })
}

let browserStore: ChatStore | null = null

/** The workspace in this browser's IndexedDB. One instance per page. */
export function browserChatStore() {
  if (!browserStore) {
    const db = indexedDbDatabase("fable-ui-workspace", 1, ["chats", "messages", "saved"])
    browserStore = createChatStore({ chats: db.table("chats"), messages: db.table("messages"), saved: db.table("saved") })
  }
  return browserStore
}
