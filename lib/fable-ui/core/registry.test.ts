import { describe, expect, it, vi } from "vitest"

import { DataSourceRegistry } from "./registry"
import type {
  DataQueryResult,
  DataRow,
  DataSourceDriver,
  ResourceConfig,
} from "./types"

type TestRow = DataRow & {
  name: string
}

type ResultWithMetadata = DataQueryResult<TestRow> & {
  source: string
}

function createResult(source: string): ResultWithMetadata {
  return {
    rows: [{ id: "one", name: "Ada" }],
    columns: [{ key: "name", label: "Name" }],
    totalRows: 4,
    page: 2,
    pageSize: 1,
    nextCursor: "next",
    previousCursor: "previous",
    source,
  }
}

describe("DataSourceRegistry list transforms", () => {
  it.each(["runtime", "driver"] as const)(
    "transforms %s rows once without dropping result metadata",
    async (path) => {
      const transformRows = vi.fn((rows: TestRow[]) =>
        rows.map((row) => ({ ...row, name: row.name.toUpperCase() }))
      )
      const driverList = vi.fn(() => createResult("driver"))
      const runtimeList = vi.fn(() => createResult("runtime"))
      const registry = new DataSourceRegistry()
        .registerDriver("test", { list: driverList })
        .registerResource({
          id: "people",
          label: "People",
          entityLabel: "people",
          driver: "test",
          source: {},
          columns: [{ key: "name", label: "Name" }],
          transformRows,
        })

      if (path === "runtime") {
        registry.registerResourceRuntime("people", { list: runtimeList })
      }

      const result = await registry.list<TestRow>("people", { page: 2 })

      expect(transformRows).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        rows: [{ id: "one", name: "ADA" }],
        columns: [{ key: "name", label: "Name" }],
        totalRows: 4,
        page: 2,
        pageSize: 1,
        nextCursor: "next",
        previousCursor: "previous",
        source: path,
      })
      expect(driverList).toHaveBeenCalledTimes(path === "driver" ? 1 : 0)
      expect(runtimeList).toHaveBeenCalledTimes(path === "runtime" ? 1 : 0)
    }
  )

  it("preserves typed drivers and resources across registry storage", async () => {
    type OrdersSource = { collection: string }
    type Order = DataRow & { total: number }

    const driver: DataSourceDriver<OrdersSource, Order> = {
      list: (resource) => ({
        rows: [{ id: "order-1", total: resource.source.collection.length }],
      }),
    }
    const resource: ResourceConfig<OrdersSource, Order> = {
      id: "orders",
      label: "Orders",
      entityLabel: "orders",
      driver: "orders",
      source: { collection: "orders" },
      columns: [{ key: "total", label: "Total" }],
    }
    const registry = new DataSourceRegistry()
      .registerDriver("orders", driver)
      .registerResource(resource)

    expect(
      registry.getResource<OrdersSource, Order>("orders")?.source.collection
    ).toBe("orders")
    await expect(registry.list<Order>("orders")).resolves.toMatchObject({
      rows: [{ id: "order-1", total: 6 }],
    })
  })
})
