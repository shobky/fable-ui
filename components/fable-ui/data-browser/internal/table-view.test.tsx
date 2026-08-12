import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TableView } from "./table-view"

afterEach(cleanup)

describe("TableView accessibility and bidi behavior", () => {
  it("labels and focuses the scroll region while keeping truncated values available", () => {
    const onViewRow = vi.fn()
    const customerName = "A very long customer name that remains available on hover"

    render(
      <div dir="rtl">
        <TableView
          entityLabel="customers"
          columns={[
            { key: "name", label: "Customer" },
            { key: "orders", label: "Orders", type: "number", align: "right" },
          ]}
          rows={[{ id: "customer-1", name: customerName, orders: 12 }]}
          onViewRow={onViewRow}
        />
      </div>
    )

    const region = screen.getByRole("region", { name: "customers table" })
    const customerCell = screen.getByText(customerName)
    const orderCell = screen.getByText("12")
    const viewHeader = screen.getByRole("columnheader", { name: "View" })

    expect(region.tabIndex).toBe(0)
    region.focus()
    expect(document.activeElement).toBe(region)
    expect(customerCell.getAttribute("title")).toBe(customerName)
    expect(orderCell.getAttribute("title")).toBe("12")
    expect(
      screen.getByRole("columnheader", { name: "Customer" }).className
    ).toContain("text-start")
    expect(
      screen.getByRole("columnheader", { name: "Orders" }).className
    ).toContain("text-end")
    expect(viewHeader.className).toContain("text-end")
    expect(orderCell.closest("td")?.className).toContain("text-end")
    expect(screen.getByRole("button", { name: "View" }).closest("td")?.className).toContain(
      "text-end"
    )
  })
})
