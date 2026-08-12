import * as React from "react"
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  FableDataProvider,
  fableRegistry,
  useFableDataContext,
  type DataColumn,
  type DataQuery,
  type DataQueryResult,
  type DataSourceContext,
  DataSourceRegistry,
} from "@/lib/fable-ui/core"
import { useDataBrowserQuery } from "./use-data-browser-query"

type Order = {
  id: string
  name: string
  status?: string
}

const columns: DataColumn[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
]

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, resolve, reject }
}

function createRegistry(
  list: (
    query: DataQuery,
    context: DataSourceContext,
  ) => Promise<DataQueryResult<Order>> | DataQueryResult<Order>,
) {
  return new DataSourceRegistry()
    .registerDriver("test", {
      list: (_resource, query, context) => list(query, context),
    })
    .registerResource({
      id: "orders",
      label: "Orders",
      entityLabel: "orders",
      driver: "test",
      source: {},
      columns,
      filters: [{ key: "status", label: "Status", type: "text" }],
    })
}

function wrapperFor(registry: DataSourceRegistry, context: DataSourceContext = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FableDataProvider registry={registry} context={context}>
        {children}
      </FableDataProvider>
    )
  }
}

function useOrdersQuery(resourceId = "orders") {
  return useDataBrowserQuery<Order>({
    resourceId,
    title: "Orders",
    entityLabel: "orders",
    columns,
    filters: [{ key: "status", label: "Status", type: "text" }],
    pageSize: 8,
  })
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("useDataBrowserQuery scheduling", () => {
  it("starts the initial remote load immediately and keeps local search immediate", async () => {
    const list = vi.spyOn(fableRegistry, "list").mockResolvedValue({
      rows: [{ id: "remote", name: "Remote" }],
    })
    const remote = renderHook(() => useOrdersQuery("direct-orders"))

    expect(list).toHaveBeenCalledTimes(1)
    await flushPromises()
    expect(remote.result.current.rows).toEqual([{ id: "remote", name: "Remote" }])

    const local = renderHook(() =>
      useDataBrowserQuery<Order>({
        columns,
        rows: [
          { id: "ada", name: "Ada" },
          { id: "lin", name: "Lin" },
        ],
      }),
    )

    act(() => {
      local.result.current.setSearch("ada")
    })

    expect(local.result.current.rows).toEqual([{ id: "ada", name: "Ada" }])
    expect(list).toHaveBeenCalledTimes(1)
  })

  it("collapses rapid remote searches and debounces the reset page query", async () => {
    vi.useFakeTimers()
    const list = vi.spyOn(fableRegistry, "list").mockImplementation(async (_resourceId, query = {}) => ({
      rows: [],
      page: query.page,
      pageSize: query.pageSize,
      nextCursor: "page-two",
    }))
    const hook = renderHook(() => useOrdersQuery("direct-orders"))

    expect(list).toHaveBeenCalledTimes(1)
    await flushPromises()

    act(() => {
      hook.result.current.setPage(2)
    })
    expect(list).toHaveBeenCalledTimes(2)

    act(() => {
      hook.result.current.setSearch("a")
    })
    await flushPromises()
    act(() => {
      hook.result.current.setSearch("ada")
    })
    await flushPromises()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(249)
    })
    expect(list).toHaveBeenCalledTimes(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(list).toHaveBeenCalledTimes(3)
    expect(list.mock.calls[2]?.[1]).toMatchObject({
      search: "ada",
      filters: {},
      page: 1,
      pageSize: 8,
    })
    expect(list.mock.calls[2]?.[1]?.cursor).toBeUndefined()
  })

  it("flushes a pending search for filter, page, and refetch updates", async () => {
    vi.useFakeTimers()
    const list = vi.fn(async (query: DataQuery) => ({
      rows: [],
      page: query.page,
      pageSize: query.pageSize,
      nextCursor: "page-two",
    }))
    const registry = createRegistry(list)
    const hook = renderHook(() => useOrdersQuery(), {
      wrapper: wrapperFor(registry),
    })

    expect(list).toHaveBeenCalledTimes(1)
    await flushPromises()

    act(() => {
      hook.result.current.setSearch("filter-search")
    })
    await flushPromises()
    act(() => {
      hook.result.current.setFilter("status", "open")
    })

    expect(list).toHaveBeenCalledTimes(2)
    expect(list.mock.calls[1]?.[0]).toMatchObject({
      search: "filter-search",
      filters: { status: "open" },
      page: 1,
    })
    await flushPromises()

    act(() => {
      hook.result.current.setSearch("page-search")
    })
    await flushPromises()
    act(() => {
      hook.result.current.setPage(2)
    })

    expect(list).toHaveBeenCalledTimes(3)
    expect(list.mock.calls[2]?.[0]).toMatchObject({
      search: "page-search",
      filters: { status: "open" },
      page: 2,
    })
    expect(list.mock.calls[2]?.[0]?.cursor).toBeUndefined()
    await flushPromises()

    act(() => {
      hook.result.current.setSearch("refetch-search")
    })
    await flushPromises()
    act(() => {
      hook.result.current.refetch()
    })

    expect(list).toHaveBeenCalledTimes(4)
    expect(list.mock.calls[3]?.[0]).toMatchObject({
      search: "refetch-search",
      filters: { status: "open" },
      page: 1,
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })
    expect(list).toHaveBeenCalledTimes(4)
  })

  it("does not reuse an old cursor while a debounced search request is still pending", async () => {
    vi.useFakeTimers()
    const pendingSearch = createDeferred<DataQueryResult<Order>>()
    let requestCount = 0
    const list = vi.spyOn(fableRegistry, "list").mockImplementation((_resourceId, query = {}) => {
      requestCount += 1

      if (requestCount === 2) {
        return pendingSearch.promise
      }

      return Promise.resolve({
        rows: [],
        page: query.page,
        pageSize: query.pageSize,
        nextCursor: "old-cursor",
      })
    })
    const hook = renderHook(() => useOrdersQuery("direct-orders"))

    await flushPromises()
    act(() => {
      hook.result.current.setSearch("final")
    })
    await flushPromises()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })
    expect(list).toHaveBeenCalledTimes(2)

    act(() => {
      hook.result.current.setPage(2)
    })

    expect(list).toHaveBeenCalledTimes(3)
    expect(list.mock.calls[2]?.[1]).toMatchObject({
      search: "final",
      page: 2,
    })
    expect(list.mock.calls[2]?.[1]?.cursor).toBeUndefined()
  })

  it("aborts superseded direct requests and keeps AbortError out of visible state", async () => {
    const firstRequest = createDeferred<DataQueryResult<Order>>()
    const abortError = new DOMException("Cancelled", "AbortError")
    let firstSignal: AbortSignal | undefined
    let requestCount = 0
    const list = vi.spyOn(fableRegistry, "list").mockImplementation((_resourceId, _query, context) => {
      requestCount += 1
      const signal = context?.signal

      if (requestCount === 1) {
        firstSignal = signal
        signal?.addEventListener("abort", () => firstRequest.reject(abortError), {
          once: true,
        })
        return firstRequest.promise
      }

      return Promise.reject(abortError)
    })
    const hook = renderHook(() => useOrdersQuery("direct-orders"))

    expect(firstSignal?.aborted).toBe(false)
    act(() => {
      hook.result.current.setFilter("status", "open")
    })

    expect(firstSignal?.aborted).toBe(true)
    await flushPromises()
    expect(list).toHaveBeenCalledTimes(2)
    expect(hook.result.current.error).toBeUndefined()
  })

  it("detaches provider consumers without aborting its shared request", async () => {
    const deferred = createDeferred<DataQueryResult<Order>>()
    const controller = new AbortController()
    let receivedContext: DataSourceContext | undefined
    let provider: ReturnType<typeof useFableDataContext> | undefined
    const list = vi.fn((_query: DataQuery, context: DataSourceContext) => {
      receivedContext = context
      return deferred.promise
    })
    const registry = createRegistry(list)
    const hook = renderHook(
      () => {
        provider = useFableDataContext()
        return useOrdersQuery()
      },
      { wrapper: wrapperFor(registry, { signal: controller.signal }) },
    )

    expect(list).toHaveBeenCalledTimes(1)
    const initialQuery = list.mock.calls[0]?.[0]
    const sharedRequest = provider?.listResource<Order>("orders", initialQuery)
    expect(list).toHaveBeenCalledTimes(1)

    hook.unmount()
    expect(receivedContext?.signal).toBe(controller.signal)
    expect(controller.signal.aborted).toBe(false)

    await act(async () => {
      deferred.resolve({ rows: [{ id: "1", name: "Ada" }] })
      await sharedRequest
    })
    await provider?.listResource<Order>("orders", initialQuery)

    expect(list).toHaveBeenCalledTimes(1)
  })

  it("makes rendered data unavailable while a search waits, then publishes the final query", async () => {
    vi.useFakeTimers()
    let provider: ReturnType<typeof useFableDataContext> | undefined
    const list = vi.fn(async (query: DataQuery) => ({
      rows: [{ id: query.search || "initial", name: query.search || "Initial" }],
      totalRows: 1,
      page: query.page,
      pageSize: query.pageSize,
    }))
    const registry = createRegistry(list)
    const hook = renderHook(
      () => {
        provider = useFableDataContext()
        return useOrdersQuery()
      },
      { wrapper: wrapperFor(registry) },
    )

    await flushPromises()
    expect(provider?.getRenderedData("orders").status).toBe("available")

    act(() => {
      hook.result.current.setSearch("final")
    })
    await flushPromises()

    expect(provider?.getRenderedData("orders")).toEqual({
      status: "unavailable",
      resourceId: "orders",
      reason: "not-rendered",
    })
    expect(hook.result.current.isLoading).toBe(false)
    expect(list).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(2)
    expect(provider?.getRenderedData("orders")).toMatchObject({
      status: "available",
      data: {
        query: {
          search: "final",
          page: 1,
          pageSize: 8,
        },
      },
    })
  })

  it("shows non-abort request failures", async () => {
    vi.spyOn(fableRegistry, "list").mockRejectedValue(new Error("Network unavailable"))
    const hook = renderHook(() => useOrdersQuery("direct-orders"))

    await flushPromises()

    expect(hook.result.current.error?.message).toBe("Network unavailable")
  })

  it("resets pending remote state when rerendered with local rows", async () => {
    const pending = createDeferred<DataQueryResult<Order>>()
    vi.spyOn(fableRegistry, "list").mockReturnValue(pending.promise)
    const initialProps: { resourceId?: string; rows?: Order[] } = {
      resourceId: "direct-orders",
      rows: [],
    }
    const hook = renderHook(
      ({ resourceId, rows }: { resourceId?: string; rows?: Order[] }) =>
        useDataBrowserQuery<Order>({
          resourceId,
          columns,
          rows,
        }),
      {
        initialProps,
      },
    )

    await flushPromises()
    expect(hook.result.current.isLoading).toBe(true)

    hook.rerender({
      resourceId: undefined,
      rows: [{ id: "local", name: "Local" }],
    })
    await flushPromises()

    expect(hook.result.current.rows).toEqual([{ id: "local", name: "Local" }])
    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeUndefined()
  })

  it("clears a failed remote error when rerendered with local rows", async () => {
    vi.spyOn(fableRegistry, "list").mockRejectedValue(new Error("Network unavailable"))
    const initialProps: { resourceId?: string; rows?: Order[] } = {
      resourceId: "direct-orders",
      rows: [],
    }
    const hook = renderHook(
      ({ resourceId, rows }: { resourceId?: string; rows?: Order[] }) =>
        useDataBrowserQuery<Order>({
          resourceId,
          columns,
          rows,
        }),
      {
        initialProps,
      },
    )

    await flushPromises()
    expect(hook.result.current.error?.message).toBe("Network unavailable")

    hook.rerender({
      resourceId: undefined,
      rows: [{ id: "local", name: "Local" }],
    })
    await flushPromises()

    expect(hook.result.current.rows).toEqual([{ id: "local", name: "Local" }])
    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeUndefined()
  })
})
