import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { FableGrid, FableText, Inline, Section, Stack, Surface } from "./layout"

afterEach(cleanup)

describe("Fable UI 2 layout primitives", () => {
  it("renders without any AI or data provider", () => {
    const { container } = render(
      <Section aria-label="Product comparison">
        <Stack gap={6}>
          <FableText tone="muted">Compare options</FableText>
          <FableGrid columns={3}>
            <Surface variant="outlined" padding={4}>Product A</Surface>
            <Surface variant="outlined" padding={4}>Product B</Surface>
          </FableGrid>
          <Inline gap={2}><span>Filter</span><span>Sort</span></Inline>
        </Stack>
      </Section>
    )
    expect(screen.getByRole("region", { name: "Product comparison" })).toBeTruthy()
    expect(screen.getByText("Product A")).toBeTruthy()
    expect(screen.getByText("Product B")).toBeTruthy()
    expect(container.querySelector('[data-fable-ui="v2-grid"]')?.className).toContain("lg:grid-cols-3")
    expect(container.querySelector('[data-fable-ui="v2-surface"]')?.className).toContain("border-border")
  })

  it("supports ordinary React events and arbitrary content", () => {
    let clicks = 0
    render(<Surface onClick={() => clicks++}><button onClick={() => clicks++}>Open</button></Surface>)
    screen.getByRole("button", { name: "Open" }).click()
    expect(clicks).toBe(2)
  })
})
