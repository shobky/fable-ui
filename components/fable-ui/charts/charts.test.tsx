import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Charts } from "./charts"

vi.mock("recharts", () => {
  function ChartRoot({
    children,
    title,
    desc,
    role,
    "aria-label": ariaLabel,
  }: {
    children?: ReactNode
    title?: string
    desc?: string
    role?: string
    "aria-label"?: string
  }) {
    return (
      <svg aria-label={ariaLabel} role={role ?? "application"}>
        {title ? <title>{title}</title> : null}
        {desc ? <desc>{desc}</desc> : null}
        {children}
      </svg>
    )
  }

  function Container({ children }: { children?: ReactNode }) {
    return <>{children}</>
  }

  function Empty() {
    return null
  }

  return {
    ResponsiveContainer: Container,
    LineChart: ChartRoot,
    BarChart: ChartRoot,
    PieChart: ChartRoot,
    Bar: Empty,
    CartesianGrid: Empty,
    Cell: Empty,
    Legend: Empty,
    Line: Empty,
    Pie: Empty,
    Tooltip: Empty,
    XAxis: Empty,
    YAxis: Empty,
  }
})

afterEach(cleanup)

describe("Charts accessibility states", () => {
  it("gives Cartesian chart roots an accessible name and description", () => {
    render(
      <Charts
        title="Revenue"
        data={[{ month: "January", sales: 1200 }]}
        xKey="month"
        series={[{ key: "sales", label: "Sales" }]}
      />
    )

    const chart = screen.getByRole("application", {
      name: "Revenue line chart",
    })

    expect(chart.querySelector("title")?.textContent).toBe(
      "Revenue line chart"
    )
    expect(chart.querySelector("desc")?.textContent).toBe(
      "Line chart showing Sales by Month."
    )
  })

  it("uses the existing empty state when pie slices are not positive", () => {
    render(
      <Charts
        title="Revenue mix"
        availableChartTypes={["pie"]}
        data={[
          { segment: "North", revenue: 0 },
          { segment: "South", revenue: -25 },
        ]}
        categoryKey="segment"
        valueKey="revenue"
        emptyState={{ title: "No positive revenue" }}
      />
    )

    expect(screen.getByText("No positive revenue")).toBeTruthy()
    expect(screen.queryByRole("application")).toBeNull()
  })

  it("announces chart loading and disables skeleton motion", () => {
    const { container } = render(
      <Charts title="Revenue" data={[]} isLoading />
    )

    expect(screen.getByRole("status").textContent).toContain(
      "Loading chart data"
    )

    for (const skeleton of container.querySelectorAll("[data-slot=skeleton]")) {
      expect(skeleton.className).toContain("motion-reduce:animate-none")
    }
  })
})
