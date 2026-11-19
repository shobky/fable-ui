import { indexedDbDatabase } from "@/lib/browser-db/indexed-db"
import { createId, memoryTable, type Table } from "@/lib/browser-db/table"
import type { ProviderId } from "@/lib/ai/models"

/**
 * Bring-your-own-key storage for the playground.
 *
 * Keys are encrypted with AES-GCM under a non-extractable key that lives in
 * the same IndexedDB. That keeps raw keys out of plain storage dumps and
 * extensions that read localStorage; it does not protect against script
 * running on this origin. This foundation is not yet connected to the
 * playground UI or transport; a consumer must explicitly reveal a key.
 */

export type KeyStatus = "untested" | "valid" | "invalid"

export interface StoredKey {
  id: string
  provider: ProviderId
  label: string
  preview: string
  createdAt: number
  lastUsedAt?: number
  status: KeyStatus
  statusMessage?: string
}

interface KeyRow extends StoredKey {
  cipher: ArrayBuffer
  iv: Uint8Array<ArrayBuffer>
}

export interface KeyStore {
  list(): Promise<StoredKey[]>
  add(input: { provider: ProviderId; apiKey: string; label?: string }): Promise<StoredKey>
  reveal(id: string): Promise<string>
  setStatus(id: string, status: KeyStatus, message?: string): Promise<void>
  markUsed(id: string): Promise<void>
  remove(id: string): Promise<void>
  subscribe(listener: () => void): () => void
}

/** "sk-proj-abc…wxyz": enough to recognize a key, not enough to use it. */
export function maskKey(apiKey: string) {
  const key = apiKey.trim()
  if (key.length <= 10) return "•".repeat(Math.max(4, key.length))
  const head = key.slice(0, key.indexOf("-", 3) > 0 && key.indexOf("-", 3) < 8 ? key.indexOf("-", 3) + 1 : 4)
  return `${head}…${key.slice(-4)}`
}

/** The key the playground should use for a provider: the latest valid one, else the latest untested one. */
export function pickKey(keys: StoredKey[], provider: ProviderId) {
  const candidates = keys.filter((key) => key.provider === provider && key.status !== "invalid")
  const score = (key: StoredKey) => (key.status === "valid" ? 1 : 0)
  return candidates.sort((a, b) => score(b) - score(a) || (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt))[0]
}

const strip = ({ cipher: _cipher, iv: _iv, ...key }: KeyRow): StoredKey => key

export function createKeyStore(rows: Table<KeyRow>, cipherKey: () => Promise<CryptoKey>): KeyStore {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  // IndexedDB transactions are atomic per object store, but read-modify-write
  // metadata updates still need serialization. Without this queue, a status
  // update and last-used timestamp written at the same time could overwrite
  // one another with stale row snapshots.
  let writes = Promise.resolve()
  const enqueue = <T>(operation: () => Promise<T>) => {
    const next = writes.then(operation)
    writes = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  const update = async (id: string, patch: Partial<StoredKey>) => {
    const row = await rows.get(id)
    if (!row) return
    await rows.put(id, { ...row, ...patch })
    notify()
  }

  return {
    async list() {
      await writes
      return (await rows.getAll()).map(strip).sort((a, b) => b.createdAt - a.createdAt)
    },
    add({ provider, apiKey, label }) {
      return enqueue(async () => {
        const key = apiKey.trim()
        if (key.length < 8) throw new Error("That does not look like an API key.")
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await cipherKey(), new TextEncoder().encode(key))
        const row: KeyRow = {
          id: createId(),
          provider,
          label: label?.trim().slice(0, 40) || "Personal key",
          preview: maskKey(key),
          createdAt: Date.now(),
          status: "untested",
          cipher,
          iv,
        }
        await rows.put(row.id, row)
        notify()
        return strip(row)
      })
    },
    async reveal(id) {
      await writes
      const row = await rows.get(id)
      if (!row) throw new Error("This key was removed.")
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: row.iv }, await cipherKey(), row.cipher)
      return new TextDecoder().decode(plain)
    },
    setStatus: (id, status, statusMessage) => enqueue(() => update(id, { status, statusMessage })),
    markUsed: (id) => enqueue(() => update(id, { lastUsedAt: Date.now() })),
    remove: (id) => enqueue(async () => {
      await rows.delete(id)
      notify()
    }),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const generateCipherKey = () => crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])

/** For tests: plain memory, one cipher key per store. */
export function createMemoryKeyStore() {
  let key: Promise<CryptoKey> | null = null
  return createKeyStore(memoryTable<KeyRow>(), () => (key ??= generateCipherKey()))
}

let browserStore: KeyStore | null = null

export function browserKeyStore() {
  if (!browserStore) {
    const db = indexedDbDatabase("fable-ui-keys", 1, ["keys", "cipher"])
    let key: Promise<CryptoKey> | null = null
    const cipherKey = () => {
      // An atomic transaction elects one key even when two tabs initialize
      // together. Never overwrite a key another tab already used to encrypt.
      key ??= generateCipherKey()
        .then((candidate) => db.getOrCreate("cipher", "default", candidate))
        .catch((error: unknown) => {
          key = null
          throw error
        })
      return key
    }
    browserStore = createKeyStore(db.table<KeyRow>("keys"), cipherKey)
  }
  return browserStore
}
