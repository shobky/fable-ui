const REGISTRY = "https://fable-ui.shobky.com/r"

/**
 * Copy-paste prompts for coding agents. Each one is self-contained: an agent
 * with no prior context can follow it and verify its own work.
 */
export const AGENT_PROMPTS = {
  newApp: {
    title: "New Next.js app with an AI chat",
    description: "Creates a working /fable-chat page that answers with rich UI.",
    prompt: `Set up Fable UI (generative UI blocks for AI chat) in this Next.js app.

1. Check prerequisites and stop to tell me if any fail:
   - Next.js 15+ with the App Router, React 19, Tailwind CSS v4.
   - shadcn/ui is initialized (components.json exists). If not, run \`npx shadcn@latest init\` and accept the defaults.
2. Install the chat starter, which also installs the blocks:
   npx shadcn@latest add ${REGISTRY}/fable-chat.json
   Review every file the CLI wants to overwrite. Do not pass --overwrite for files I already changed.
3. Make headings use the theme's heading font: in the @theme inline block of the global CSS add
   --font-heading: var(--fable-font-heading, var(--font-sans));
   (skip if --font-heading already exists).
4. Model: app/api/fable-chat/route.ts uses @ai-sdk/openai and FABLE_MODEL (default gpt-5.5). If I use another provider, swap the import for the matching @ai-sdk/* package and install it. Add the API key to .env.local (never commit it, never print it).
5. Verify: run the type checker and the dev server, open /fable-chat, ask "Compare three note-taking apps in a table" and confirm a table renders while streaming, and that the console has no errors.
6. Tell me which files were created, which env vars I need, and anything you skipped.`,
  },
  existingChat: {
    title: "Add to an existing AI SDK chat",
    description: "Keeps your chat UI; adds the render_ui tool and renderer.",
    prompt: `Add Fable UI to my existing Vercel AI SDK chat. Keep my chat UI and route; only add what is listed.

1. Install the blocks (no chat UI):
   npx shadcn@latest add ${REGISTRY}/fable-ui.json
2. Server — in the route that calls streamText:
   import { fableSystemPrompt } from "@/components/fable-ui/prompt"
   import { FABLE_TOOL_NAME, fableTool } from "@/components/fable-ui/tool"
   - add \`[FABLE_TOOL_NAME]: fableTool\` to tools (keep my existing tools)
   - append fableSystemPrompt() to my system prompt
   - stop after the UI is shown: stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(5)] (merge with any existing stopWhen)
   - if the route calls validateUIMessages or convertToModelMessages with tools, include the new tool there too
3. Client — where message parts are rendered:
   import { FableProvider, FableToolPart, isFableToolPart } from "@/components/fable-ui"
   - render \`<FableToolPart part={part} />\` when isFableToolPart(part)
   - wrap the message list in <FableProvider onReply={(text) => sendMessage({ text })} readOnly={status === "streaming"}>
4. Images: if the agent has an image source, pass images={{ allowedHosts: ["your-cdn.com"] }} to FableProvider and tell the model where images come from with fableSystemPrompt({ imageSource: "…" }). Otherwise leave both out.
5. Add --font-heading: var(--fable-font-heading, var(--font-sans)); to the @theme inline block if missing.
6. Verify with the type checker, then ask the chat for "a table comparing three databases" and confirm it renders while streaming. Report changed files.`,
  },
  customBlock: {
    title: "Add a custom block",
    description: "Teaches the model a new component, end to end.",
    prompt: `Add a new block type to Fable UI in components/fable-ui. Block: <describe it, e.g. "weather: location, temperature, condition, 5-day forecast">.

Follow the existing pattern exactly:
1. schema.ts — add a zod object with type: z.literal("<name>") and strict bounds on every string and array (.max). Add it to CONTENT_BLOCKS and ALL_CONTENT. Add it to STREAMABLE_BLOCKS only if a partial version is meaningful to show.
2. blocks/<file>.tsx — the component. Use only shadcn tokens (bg-card, text-muted-foreground, ring-border, chart-1..5), the shared \`surface\` class, tabular-nums for numbers, and no hard-coded colors. Images go through FableImg; links through safeLinkUrl.
3. renderer.tsx — add the case to Content().
4. skeleton.tsx — add a skeleton shaped like the block if the default lines look wrong.
5. to-markdown.ts — add the Markdown fallback.
6. prompt.ts — one line in \`guide\` saying when to use it.
7. Add an example to lib/block-examples.ts if it exists, and a test that the example validates.
8. Run the tests and the type checker. Report what you changed.`,
  },
  theme: {
    title: "Match my brand",
    description: "Uses a preset or your shadcn theme.",
    prompt: `Theme Fable UI to match this app.

Fable blocks only use shadcn CSS variables (--background, --card, --primary, --muted, --border, --chart-1…5, --radius) and font-heading.
- If I give you a theme from the shadcn customizer (ui.shadcn.com), paste its :root and .dark variables into the global CSS. Nothing else is needed.
- If I want a preset, run: npx shadcn@latest add ${REGISTRY}/fable-themes.json
  then import the installed CSS file after tailwind in the global CSS and set data-fable-theme="<neutral|cobalt|moss|rose|editorial|midnight>" on <html>.
- Make sure the @theme inline block maps --font-heading: var(--fable-font-heading, var(--font-sans)); and, for the editorial preset, load a serif with next/font as --font-serif.
- Check charts: --chart-1…5 must be distinguishable from each other in light and dark mode.
Verify in light and dark mode and tell me the contrast of --muted-foreground on --background.`,
  },
} as const

export type AgentPromptId = keyof typeof AGENT_PROMPTS
