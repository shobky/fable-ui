import { validateUIMessages, type UIMessage } from "ai"
import { describe, expect, it } from "vitest"

import { fableTools, type FableUIMessage } from "@/lib/fable-ui/tools"
import type { RenderedDataResult } from "@/lib/fable-ui/core"
import {
  getRenderedDataOutputSchema,
  getRenderedDataTool,
  shouldContinueAfterRenderedData,
} from "./get-rendered-data-tool"

const availableOutput: RenderedDataResult = {
  status: "available",
  data: {
    resourceId: "orders",
    title: "Orders",
    entityLabel: "orders",
    scope: "current-view",
    capturedAt: "2026-08-11T12:00:00.000Z",
    query: { page: 1, pageSize: 8 },
    columns: [{ key: "amount", label: "Amount", type: "number" }],
    rows: [{ amount: 42 }],
    totalRows: 1,
    page: 1,
    pageSize: 8,
  },
}

function renderedDataMessage(
  state: "output-available" | "output-error"
): FableUIMessage {
  return {
    id: "assistant-1",
    role: "assistant",
    parts: [
      state === "output-available"
        ? {
            type: "tool-get_rendered_data",
            toolCallId: "call-1",
            state,
            input: { resourceId: "orders" },
            output: availableOutput,
          }
        : {
            type: "tool-get_rendered_data",
            toolCallId: "call-1",
            state,
            input: { resourceId: "orders" },
            errorText: "failed",
          },
    ],
  }
}

describe("get_rendered_data AI SDK integration", () => {
  it("is a client tool and continues only after its successful output", () => {
    expect("execute" in getRenderedDataTool).toBe(false)
    expect(
      shouldContinueAfterRenderedData({
        messages: [renderedDataMessage("output-available")],
      })
    ).toBe(true)
    expect(
      shouldContinueAfterRenderedData({
        messages: [renderedDataMessage("output-error")],
      })
    ).toBe(false)

    const ordinaryToolMessage: UIMessage = {
      id: "assistant-2",
      role: "assistant",
      parts: [
        {
          type: "tool-show_metric",
          toolCallId: "metric-1",
          state: "output-available",
          input: {},
          output: {},
        },
      ],
    }
    expect(
      shouldContinueAfterRenderedData({ messages: [ordinaryToolMessage] })
    ).toBe(false)
  })

  it("validates client-provided output against the active tools", async () => {
    await expect(
      validateUIMessages<FableUIMessage>({
        messages: [renderedDataMessage("output-available")],
        tools: fableTools,
      })
    ).resolves.toHaveLength(1)

    const malformed = structuredClone(
      renderedDataMessage("output-available")
    ) as unknown as Record<string, unknown>
    const parts = malformed.parts as Array<Record<string, unknown>>
    parts[0].output = {
      status: "available",
      data: { resourceId: "orders", rows: [{ secret: { nested: true } }] },
    }

    await expect(
      validateUIMessages<FableUIMessage>({
        messages: [malformed],
        tools: fableTools,
      })
    ).rejects.toThrow()
  })

  it("rejects undeclared row fields and oversized client snapshots", () => {
    expect(
      getRenderedDataOutputSchema.safeParse({
        ...availableOutput,
        data: {
          ...availableOutput.data,
          rows: [{ amount: 42, secret: "hidden" }],
        },
      }).success
    ).toBe(false)

    expect(
      getRenderedDataOutputSchema.safeParse({
        ...availableOutput,
        data: {
          ...availableOutput.data,
          rows: [{ amount: "x".repeat(65 * 1024) }],
        },
      }).success
    ).toBe(false)
  })
})
