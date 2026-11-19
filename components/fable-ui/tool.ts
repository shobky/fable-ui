import { tool } from "ai"

import { listIssues, resolveSpec } from "./resolve"
import { createFableToolSchema, type ContentBlockType } from "./schema"

export { FABLE_TOOL_NAME } from "./protocol"

export interface FableToolOptions {
  /** Restrict the catalog. Fewer blocks: shorter schema, better picks. */
  include?: readonly ContentBlockType[]
  description?: string
}

/**
 * The AI SDK tool the model calls to answer with UI. It has no side effects:
 * execute only acknowledges, so the conversation history stays valid and the
 * client renders the (streamed) input.
 *
 *   streamText({ tools: { render_ui: createFableTool() }, stopWhen: hasToolCall("render_ui") })
 */
export function createFableTool(options: FableToolOptions = {}) {
  return tool({
    description:
      options.description ??
      "Show the answer to the user as rich UI built from blocks (text, tables, charts, media, forms, drafts, actions). The user sees it immediately.",
    inputSchema: createFableToolSchema(options.include),
    // Tells the model which blocks were skipped, so a follow-up turn can fix them.
    execute: async (input) => {
      const skipped = listIssues(resolveSpec(input).items).slice(0, 5)
      return { status: "displayed" as const, blocks: input.blocks.length, ...(skipped.length ? { skipped } : {}) }
    },
  })
}

export const fableTool = createFableTool()
