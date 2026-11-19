# Fable UI

Generative UI for your AI agent, built from shadcn/ui components you own.

The model calls one tool, `render_ui`, with a short list of blocks — an article, a sortable table, a chart, a form, an editable email, a gallery. Fable validates each block and renders it while the answer streams.

**[Playground](https://fable-ui.shobky.com/playground)** · **[Docs](https://fable-ui.shobky.com/docs/introduction)** · **[Blocks](https://fable-ui.shobky.com/docs/blocks)**

## Upgrading from v1

V2 replaces the v1 registry with five install targets. Existing apps keep the components that shadcn copied into their source trees. Fresh installs and upgrades should use `fable-renderer` for plain React, `fable-ai` for the AI SDK adapter, `fable-ui` for the combined renderer and adapter, or `fable-chat` for the Next.js starter. `fable-themes` adds optional presets. The legacy `core`, `quickstart`, individual card, Firebase driver, and REST driver registry URLs are retired.

The renderer consumes the V2 block schema. Migrate existing model payloads and host integrations before replacing an installed v1 renderer. Connect your own data sources through host actions or the tools in your chat route.

## Install

New app, complete chat at `/fable-chat`:

```bash
npx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json
```

Existing AI SDK chat, blocks and renderer only:

```bash
npx shadcn@latest add https://fable-ui.shobky.com/r/fable-ui.json
```

Six theme presets (optional; any shadcn theme already works):

```bash
npx shadcn@latest add https://fable-ui.shobky.com/r/fable-themes.json
```

Requires Next.js 15+ (App Router), React 19, Tailwind CSS v4, shadcn/ui and AI SDK 7. Or paste a prompt from [Agent setup](https://fable-ui.shobky.com/docs/agent-setup) into Claude Code, Cursor or Codex and let it install and verify everything.

## Wire it into an existing chat

```ts
// route.ts
import { hasToolCall, stepCountIs, streamText } from "ai"
import { fableSystemPrompt } from "@/components/fable-ui/prompt"
import { FABLE_TOOL_NAME, fableTool } from "@/components/fable-ui/tool"

streamText({
  model,
  system: [yourInstructions, fableSystemPrompt()].join("\n\n"),
  messages: await convertToModelMessages(messages),
  tools: { ...yourTools, [FABLE_TOOL_NAME]: fableTool },
  stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(5)],
})
```

```tsx
// chat.tsx
import { FableProvider, FableToolPart, isFableToolPart } from "@/components/fable-ui"

<FableProvider onReply={(text) => sendMessage({ text })} readOnly={status === "streaming"}>
  {message.parts.map((part, i) => (isFableToolPart(part) ? <FableToolPart key={i} part={part} /> : <YourPart key={i} part={part} />))}
</FableProvider>
```

## The catalog

| Group | Blocks |
| --- | --- |
| Text | `markdown`, `heading`, `callout`, `quote`, `code`, `divider` |
| Data | `metrics`, `table`, `chart` (bar, line, area, pie, donut), `details` |
| Structure | `list` (bullets, steps, timeline), `checklist`, `faq`, `sources` |
| Media | `image`, `gallery` (grid, featured, masonry, carousel), `cards`, `hero` (split, cover, editorial, spotlight), `article` |
| Interactive | `form`, `template`, `email`, `actions`, `file` |
| Layout | `columns`, `section`, `tabs` |

## Why it's safe

- The model writes JSON, never code, HTML or CSS. Every block is bounded and validated on its own.
- Links must be `https`, `http` or `mailto`. Images load only from hosts you allow; others wait for a click.
- Downloads are text files with an allowlisted type and a forced extension. CSV formulas are defused.
- Side effects run only through actions you register, with optional confirmation.

## Evaluation

`pnpm eval openai gpt-6.1-sol` runs the playground agent against 12 prompts and checks UI-vs-text choice, spec validity, block fit, and that image URLs come from the image tool. Reports go to `evals/results/`. Latest runs:

| Model (2026-11-03) | Cases | UI vs text | Renders cleanly | Strict schema | Fitting block | Images from tool | Median |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `openai/gpt-6.1-sol` | 12 | 100% | 100% | 100% | 100% | 100% | 7.6 s |
| `openai/gpt-5.4-mini` | 12 | 100% | 100% | 100% | 100% | 100% | 4.0 s |

Twelve cases is a smoke test, not a benchmark: run it with your model and prompts before relying on it. The first GPT-5.4 mini run scored 83% / 88% / 70% on UI choice, validity and block fit; the prompt rules and bounded repair that fixed it are in `prompt.ts` and `resolve.ts`.

## Develop

```bash
pnpm install
pnpm dev              # site, docs and playground on :3000
pnpm test             # offline: catalog, streaming, safety, renderer
pnpm typecheck && pnpm lint
pnpm registry:build   # public/r/*.json
pnpm registry:check   # every import in each item is declared
pnpm registry:smoke   # installs the registry into a fresh Next.js app (network)
pnpm skill:build      # public/skills/fable-ui.skill
pnpm eval             # live model eval (costs money; needs a key)
```

Playground links: `/playground?run=trip&preset=midnight&dark=1&speed=0.4`.

## License

MIT
