import { tool } from "ai"
import { z } from "zod"

import { fableSystemPrompt } from "@/components/fable-ui/prompt"
import { FABLE_TOOL_NAME, fableTool } from "@/components/fable-ui/tool"

import { searchImages } from "./image-library"

/** The live playground agent. The eval runs exactly this configuration. */
export const playgroundTools = {
  [FABLE_TOOL_NAME]: fableTool,
  search_images: tool({
    description: "Find photos for image, gallery, hero, card or article blocks. Returns usable https URLs with alt text.",
    inputSchema: z.object({ query: z.string().min(2).max(120), limit: z.number().int().min(1).max(12).optional() }),
    execute: async ({ query, limit }) => ({ images: searchImages(query, limit ?? 6) }),
  }),
}

export const PLAYGROUND_SYSTEM = [
  "You are the Fable UI playground assistant. Be concise, specific and useful.",
  fableSystemPrompt({
    imageSource: "call search_images first and use only the URLs it returns. If it returns nothing relevant, skip images.",
    hostActions: { "email.send": "sends an email draft; pass to, subject and body" },
  }),
].join("\n\n")
