---
name: fable-ui
description: Install, wire, theme and extend Fable UI — generative UI blocks (articles, tables, charts, forms, editable drafts, galleries) that an AI agent streams through one AI SDK tool, rendered with shadcn/ui in a Next.js app. Use when the user asks to add Fable UI, rich/generative UI to an AI chat, a render_ui tool, Fable themes, or a custom Fable block.
---

# Fable UI

Fable UI is a copy-and-own shadcn registry. The model calls one tool, `render_ui`, with a list of blocks; `FableRenderer` validates each block and renders it while the tool input streams.

Registry: `https://fable-ui.shobky.com/r/<item>.json`

| Item | Installs |
| --- | --- |
| `fable-chat` | Chat page `app/fable-chat/page.tsx`, route `app/api/fable-chat/route.ts`, `components/fable-ui/chat/*`, and `fable-ui` |
| `fable-ui` | `components/fable-ui/*`: schema, prompt, tool, renderer, blocks |
| `fable-themes` | `styles/fable-themes.css` with six presets |

## Before you change anything

1. Run `node .agents/skills/fable-ui/scripts/doctor.mjs` from the app root. It checks Next.js, React, Tailwind v4, `components.json`, aliases, AI SDK 7, the font token and an existing install. Fix what it reports first.
2. If the app has an `AGENTS.md`, follow it (Next.js apps often require reading `node_modules/next/dist/docs` first).
3. Never print, log or commit API keys. Put them in `.env.local`.

## New app: full chat

```bash
npx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json
```

- Review files the CLI wants to overwrite; never pass `--overwrite` for files the user changed.
- The route uses `@ai-sdk/openai` and `FABLE_MODEL`. For another provider, install its `@ai-sdk/*` package and change the `model` line only.
- Add `--font-heading: var(--fable-font-heading, var(--font-sans));` to `@theme inline` if missing.

## Existing chat

```bash
npx shadcn@latest add https://fable-ui.shobky.com/r/fable-ui.json
```

Server (`streamText`): add `[FABLE_TOOL_NAME]: fableTool` to tools, append `fableSystemPrompt()` to the system prompt, and stop after rendering: `stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(5)]`. Include the tool wherever the route passes tools to `validateUIMessages` / `convertToModelMessages`.

Client: wrap messages in `<FableProvider onReply={(text) => sendMessage({ text })} readOnly={status === "streaming"}>` and render `<FableToolPart part={part} />` when `isFableToolPart(part)`.

## Images and actions

- Images load only from `images.allowedHosts` on `FableProvider`; others ask first. Tell the model the image source with `fableSystemPrompt({ imageSource })`; without one it is told not to use images.
- Side effects run only through `actions` on `FableProvider` (`{ confirm?, run(payload) }`), named in `fableSystemPrompt({ hostActions })`. Validate payloads server-side.

## Themes

Fable uses shadcn variables only. A theme from the shadcn customizer works as-is. For presets: install `fable-themes`, `@import` the CSS after tailwind, set `data-fable-theme="neutral|cobalt|moss|rose|editorial|midnight"` on `<html>`.

## Custom block

Follow `references/custom-block.md`: schema (bounded) → component (tokens, `surface`, container queries) → renderer case → skeleton → `to-markdown` → one prompt line → test.

## Verify

1. Type check and lint.
2. Start the dev server, open the chat, and ask: "Compare three databases in a table" (table streams in), "Help me plan a dinner, ask what you need" (form; submit sends answers), "hi" (plain text).
3. Check the browser console for errors and hydration warnings.
4. Report changed files, env vars the user must set, and anything skipped.

See `references/catalog.md` for every block and its fields.
