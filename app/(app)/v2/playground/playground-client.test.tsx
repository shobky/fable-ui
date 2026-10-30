import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PlaygroundClient } from "./playground-client"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("v2 playground accessibility", () => {
  it("disables skeleton animation for reduced-motion users", () => {
    vi.useFakeTimers()
    const { container } = render(<PlaygroundClient />)
    const skeletons = Array.from(container.querySelectorAll(".animate-pulse"))

    expect(skeletons).toHaveLength(4)
    for (const skeleton of skeletons) {
      expect(skeleton.classList.contains("motion-reduce:animate-none")).toBe(true)
    }
  })
})
