import type { Table } from "./table"

/**
 * One IndexedDB database with out-of-line keyed object stores. Opening is
 * lazy and shared, so constructing a table never touches the browser API
 * (safe during SSR).
 */
export function indexedDbDatabase(name: string, version: number, stores: readonly string[]) {
  let opening: Promise<IDBDatabase> | null = null

  const open = () => {
    if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is not available in this environment."))
    opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, version)
      let abandoned = false
      request.onupgradeneeded = () => {
        for (const store of stores) {
          if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store)
        }
      }
      request.onsuccess = () => {
        const db = request.result
        if (abandoned) {
          db.close()
          return
        }
        // Another tab upgraded the schema: let it, and reopen on next use.
        db.onversionchange = () => {
          db.close()
          opening = null
        }
        resolve(db)
      }
      request.onerror = () => {
        opening = null
        reject(request.error)
      }
      request.onblocked = () => {
        // A blocked open can otherwise leave every later operation sharing a
        // permanently rejected promise. Let a later call retry after the
        // caller has closed the other tab/connection.
        opening = null
        abandoned = true
        reject(new Error(`IndexedDB "${name}" is blocked by another tab.`))
      }
    })
    return opening
  }

  const run = async <R>(store: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<R>) => {
    const db = await open()
    return new Promise<R>((resolve, reject) => {
      const transaction = db.transaction(store, mode)
      const request = action(transaction.objectStore(store))
      let result: R
      request.onsuccess = () => {
        result = request.result
      }
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error ?? request.error)
      transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."))
    })
  }

  return {
    /** Atomic across connections/tabs. Compute expensive candidates before the transaction. */
    async getOrCreate<T>(store: string, id: string, candidate: T): Promise<T> {
      if (!stores.includes(store)) throw new Error(`Unknown store "${store}" in ${name}.`)
      const db = await open()
      return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, "readwrite")
        const objectStore = transaction.objectStore(store)
        const request = objectStore.get(id)
        let result: T
        request.onsuccess = () => {
          result = request.result === undefined ? candidate : request.result as T
          if (request.result === undefined) objectStore.put(candidate, id)
        }
        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () => reject(transaction.error ?? request.error)
        transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."))
      })
    },
    table<T>(store: string): Table<T> {
      if (!stores.includes(store)) throw new Error(`Unknown store "${store}" in ${name}.`)
      return {
        get: (id) => run<T | undefined>(store, "readonly", (s) => s.get(id)),
        getAll: () => run<T[]>(store, "readonly", (s) => s.getAll()),
        put: async (id, value) => {
          await run(store, "readwrite", (s) => s.put(value, id))
        },
        delete: async (id) => {
          await run(store, "readwrite", (s) => s.delete(id))
        },
        clear: async () => {
          await run(store, "readwrite", (s) => s.clear())
        },
      }
    },
  }
}
