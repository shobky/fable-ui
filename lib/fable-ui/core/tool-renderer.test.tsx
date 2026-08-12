import { cleanup, render, screen } from "@testing-library/react"
import { tool, type DeepPartial } from "ai"
import { afterEach, describe, expect, it } from "vitest"
import { z } from "zod"

import { defineFableComponent } from "@/lib/fable-ui/core/definitions"
import { FableToolPart } from "@/lib/fable-ui/core/tool-renderer"

afterEach(cleanup)

describe("FableToolPart", () => {
  it("announces an unknown tool part as an alert", () => {
    render(
      <FableToolPart part={{ type: "tool-not-installed" }} registry={{}} />
    )

    expect(screen.getByRole("alert").textContent).toContain(
      "Unknown Fable tool part: not-installed"
    )
  })

  it("keeps legacy loading props for input streaming when a renderer has no streaming props", () => {
    const definition = createProbeDefinition()

    render(
      <FableToolPart
        part={{
          type: "tool-probe",
          state: "input-streaming",
          input: { content: "partial" },
        }}
        registry={{ probe: definition }}
      />
    )

    expect(screen.getByTestId("probe").textContent).toBe("loading:")
  })

  it("maps DeepPartial input to streaming props without mounting the ready renderer", () => {
    const definition = createProbeDefinition({
      streamingProps: (input) => {
        const partial = input as DeepPartial<{
          content: string
          nested: { label: string }
        }>

        return { value: partial.content ?? "", state: "streaming" }
      },
    })

    render(
      <FableToolPart
        part={{
          type: "tool-probe",
          state: "input-streaming",
          input: { content: "partial" },
        }}
        registry={{ probe: definition }}
      />
    )

    expect(screen.getByTestId("probe").textContent).toBe("streaming:partial")
  })

  it("passes an output-error part to error props so partial input can remain visible", () => {
    const definition = createProbeDefinition({
      errorProps: (_description, part) => ({
        value: (part?.input as { content?: string } | undefined)?.content ?? "",
        state: "error",
      }),
    })

    render(
      <FableToolPart
        part={{
          type: "tool-probe",
          state: "output-error",
          input: { content: "keep this partial input" },
          errorText: "Request interrupted",
        }}
        registry={{ probe: definition }}
      />
    )

    expect(screen.getByTestId("probe").textContent).toBe(
      "error:keep this partial input"
    )
  })
})

function createProbeDefinition(
  rendererOverrides: Partial<{
    streamingProps: (input: unknown) => { value: string; state: string }
    errorProps: (
      description: string,
      part?: { input?: unknown }
    ) => { value: string; state: string }
  }> = {}
) {
  const schema = z.object({ content: z.string() })

  return defineFableComponent({
    name: "probe",
    schema,
    tool: tool({
      description: "Test tool",
      inputSchema: schema,
      execute: async (input) => input,
    }),
    renderer: {
      Component: ({ value, state }: { value: string; state: string }) => (
        <output data-testid="probe">{`${state}:${value}`}</output>
      ),
      loadingProps: { value: "", state: "loading" },
      emptyProps: { value: "", state: "empty" },
      errorProps: () => ({ value: "", state: "error" }),
      toProps: (data) => ({ value: data.content, state: "ready" }),
      ...rendererOverrides,
    },
  })
}
