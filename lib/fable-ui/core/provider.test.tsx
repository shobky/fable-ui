import * as React from "react"
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDataBrowserQuery } from "@/components/fable-ui/data-browser/hooks/use-data-browser-query"
import {
  FableDataProvider,
  useFableDataContext,
} from "@/lib/fable-ui/core/provider"
import { DataSourceRegistry } from "@/lib/fable-ui/core/registry"
import type {
  DataQuery,
  DataQueryResult,
  DataRow,
  DataSourceContext,
} from "@/lib/fable-ui/core/types"

afterEach(cleanup)

function createRegistry(
  list: (query: DataQuery) => Promise<DataQueryResult> | DataQueryResult
) {
  return new DataSourceRegistry()
    .registerDriver("test", {
      list: (_resource, query) => list(query),
    })
    .registerResource({
      id: "orders",
      label: "Orders",
      entityLabel: "orders",
      driver: "test",
      source: {},
      columns: [
        { key: "amount", label: "Amount", type: "number", sortable: true },
        { key: "customer", label: "Customer" },
        { key: "secret", label: "Secret", hidden: true },
      ],
      filters: [{ key: "status", label: "Status", type: "text" }],
      sort: [{ key: "amount", label: "Amount" }],
    })
}

function wrapperFor(registry: DataSourceRegistry) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <FableDataProvider registry={registry}>{children}</FableDataProvider>
  }
}

describe("FableDataProvider query cache", () => {
  it("deduplicates canonical queries, retries failures, and supports force refresh", async () => {
    const list = vi
      .fn<(query: DataQuery) => Promise<DataQueryResult>>()
      .mockResolvedValue({ rows: [{ id: "1", amount: 10 }] })
    const registry = createRegistry(list)
    const { result } = renderHook(() => useFableDataContext(), {
      wrapper: wrapperFor(registry),
    })
    const firstQuery = {
      filters: { range: { min: 1, max: 2 }, status: "open" },
      page: 1,
    }
    const equivalentQuery = {
      filters: { status: "open", range: { max: 2, min: 1 } },
      page: 1,
    }

    await Promise.all([
      result.current.listResource("orders", firstQuery),
      result.current.listResource("orders", equivalentQuery),
    ])
    await result.current.listResource("orders", equivalentQuery)
    expect(list).toHaveBeenCalledTimes(1)

    await result.current.listResource("orders", firstQuery, { force: true })
    expect(list).toHaveBeenCalledTimes(2)

    list.mockRejectedValueOnce(new Error("temporary"))
    await expect(
      result.current.listResource("orders", { page: 2 })
    ).rejects.toThrow("temporary")
    list.mockResolvedValueOnce({ rows: [{ id: "2", amount: 20 }] })
    await result.current.listResource("orders", { page: 2 })
    expect(list).toHaveBeenCalledTimes(4)
  })

  it("resets cached results when provider context identity changes", async () => {
    const list = vi
      .fn<(query: DataQuery) => Promise<DataQueryResult>>()
      .mockResolvedValue({ rows: [] })
    const registry = createRegistry(list)
    let provider: ReturnType<typeof useFableDataContext> | undefined

    function Probe() {
      provider = useFableDataContext()
      return null
    }

    const firstContext: DataSourceContext = { tenantId: "one" }
    const secondContext: DataSourceContext = { tenantId: "two" }
    const view = render(
      <FableDataProvider registry={registry} context={firstContext}>
        <Probe />
      </FableDataProvider>
    )

    await provider?.listResource("orders", { page: 1 })
    view.rerender(
      <FableDataProvider registry={registry} context={secondContext}>
        <Probe />
      </FableDataProvider>
    )
    await provider?.listResource("orders", { page: 1 })

    expect(list).toHaveBeenCalledTimes(2)
  })
})

describe("rendered data snapshots", () => {
  it("publishes only the committed visible view and removes it on unmount", async () => {
    const list = vi
      .fn<(query: DataQuery) => Promise<DataQueryResult<DataRow>>>()
      .mockResolvedValue({
        rows: [
          {
            id: "1",
            amount: 42,
            customer: { name: "Visible", internalId: "hidden" },
            secret: "never-share",
          },
        ],
        totalRows: 1,
        page: 1,
        pageSize: 8,
        nextCursor: "private-cursor",
      })
    const registry = createRegistry(list)
    const hook = renderHook(
      () => {
        const context = useFableDataContext()
        const query = useDataBrowserQuery({
          resourceId: "orders",
          title: "Current orders",
          entityLabel: "orders",
          columns: registry.getResource("orders")?.columns ?? [],
          filters: registry.getResource("orders")?.filters,
          sortOptions: registry.getResource("orders")?.sort,
          initialFilters: { status: "open", tenantId: "hidden-constraint" },
          initialSort: { key: "amount", direction: "desc" },
        })
        return { context, query }
      },
      { wrapper: wrapperFor(registry) }
    )

    await waitFor(() => {
      expect(hook.result.current.query.rows).toHaveLength(1)
      expect(hook.result.current.context.getRenderedData("orders").status).toBe(
        "available"
      )
    })

    const snapshot = hook.result.current.context.getRenderedData("orders")
    expect(snapshot).toMatchObject({
      status: "available",
      data: {
        resourceId: "orders",
        query: {
          filters: { status: "open" },
          sort: { key: "amount", direction: "desc" },
        },
        rows: [{ amount: 42, customer: "[object Object]" }],
      },
    })
    expect(JSON.stringify(snapshot)).not.toContain("never-share")
    expect(JSON.stringify(snapshot)).not.toContain("hidden-constraint")
    expect(JSON.stringify(snapshot)).not.toContain("private-cursor")
    expect(list).toHaveBeenCalledTimes(1)

    hook.result.current.context.getRenderedData("orders")
    expect(list).toHaveBeenCalledTimes(1)

    const context = hook.result.current.context
    act(() => hook.unmount())
    expect(context.getRenderedData("orders")).toEqual({
      status: "unavailable",
      resourceId: "orders",
      reason: "not-rendered",
    })
  })

  it("refuses snapshots beyond the visible column limit", () => {
    const registry = createRegistry(() => ({ rows: [] }))
    const { result } = renderHook(() => useFableDataContext(), {
      wrapper: wrapperFor(registry),
    })
    const token = result.current.beginRenderedData("orders")

    result.current.publishRenderedData({
      token,
      resourceId: "orders",
      title: "Orders",
      entityLabel: "orders",
      query: {},
      columns: Array.from({ length: 13 }, (_, index) => ({
        key: `column-${index}`,
        label: `Column ${index}`,
      })),
      filterKeys: [],
      sortKeys: [],
      result: { rows: [] },
    })

    expect(result.current.getRenderedData("orders")).toEqual({
      status: "unavailable",
      resourceId: "orders",
      reason: "too-large",
    })
  })

  it("falls back to another mounted view when the latest view unmounts", () => {
    const registry = createRegistry(() => ({ rows: [] }))
    const { result } = renderHook(() => useFableDataContext(), {
      wrapper: wrapperFor(registry),
    })
    const firstToken = result.current.beginRenderedData("orders")

    result.current.publishRenderedData({
      token: firstToken,
      resourceId: "orders",
      title: "First orders view",
      entityLabel: "orders",
      query: { page: 1 },
      columns: [{ key: "name", label: "Name" }],
      filterKeys: [],
      sortKeys: [],
      result: { rows: [{ name: "First" }] },
    })

    const secondToken = result.current.beginRenderedData("orders")
    result.current.publishRenderedData({
      token: secondToken,
      resourceId: "orders",
      title: "Second orders view",
      entityLabel: "orders",
      query: { page: 2 },
      columns: [{ key: "name", label: "Name" }],
      filterKeys: [],
      sortKeys: [],
      result: { rows: [{ name: "Second" }] },
    })

    expect(result.current.getRenderedData("orders")).toMatchObject({
      status: "available",
      data: { title: "Second orders view" },
    })

    result.current.endRenderedData("orders", secondToken)
    expect(result.current.getRenderedData("orders")).toMatchObject({
      status: "available",
      data: { title: "First orders view" },
    })

    result.current.endRenderedData("orders", firstToken)
    expect(result.current.getRenderedData("orders")).toEqual({
      status: "unavailable",
      resourceId: "orders",
      reason: "not-rendered",
    })
  })
})
