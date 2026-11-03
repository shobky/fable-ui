import { readUIMessageStream, type UIMessage, type UIMessageChunk } from "ai"
import { describe, expect, it } from "vitest"

import { demoAgentResponse } from "./demo-agent"
import { pickScenario } from "./scenarios"

function userMessage(text: string): UIMessage {
  return { id: "u1", role: "user", parts: [{ type: "text", text }] }
}

async function finalMessage(response: Response) {
  const chunks = response.body!.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream<string, UIMessageChunk>({
      transform(text, controller) {
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") controller.enqueue(JSON.parse(line.slice(6)))
        }
      },
    })
  )
  let last: UIMessage | undefined
  for await (const message of readUIMessageStream({ stream: chunks })) last = message
  return last
}

describe("demo agent", () => {
  it("routes prompts to scenarios", () => {
    expect(pickScenario("Summarize Q3 revenue performance").id).toBe("dashboard")
    expect(pickScenario("Dinner details:\n- Guests: 8").id).toBe("dinner-plan")
    expect(pickScenario("something unrelated").id).toBe("help")
  })

  it("streams the spec through the AI SDK protocol as a render_ui tool call", async () => {
    const response = demoAgentResponse([userMessage("Plan three relaxed days in Lisbon")], undefined, 1000)
    const message = await finalMessage(response)
    const part = message?.parts.find((candidate) => candidate.type === "tool-render_ui") as
      | { state: string; input: { blocks: { type: string }[] } }
      | undefined
    expect(part?.state).toBe("output-available")
    expect(part?.input.blocks[0].type).toBe("hero")
  })
})
