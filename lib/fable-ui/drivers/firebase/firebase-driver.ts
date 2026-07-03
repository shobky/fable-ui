import {
  getDataValue,
  queryLocalRows,
  type DataActionInput,
  type DataActionResult,
  type DataFilter,
  type DataQuery,
  type DataQueryResult,
  type DataRow,
  type DataSourceContext,
  type DataSourceDriver,
  type ResourceConfig,
  type ResourceRuntime,
} from "@/lib/fable-ui/core"
import type {
  FirebaseDriverConfig,
  FirestorePathParam,
  FirestoreResourceSource,
  FirestoreSdk,
} from "./firebase-driver.types"

async function loadFirestoreSdk(): Promise<FirestoreSdk> {
  const moduleName = "firebase/firestore"
  return (await import(moduleName)) as FirestoreSdk
}

function mapFirestoreError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : ""

  if (/permission-denied|permission|forbidden/i.test(`${code} ${message}`)) {
    return new Error("Firestore permission denied. Check authentication and security rules.")
  }

  if (/failed-precondition|index/i.test(`${code} ${message}`)) {
    return new Error("Firestore query requires an index. Check the Firebase console index suggestion.")
  }

  if (/invalid-argument|invalid/i.test(`${code} ${message}`)) {
    return new Error(`Firestore query is invalid: ${message}`)
  }

  return error instanceof Error ? error : new Error("Firestore request failed.")
}

function assertSafePathParam(key: string, value: string) {
  if (!value || value.includes("/") || value.includes("..")) {
    throw new Error(`Invalid Firestore path parameter "${key}".`)
  }

  return value
}

async function resolvePathParam(key: string, param: FirestorePathParam, ctx: DataSourceContext) {
  const value = typeof param === "function" ? await param(ctx) : param
  return assertSafePathParam(key, String(value))
}

async function resolveCollectionPath(source: FirestoreResourceSource, ctx: DataSourceContext) {
  const params: Record<string, string> = {}

  if (ctx.orgId) {
    params.orgId = assertSafePathParam("orgId", String(ctx.orgId))
  }

  if (ctx.tenantId) {
    params.tenantId = assertSafePathParam("tenantId", String(ctx.tenantId))
  }

  for (const [key, param] of Object.entries(source.pathParams ?? {})) {
    params[key] = await resolvePathParam(key, param, ctx)
  }

  return source.collection.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const value = params[key]

    if (!value) {
      throw new Error(`Missing Firestore path parameter "${key}".`)
    }

    return value
  })
}

function assertAllowedFilter(
  resource: Pick<ResourceConfig<FirestoreResourceSource>, "id" | "filters">,
  key: string,
) {
  const allowed = new Set((resource.filters ?? []).map((filter) => filter.key))

  if (allowed.size > 0 && !allowed.has(key)) {
    throw new Error(`Filter "${key}" is not allowed for resource "${resource.id}".`)
  }
}

function assertAllowedSort(
  resource: Pick<ResourceConfig<FirestoreResourceSource>, "id" | "sort">,
  key: string,
) {
  const allowed = new Set((resource.sort ?? []).map((sort) => sort.key))

  if (allowed.size > 0 && !allowed.has(key)) {
    throw new Error(`Sort "${key}" is not allowed for resource "${resource.id}".`)
  }
}

function getFilterConfig(resource: Pick<ResourceConfig<FirestoreResourceSource>, "filters">, key: string) {
  return (resource.filters ?? []).find((filter) => filter.key === key)
}

function getDatePresetRange(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (value === "today") {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (value === "yesterday") {
    start.setDate(start.getDate() - 1)
    start.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - 1)
    end.setHours(23, 59, 59, 999)
  } else if (value === "this_week") {
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (value === "this_month") {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else {
    return null
  }

  return { start, end }
}

function appendFilterConstraint(
  sdk: FirestoreSdk,
  constraints: unknown[],
  resource: Pick<ResourceConfig<FirestoreResourceSource>, "id" | "filters">,
  key: string,
  value: unknown,
) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return
  }

  assertAllowedFilter(resource, key)
  const filter = getFilterConfig(resource, key)
  const datePreset = filter?.type === "date-preset" ? getDatePresetRange(value) : null

  if (datePreset) {
    constraints.push(sdk.where(key, ">=", datePreset.start))
    constraints.push(sdk.where(key, "<=", datePreset.end))
    return
  }

  if (Array.isArray(value)) {
    constraints.push(sdk.where(key, "in", value.slice(0, 10)))
    return
  }

  constraints.push(sdk.where(key, "==", value))
}

function appendSearchConstraints(
  sdk: FirestoreSdk,
  constraints: unknown[],
  resource: Pick<ResourceConfig<FirestoreResourceSource>, "search">,
  query: DataQuery,
) {
  const search = query.search?.trim()

  if (!search || resource.search?.mode === "client") {
    return
  }

  const field = resource.search?.fields?.[0]

  if (!field) {
    return
  }

  if (resource.search?.mode === "prefix") {
    constraints.push(sdk.where(field, ">=", search))
    constraints.push(sdk.where(field, "<", `${search}\uf8ff`))
    return
  }

  constraints.push(sdk.where(field, "==", search))
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nextValue]) => [
        key,
        serializeFirestoreValue(nextValue),
      ]),
    )
  }

  return value
}

function docToRow<Row extends DataRow>(docSnapshot: unknown, idField = "id") {
  const doc = docSnapshot as {
    id: string
    data: () => Record<string, unknown>
  }
  const data = serializeFirestoreValue(doc.data()) as Row

  return {
    ...data,
    [idField]: (data as DataRow)[idField] ?? doc.id,
    id: (data as DataRow).id ?? doc.id,
  } as Row
}

function getDocsFromSnapshot<Row extends DataRow>(snapshot: unknown, idField?: string) {
  const docs = (snapshot as { docs?: unknown[] }).docs ?? []
  return docs.map((doc) => docToRow<Row>(doc, idField))
}

function applyClientSearch<Row extends DataRow>(
  rows: Row[],
  resource: ResourceConfig<FirestoreResourceSource, Row>,
  query: DataQuery,
): DataQueryResult<Row> {
  if (resource.search?.mode !== "client" || !query.search) {
    return {
      rows,
      totalRows: rows.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? rows.length,
    }
  }

  return queryLocalRows(rows, query, resource.columns)
}

function getUpdateValues(input: DataActionInput) {
  const values = input.values ?? {}

  if (typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Firestore update action values must be an object.")
  }

  return values
}

export function createFirebaseDriver({ db }: FirebaseDriverConfig): DataSourceDriver<FirestoreResourceSource> {
  return {
    async list<Row extends DataRow>(
      resource: ResourceConfig<FirestoreResourceSource, Row>,
      query: DataQuery,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<Row, FirestoreResourceSource>,
    ) {
      if (runtime?.list) {
        return runtime.list(resource, query, ctx)
      }

      if (resource.source.requireAuth !== false && !ctx.auth?.userId) {
        throw new Error("Firestore resource requires an authenticated user.")
      }

      try {
        const sdk = await loadFirestoreSdk()
        const collectionPath = await resolveCollectionPath(resource.source, ctx)
        const constraints: unknown[] = []

        for (const [key, value] of Object.entries(query.filters ?? {})) {
          appendFilterConstraint(sdk, constraints, resource, key, value)
        }

        appendSearchConstraints(sdk, constraints, resource, query)

        if (query.sort) {
          assertAllowedSort(resource, query.sort.key)
          constraints.push(sdk.orderBy(query.sort.key, query.sort.direction))
        }

        if (query.cursor) {
          constraints.push(sdk.startAfter(query.cursor))
        }

        if (query.pageSize) {
          constraints.push(sdk.limit(query.pageSize))
        }

        const collectionRef = sdk.collection(db, collectionPath)
        const firestoreQuery = constraints.length > 0 ? sdk.query(collectionRef, ...constraints) : collectionRef
        const snapshot = await sdk.getDocs(firestoreQuery)
        const rows = getDocsFromSnapshot<Row>(snapshot, resource.source.idField)
        const result = applyClientSearch(rows, resource, query)

        return {
          ...result,
          nextCursor: rows.length === query.pageSize ? String(getDataValue(rows[rows.length - 1], "id")) : undefined,
        }
      } catch (error) {
        throw mapFirestoreError(error)
      }
    },

    async get<Row extends DataRow>(
      resource: ResourceConfig<FirestoreResourceSource, Row>,
      rowId: string,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<Row, FirestoreResourceSource>,
    ) {
      if (runtime?.get) {
        return runtime.get(resource, rowId, ctx)
      }

      if (resource.source.requireAuth !== false && !ctx.auth?.userId) {
        throw new Error("Firestore resource requires an authenticated user.")
      }

      try {
        const sdk = await loadFirestoreSdk()
        const collectionPath = await resolveCollectionPath(resource.source, ctx)
        const ref = sdk.doc(db, collectionPath, assertSafePathParam("rowId", rowId))
        const snapshot = await sdk.getDoc(ref)

        if (!(snapshot as { exists?: () => boolean }).exists?.()) {
          return null
        }

        return docToRow<Row>(snapshot, resource.source.idField)
      } catch (error) {
        throw mapFirestoreError(error)
      }
    },

    async executeAction(
      input: DataActionInput,
      resource: ResourceConfig<FirestoreResourceSource>,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<DataRow, FirestoreResourceSource>,
    ): Promise<DataActionResult> {
      if (runtime?.executeAction) {
        return runtime.executeAction(input, resource, ctx)
      }

      const action = resource.actions?.find((candidate) => candidate.id === input.actionId)

      if (!action) {
        throw new Error(`Action "${input.actionId}" is not allowed for resource "${resource.id}".`)
      }

      if (!input.rowId) {
        throw new Error("Firestore update actions require a row id.")
      }

      if (action.variant === "destructive") {
        throw new Error("Destructive Firestore actions require a custom resource runtime handler.")
      }

      if (resource.source.requireAuth !== false && !ctx.auth?.userId) {
        throw new Error("Firestore resource requires an authenticated user.")
      }

      try {
        const sdk = await loadFirestoreSdk()
        const collectionPath = await resolveCollectionPath(resource.source, ctx)
        const ref = sdk.doc(db, collectionPath, assertSafePathParam("rowId", input.rowId))
        await sdk.updateDoc(ref, getUpdateValues(input))

        return {
          ok: true,
          message: `${action.label} completed.`,
          invalidate: true,
        }
      } catch (error) {
        throw mapFirestoreError(error)
      }
    },
  }
}
