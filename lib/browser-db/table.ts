/**
 * A minimal async key-value table. The workspace and key stores are written
 * against this interface, so they can run on IndexedDB in the browser, on
 * memory in tests, or on a real backend later without touching their logic.
 */
export interface Table<T> {
  get(id: string): Promise<T | undefined>
  getAll(): Promise<T[]>
  put(id: string, value: T): Promise<void>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}

/** In-memory table. Values are structured-cloned, like IndexedDB does. */
export function memoryTable<T>(): Table<T> {
  const rows = new Map<string, T>()
  const clone = <V>(value: V): V => (typeof structuredClone === "function" ? structuredClone(value) : value)
  return {
    get: async (id) => (rows.has(id) ? clone(rows.get(id) as T) : undefined),
    getAll: async () => [...rows.values()].map(clone),
    put: async (id, value) => {
      rows.set(id, clone(value))
    },
    delete: async (id) => {
      rows.delete(id)
    },
    clear: async () => {
      rows.clear()
    },
  }
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
