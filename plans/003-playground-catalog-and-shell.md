# Plan 003: Make the playground catalog useful at every width

> **Executor**: Read `AGENTS.md` and this plan before editing. Preserve the existing uncommitted work. The code listed below was already modified when this plan was written; compare its current contents with these excerpts before changing it. Stop and report any new conflict. Do not commit, push, or deploy without separate instruction.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM; shell sizing and keyboard controls affect the main workflow
- **Depends on**: none
- **Category**: UX, accessibility, layout
- **Planned at**: `6df3266`, 2026-11-13; current worktree contains uncommitted changes

## Why this matters

The desktop rail occupies 288px but shows only about six of ten examples at 720px viewport height. The search and six category buttons consume space, and every example repeats a category badge. At 390px, a 635px toolbar is clipped to 375px with its scrollbar hidden, so theme, RTL, and reset have no visible discovery path. The inspector is separately hidden below the medium breakpoint. The mobile sheet has both outer and inner vertical scroll regions. These make the playground feel crowded and harder to use.

## Current state and conventions

- `app/(app)/playground/playground-client.tsx:53-155` owns `PromptLibrary`. It filters `SUGGESTED` by `query` and `selectedGroup`. At lines 76-81, the search input has a placeholder but no label. Lines 93-109 render six small category buttons without an exposed selected state. Lines 129-150 render each prompt with a title, category badge, and two-line prompt excerpt.
- `app/(app)/playground/playground-client.tsx:339-340` gives the shell a calculated viewport height and the toolbar `overflow-x-auto` while hiding its scrollbar. The header has its own border and height in `components/site-header.tsx:12-15`; the browser measured a 1px document-level vertical overflow at 1280x720 and 390x844, and 2px horizontal overflow at 320x700.
- `app/(app)/playground/playground-client.tsx:354-366` puts `overflow-y-auto` on `SheetContent`; `PromptLibrary` adds a second `overflow-y-auto` at line 112. The 390x844 browser rendered both regions scrollable.
- `app/(app)/playground/playground-client.tsx:372-389` and `:432-459` use buttons with `role="radio"` but no arrow-key or roving-tabindex implementation. ArrowRight on the Neutral swatch left focus and selection on Neutral in the browser.
- `app/(app)/playground/playground-client.tsx:497-520` shows the desktop catalog at `lg` and the inspector at `md`. `FableChat` owns the readable message width and composer; keep it intact.
- `lib/playground/scenarios.ts:744-746` defines 12 scenarios and 10 suggested examples. Keep the examples and shareable `?run=` links working.
- Reuse Tailwind 4 tokens and the existing shadcn `Button`, `Input`, `Sheet`, `Select`, and `Tooltip` primitives. `components/chat/playground-browse.tsx` shows a separate compact browse pattern for `/chat`; do not merge the two routes accidentally.

## Commands and references

| Purpose | Command | Expected |
| --- | --- | --- |
| Framework conventions | Read relevant files under `node_modules/next/dist/docs/` before code edits | Route and CSS guidance understood |
| Typecheck | `pnpm typecheck` | Exit 0 |
| Focused lint | `pnpm lint -- 'app/(app)/playground/playground-client.tsx' components/site-header.tsx` | Exit 0 |
| Regression tests | `pnpm test` | Exit 0 |
| Diff hygiene | `git diff --check` | No whitespace errors |

## Scope

**In scope**: `app/(app)/playground/playground-client.tsx`, a focused playground test file if needed, and `components/site-header.tsx` only if its height contract must change. A scoped style in `app/globals.css` is allowed only if Tailwind utilities cannot express the required behavior.

**Out of scope**: `components/fable-ui/blocks/`, providers, API routes, scenario content, `/chat`, and public renderer contracts. Do not add session history; there is no persisted session model.

## Steps

1. Replace the current prompt catalog hierarchy with a clear title, a properly labelled search field, a visible result count or empty state, and compact grouped examples. Preserve the exact scenario IDs and `pick` behavior. Use the category name as the group heading rather than repeating an uppercase badge on every row. Keep a short preview where it helps distinguish examples. Ensure long labels wrap and the full prompt is accessible through the button's name or an adjacent detail affordance. **Verify** by searching for `table`, finding the Data group, clearing the query, and selecting an example in desktop and mobile views.
2. Rebuild the mobile toolbar as visible groups or a labelled settings menu. Keep Prompts, Demo/Live status, and the primary message task immediately available; place lower-frequency preset, dark mode, RTL, reset, and inspector controls behind an obvious control when space is tight. Do not rely on a hidden horizontal scroll strip. Maintain the existing `mode`, `provider`, `speed`, `preset`, `rtl`, and `inspector` state and URL parameter behavior. **Verify** at 320, 390, and 1024 CSS px that every toolbar action can be found and activated by pointer and keyboard without horizontal document scrolling.
3. Use one vertical scroller inside the mobile prompt sheet. Keep its heading and close control visible, make the list scroller `min-h-0`, and contain overscroll. The desktop rail should scroll only when its contents exceed available height. **Verify** at 390x844 that only one sheet region scrolls and the last example is reachable.
4. Replace ad hoc radio roles for agent and theme choices with native buttons using `aria-pressed` when independent button groups are appropriate, or use the existing Radix RadioGroup with arrow keys and roving tab stops. Use static category headings; omit the six filter chips. Announce search result count changes politely. **Verify** with Tab, Enter/Space, arrows if using radio semantics, Escape on the sheet, and visible focus in light and dark modes.
5. Resolve the shell's document-level 1px vertical and 2px narrow horizontal overflow at the owning layout boundary; avoid global `overflow:hidden` as a symptom cover. **Verify** in the browser that `documentElement.scrollWidth <= clientWidth` and the document itself does not scroll when only the chat or catalog should scroll.

## Decisions for Sol

- Use one “Examples” heading per visible catalog, a labelled search, and grouped rows with the example name first and a short prompt preview beneath. Reuse the surface, foreground, muted, and focus tokens. Separate groups with space. Let the sheet heading supply the title on mobile.
- At narrow widths keep Examples and a labelled Settings trigger visible, showing the current agent mode where it fits. Group mode, model or speed, appearance, and RTL in Settings. Keep New chat discoverable. Use RadioGroup or Select for exclusive settings. Verify disabled Live without credentials; verify model selection with mock provider metadata.
- Present the existing Inspector in a labelled sheet whenever a second pane would squeeze the conversation. Do not expose a toggle whose panel stays hidden. Check focus restoration and a desktop with both panels open.
- Small route-local component extractions and a playground-specific layout rule in `app/layout.tsx` are in scope if needed. Recheck the landing and docs headers after changing any shared layout boundary. Verify one send per example selection, sheet close, streaming, stop, new chat, and existing share links.
- Capture before/after at 390px and 1280px with native scrollbars visible. Measure the document, toolbar, sheet, and chat separately. Verify that short search results do not scroll. The screenshot script hides scrollbars by default; do not use those images to prove scrollbar behavior.

## Test plan and done criteria

- Add focused interaction tests for search, grouped results, empty/reset state, and mobile settings access if the test setup supports viewport simulation; model component tests after `components/fable-ui/chat/fable-composer.test.tsx`.
- Run typecheck, focused lint, and `pnpm test`. Inspect the actual diff for unrelated changes.
- Browser-check 320x700, 390x844, 1024x768, and 1280x720; use 200% zoom, keyboard only, light/dark, and RTL. Record which combinations were actually observed.
- All ten suggested scenarios remain reachable. The sidebar, sheet, and toolbar expose visible focus and names/states. No hidden horizontal toolbar actions or document scrollbars appear. Long labels and 200% zoom do not clip controls.

## STOP conditions

- The playground ownership or scenario contract has changed since this plan was written.
- A fix requires changing renderer, API, or `/chat` behavior.
- A relevant check fails twice after a bounded fix attempt.

## Maintenance note

When suggested scenarios change, keep grouping, result count, and mobile browsing in sync with `SUGGESTED`. Review the toolbar at the narrowest supported width whenever a new action is added.
