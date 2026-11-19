# Plan 002: Make the playground chat first and easy to explore

> **Executor**: Read this whole plan and `AGENTS.md` first. Preserve unrelated edits. Check drift with `git diff d2bd90d..HEAD -- 'app/(app)/chat/layout.tsx' 'app/(app)/chat/page.tsx' components/chat/chat.tsx components/chat/chat-composer.tsx components/chat/message-list.tsx components/docs-sidebar.tsx components/site-header.tsx`. If in-scope code changed, compare against the current-state excerpts below before proceeding.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM because layout, chat state, and controls meet here
- **Depends on**: Plan 001 visual language; no hard code dependency
- **Category**: direction, UX
- **Planned at**: `d2bd90d`, 2026-11-13

## Why this matters

The playground uses a full docs sidebar beside a chat column without a chat-specific header. Its empty state offers only a sentence, so a first-time visitor has to invent a prompt to see the structured UI. Provider and model controls share the composer with send and attachment controls. A clearer workspace should keep chat dominant, make browse/test paths obvious, and preserve the existing credential and message behavior.

## Current state and conventions

- `app/(app)/chat/layout.tsx:11-24` wraps `DocsSidebar` and chat in `SidebarProvider` and allocates a 240px desktop rail. `components/docs-sidebar.tsx:45-61` is explicitly a documentation tree; it is hidden below `lg`.
- `app/(app)/chat/page.tsx:14-35` awaits promised `searchParams`, then passes provider defaults, `initialPrompt`, and `autoSend` to `Chat`. Preserve this deep-link contract.
- `components/chat/chat.tsx:40-48` owns ephemeral `useChat` messages. `:58-94` sends through `/api/chat`, and `:120-128` renders the empty-state sentence. `:138-161` passes provider and error state to the composer.
- `components/chat/message-list.tsx:168-172` already uses a scroll region and `aria-busy`; preserve its scrolling behavior and `max-w-3xl` readable measure.
- `components/chat/chat-composer.tsx:203-329` owns draft, attachments, provider settings dialog, model selector, errors, and send. `:197-201` submits with Enter and allows Shift+Enter. Do not duplicate provider state in a new header.
- `components/site-header.tsx:11-38` provides global navigation and a Playground CTA. Keep global and local navigation visually distinct.
- Follow local `better-layout`, `better-ui`, and `better-accessibility` skills under `C:/Users/NEW LAP/.agents/skills/` for responsive hierarchy, control distinction, and keyboard behavior. Read Next route/layout/CSS guidance in the installed `node_modules/next/dist/docs/01-app/` before edits.

## Commands and references

| Purpose | Command | Expected |
| --- | --- | --- |
| Framework rules | Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`, `page.md`, and `01-getting-started/11-css.md` | Current Next conventions understood |
| Type check | `pnpm typecheck` | Exit 0 |
| Lint | `pnpm lint -- 'app/(app)/chat/layout.tsx' 'app/(app)/chat/page.tsx' components/chat/chat.tsx components/chat/chat-composer.tsx components/chat/message-list.tsx components/docs-sidebar.tsx components/site-header.tsx` | Exit 0 |
| Production compile | `pnpm build` | Exit 0, or exact environmental failure documented |
| Scope | `git diff --check` and `git status --short` | No whitespace errors; unrelated changes intact |

## Scope

**In scope**: `app/(app)/chat/layout.tsx`, `app/(app)/chat/page.tsx` only if layout props require it, `components/chat/chat.tsx`, `components/chat/chat-composer.tsx`, `components/chat/message-list.tsx` only if message width/scroll requires it, `components/docs-sidebar.tsx` only for a route-specific presentation prop, `components/site-header.tsx` only for active-route treatment. A small new `components/chat/*` presentation component may be created for examples or workspace header.

**Out of scope**: `/api/chat`, `hooks/use-provider-settings.ts`, key storage, model selection semantics, persistent chat history, registry rendering, docs page layout, pre-existing `.source/*` and `pnpm-workspace.yaml` changes.

## Steps

### 1. Record baseline and choose the browse rail

Capture `/chat` empty and populated states at 1440, 1024, 390, and 320 CSS px in both themes. Use the existing docs tree as secondary browsing, but label its role clearly in the playground. Do not promise saved sessions. If a dedicated examples panel is added, keep it compact and derived from real Fable component routes or curated prompt constants, with no new persistence.

**Verify**: baseline screenshots exist; document-level horizontal overflow and composer visibility are checked at each width.

### 2. Add a restrained playground header and responsive rail

Inside the chat workspace, add a compact header that names the playground and gives a direct New chat/reset action, plus an Examples or Docs affordance. Keep it below the global site header, visually quieter than the conversation. Desktop rail must not force messages below the existing readable `max-w-3xl`; on mobile, browsing must use the existing mobile navigation or an accessible drawer with an explicit trigger. Avoid changing shared docs layout unless a route-specific prop is needed. Reset must clear chat state without wiping provider configuration; inspect the installed AI SDK API before implementing this action.

**Verify**: `pnpm typecheck` exits 0; keyboard users can reach the local header, browse affordance, message area, and composer in DOM order; reset during idle, streaming, and after success has a defined safe behavior.

### 3. Add first-run testing paths

Replace the empty sentence with a short explanation and 3–4 suggested prompt buttons that exercise distinct installed surfaces (for example metric, data browser, confirmation, form). Use actual tool/manifests and mock-mode behavior to choose prompts that work; do not claim a capability before checking its installed route. Clicking a prompt should either fill the draft or send once, and the label must make that behavior clear. Preserve `?prompt=...&send=1` deep links and prevent suggested prompts from double-sending during streaming.

**Verify**: each example reaches the expected surface in mock mode or is removed; deep links still prefill/auto-send once; Enter and Shift+Enter behavior remains intact; `pnpm typecheck` and scoped lint exit 0.

### 4. Clarify composer controls and recovery

Keep send and attachment controls next to the input. Group model/provider configuration behind a labeled, accessible settings affordance, while preserving the existing `ProviderSettings` dialog and `ModelSelector` behavior. Present readiness and error messages where the user can act on them; errors should provide a direct settings path when configuration is the cause. Preserve draft and attachments on failed send. Check loading, disabled, error, and success states in light and dark.

**Verify**: provider switching, model selection, key dialog, attachment removal, send, failure recovery, and streamed response remain usable; `pnpm lint -- components/chat/chat.tsx components/chat/chat-composer.tsx` exits 0.

### 5. Validate the full flow and visual precision

Walk: open `/chat` → select an example → send → observe thinking/loading → inspect rendered UI → use a follow-up action → reset → open docs/sidebar → return to composer. Check at 1440, 1024, 390, and 320 px, 200% zoom, keyboard only, both themes, and RTL mirror. Preserve `aria-busy`; announce errors and loading status where appropriate. Verify the table/complex tool UI scrolls within the message region instead of overflowing the page.

**Verify**: `pnpm typecheck`, scoped lint, `pnpm build`, and `git diff --check` pass; no clipped controls, lost focus, inaccessible drawer, or document-level horizontal overflow in the viewport matrix. Record screenshots and any unverified provider-specific path.

## Done criteria

- [ ] Chat remains the dominant centered surface with a readable message measure.
- [ ] Playground has a clear local identity, reset path, and secondary browse path.
- [ ] Empty state offers usable examples for installed UI surfaces.
- [ ] Existing prompt deep links, send behavior, provider/key settings, attachments, loading, and error recovery still work.
- [ ] Mobile browsing and composer work at 320 px and 200% zoom; keyboard and screen-reader cues are present.
- [ ] Type check, scoped lint, build, diff check, and visual matrix have recorded results.
- [ ] `plans/README.md` status is updated.

## STOP conditions and maintenance

Stop and report if adding New chat requires changing the chat transport contract, if examples cannot be made truthful with installed mock behavior, if a mobile browse path requires invasive changes to the shared docs sidebar, or if the chat code has drifted since planning. Keep browsing content curated from actual registry routes and recheck it whenever surfaces are added or removed. Reviewers should inspect focus behavior, reset semantics, and provider configuration preservation after the layout change.
