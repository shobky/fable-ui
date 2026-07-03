import type { DataSourceContext } from "@/lib/fable-ui/core"

export type FirestorePathParam =
  | string
  | ((ctx: DataSourceContext) => string | Promise<string>)

export type FirestoreResourceSource = {
  collection: string
  pathParams?: Record<string, FirestorePathParam>
  idField?: string
  requireAuth?: boolean
}

export type FirebaseDriverConfig = {
  db: unknown
}

export type FirestoreSdk = {
  collection: (...args: unknown[]) => unknown
  doc: (...args: unknown[]) => unknown
  getDoc: (ref: unknown) => Promise<unknown>
  getDocs: (query: unknown) => Promise<unknown>
  query: (...args: unknown[]) => unknown
  where: (...args: unknown[]) => unknown
  orderBy: (...args: unknown[]) => unknown
  limit: (count: number) => unknown
  startAfter: (cursor: unknown) => unknown
  updateDoc: (ref: unknown, values: Record<string, unknown>) => Promise<void>
}
