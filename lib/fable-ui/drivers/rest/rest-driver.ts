import type {
  DataActionInput,
  DataActionResult,
  DataQuery,
  DataQueryResult,
  DataRow,
  DataSourceContext,
  DataSourceDriver,
  ResourceConfig,
  ResourceRuntime,
} from "@/lib/fable-ui/core"
import type { RestDriverConfig, RestListResponse, RestResourceSource } from "./rest-driver.types"

function replaceTemplate(value: string, ctx: DataSourceContext) {
  return value.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const replacement = ctx[key]

    if (replacement == null) {
      throw new Error(`Missing REST path parameter "${key}".`)
    }

    return encodeURIComponent(String(replacement))
  })
}

function buildUrl(path: string, baseUrl: string | undefined, ctx: DataSourceContext) {
  const resolvedPath = replaceTemplate(path, ctx)

  if (/^https?:\/\//i.test(resolvedPath)) {
    return new URL(resolvedPath)
  }

  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost")
  return new URL(resolvedPath, base)
}

function appendQuery(url: URL, query: DataQuery) {
  if (query.cursor) {
    url.searchParams.set("cursor", query.cursor)
  }

  if (query.pageSize) {
    url.searchParams.set("pageSize", String(query.pageSize))
  }

  if (query.search) {
    url.searchParams.set("search", query.search)
  }

  if (query.sort) {
    url.searchParams.set("sort", `${query.sort.key}:${query.sort.direction}`)
  }

  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (value == null || value === "") {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(`filter[${key}]`, String(item))
      }
    } else {
      url.searchParams.set(`filter[${key}]`, String(value))
    }
  }
}

async function getHeaders(config: RestDriverConfig, ctx: DataSourceContext) {
  const configuredHeaders =
    typeof config.headers === "function" ? await config.headers(ctx) : (config.headers ?? {})
  const token = await ctx.auth?.getAccessToken?.()

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...configuredHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function assertOk(response: Response) {
  if (response.ok) {
    return
  }

  const body = await readJsonResponse(response)
  const message =
    typeof body === "object" && body && "message" in body
      ? String((body as { message?: unknown }).message)
      : typeof body === "string"
        ? body
        : response.statusText

  if (response.status === 401 || response.status === 403) {
    throw new Error(`REST permission error: ${message}`)
  }

  if (response.status === 404) {
    throw new Error(`REST resource not found: ${message}`)
  }

  if (response.status >= 500) {
    throw new Error(`REST server error: ${message}`)
  }

  throw new Error(`REST request failed: ${message}`)
}

function normalizeListResponse<Row extends DataRow>(
  body: RestListResponse<Row>,
  query: DataQuery,
): DataQueryResult<Row> {
  if (Array.isArray(body)) {
    return {
      rows: body,
      totalRows: body.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? body.length,
    }
  }

  const rows = body.rows ?? body.data ?? []

  return {
    rows,
    totalRows: body.totalRows ?? body.total ?? rows.length,
    page: body.page ?? query.page ?? 1,
    pageSize: body.pageSize ?? query.pageSize ?? rows.length,
    nextCursor: body.nextCursor,
    previousCursor: body.previousCursor,
  }
}

function defaultRowEndpoint(source: RestResourceSource, rowId: string) {
  return source.rowEndpoint ? source.rowEndpoint(rowId) : `${source.endpoint.replace(/\/$/, "")}/${encodeURIComponent(rowId)}`
}

function defaultActionEndpoint(source: RestResourceSource, actionId: string, rowId?: string) {
  if (source.actionEndpoint) {
    return source.actionEndpoint(actionId, rowId)
  }

  const base = rowId ? defaultRowEndpoint(source, rowId) : source.endpoint
  return `${base.replace(/\/$/, "")}/actions/${encodeURIComponent(actionId)}`
}

export function createRestDriver(config: RestDriverConfig = {}): DataSourceDriver<RestResourceSource> {
  return {
    async list<Row extends DataRow>(
      resource: ResourceConfig<RestResourceSource, Row>,
      query: DataQuery,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<Row, RestResourceSource>,
    ) {
      if (runtime?.list) {
        return runtime.list(resource, query, ctx)
      }

      const url = buildUrl(resource.source.endpoint, config.baseUrl, ctx)
      appendQuery(url, query)

      const response = await fetch(url, {
        method: "GET",
        headers: await getHeaders(config, ctx),
        signal: ctx.signal,
      })
      await assertOk(response)

      return normalizeListResponse<Row>((await readJsonResponse(response)) as RestListResponse<Row>, query)
    },

    async get<Row extends DataRow>(
      resource: ResourceConfig<RestResourceSource, Row>,
      rowId: string,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<Row, RestResourceSource>,
    ) {
      if (runtime?.get) {
        return runtime.get(resource, rowId, ctx)
      }

      const url = buildUrl(defaultRowEndpoint(resource.source, rowId), config.baseUrl, ctx)
      const response = await fetch(url, {
        method: "GET",
        headers: await getHeaders(config, ctx),
        signal: ctx.signal,
      })
      await assertOk(response)

      return (await readJsonResponse(response)) as Row
    },

    async executeAction(
      input: DataActionInput,
      resource: ResourceConfig<RestResourceSource>,
      ctx: DataSourceContext,
      runtime?: ResourceRuntime<DataRow, RestResourceSource>,
    ): Promise<DataActionResult> {
      if (runtime?.executeAction) {
        return runtime.executeAction(input, resource, ctx)
      }

      const url = buildUrl(
        defaultActionEndpoint(resource.source, input.actionId, input.rowId),
        config.baseUrl,
        ctx,
      )
      const response = await fetch(url, {
        method: "POST",
        headers: await getHeaders(config, ctx),
        body: JSON.stringify(input.values ?? {}),
        signal: ctx.signal,
      })
      await assertOk(response)

      const body = await readJsonResponse(response)

      if (typeof body === "object" && body && "ok" in body) {
        return body as DataActionResult
      }

      return { ok: true, data: body, invalidate: true }
    },
  }
}
