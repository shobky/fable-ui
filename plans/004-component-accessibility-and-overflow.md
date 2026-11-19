# Plan 004: Verify every Fable block and remove confirmed interaction gaps

> **Executor**: Read `AGENTS.md` and this whole plan before editing. Preserve pre-existing worktree edits. Compare the excerpts below to current source before modifying it, because the branch was dirty when this plan was written. Do not commit, push, or deploy without instruction.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MEDIUM; shared renderer behavior reaches every host
- **Depends on**: Plan 003 for playground shell checks, but block checks can start independently
- **Category**: accessibility, layout, tests
- **Planned at**: `6df3266`, 2026-11-13; current worktree contains uncommitted changes

## Why this matters

Fable exposes 24 content block examples and three layout examples, but the current renderer test takes only the first 24 examples and asserts only the first 21 content type names. A successful test cannot establish that the final content types or any layout example rendered. Source review also found a horizontally scrollable table wrapper removed from keyboard tab order and a gallery carousel that always uses smooth scrolling, including when the user requests reduced motion. A complete component quality claim needs both focused fixes and a repeatable visual/keyboard matrix.

## Current state and conventions

- `lib/block-examples.ts:6-208` contains the canonical `BLOCK_EXAMPLES` and `LAYOUT_EXAMPLES` fixtures. They cover markdown, heading, callout, metrics, table, chart, details, list, checklist, code, quote, image, gallery, cards, hero, article, form, template, email, actions, file, sources, faq, divider, columns, section, and tabs.
- `components/fable-ui/renderer.test.tsx:30-40` currently uses `spec = { blocks: [...Object.values(BLOCK_EXAMPLES), ...Object.values(LAYOUT_EXAMPLES)].slice(0, 24) }` and loops only over `Object.keys(BLOCK_EXAMPLES).slice(0, 21)`. The fixture and assertion slices must not silently omit types.
- `components/fable-ui/renderer.tsx:113-133` wraps generated tabs in an `overflow-x-auto` region. `:150-169` puts each block in an `@container min-w-0` frame and uses responsive grid columns. Preserve those boundaries.
- `components/fable-ui/blocks/table.tsx:154-155` uses `<div className="max-h-[34rem] overflow-auto overscroll-x-contain" tabIndex={-1}>`. In the observed 320px comparison scenario the table scroller was 258px wide with 626px of content. It is legitimate local overflow, but the scrollable region needs a discoverable keyboard path and name; verify the browser's actual focus behavior before choosing the final element and label.
- `components/fable-ui/blocks/media.tsx:279-299` calls `scrollBy({ behavior: "smooth" })` and applies `scroll-smooth` to the gallery track. Honor `prefers-reduced-motion` for both button and swipe/scroll behavior. Keep the current RTL direction logic and accessible arrow button names.
- `components/fable-ui/blocks/shared.tsx:64-71` defines the shared `surface` token and `motion-safe` entrance. Most existing motion already follows the reduced-motion preference; align carousel behavior with it.
- `components/fable-ui/blocks/interactive.tsx:54-73` validates required and email fields, sets `aria-invalid`, and focuses the first error. `components/fable-ui/blocks/chart.tsx` provides a table alternative. Retain these good interaction contracts.
- Use Tailwind 4 utilities and the existing shadcn primitives. Do not add a second component system or global overflow suppression.

## Commands and references

| Purpose | Command | Expected |
| --- | --- | --- |
| Framework conventions | Read relevant guides under `node_modules/next/dist/docs/` before code edits | Current Next rules understood |
| Typecheck | `pnpm typecheck` | Exit 0 |
| Focused tests | `pnpm test -- components/fable-ui/renderer.test.tsx` | Exit 0 |
| Full tests | `pnpm test` | Exit 0 |
| Focused lint | `pnpm lint -- components/fable-ui/renderer.test.tsx components/fable-ui/blocks/table.tsx components/fable-ui/blocks/media.tsx` | Exit 0 |
| Diff hygiene | `git diff --check` | No whitespace errors |

## Scope

**In scope**: `components/fable-ui/renderer.test.tsx`, `components/fable-ui/blocks/table.tsx`, `components/fable-ui/blocks/media.tsx`, and a focused test for those behavior changes if needed. If the verification matrix identifies another confirmed issue, make a separate scoped change or plan with its precise evidence instead of broad refactoring under this plan.

Also in scope: QA evidence at `plans/004-component-matrix.md` and generated registry artifacts for changed components. Both `public/r/fable-renderer.json` and `public/r/fable-ui.json` embed table and media source. Run `pnpm registry:build` and `pnpm registry:check`, inspect the generated diff, and compare affected embedded content to the current source (normalize line endings). The registry check validates dependencies, not freshness. Declare any new shipped helper in both owning items in `registry.json`.

**Out of scope**: schema/protocol shape, API routes, third-party UI primitives, live provider behavior, and redesign of every block. Plan 003 owns the playground shell and sidebar.

## Steps

1. Render one valid spec per fixture in parameterized tests. Both the schema and resolver cap a spec at 24 top-level blocks; keep those limits. Enumerate expected content types from CONTENT_BLOCKS and the three supported layouts, so a missing fixture fails. For tabs locate the tablist and its Monthly and Details tabs, select Details, and check its table panel; there is no data-fable-block marker for tabs. For each leaf verify representative visible content or semantics beyond its renderer wrapper. Preserve the existing broken-block isolation assertions. **Verify** with `pnpm test -- components/fable-ui/renderer.test.tsx`; the test must fail if the last fixture type is removed.
2. Make the table's genuinely scrollable region keyboard reachable and labelled when it overflows. Use a concise hint near the table only when horizontal overflow exists, especially at narrow widths; the hint must have a static cue, not rely on a hidden scrollbar. Do not add a redundant outer document scrollbar. **Verify** keyboard Tab/arrow navigation on the comparison table at 320px and full-width table behavior at 1280px.
3. Make gallery motion conditional on `prefers-reduced-motion`: the track's CSS must not force smooth scrolling under reduced motion, and the button's `scrollBy` behavior must select `auto` or `instant` as supported under that preference. Preserve direction in RTL and visible previous/next controls. **Verify** in both motion preferences and RTL.
4. Use the 27 live BlockPreview instances on /docs/blocks (content/docs/blocks.mdx). Record the component container width as well as viewport width. For the carousel also use a test fixture with layout set to carousel and at least three images: the canonical gallery example is featured. Test a non-sortable wide table without actionable cells as well as the default sortable example. For each one, inspect at 320, 390, and 1280 CSS px, light and dark, with 200% zoom for at least all interactive and horizontally scrollable types. Check document and component overflow; keyboard reachability, focus visibility, names, roles, and states; empty/error/loading states where the type defines them. Record actual passes and failures in the PR or handoff. Any confirmed failure outside the three files above needs a separate scoped fix with focused verification.

## Test plan and done criteria

- The renderer test covers every current key of `BLOCK_EXAMPLES` and `LAYOUT_EXAMPLES` without numeric slices.
- Table scrolling is reachable by keyboard and announced; no document horizontal overflow is caused by table content.
- Gallery navigation respects reduced motion and still works in RTL.
- Typecheck, focused lint, focused tests, and full tests pass, or exact environmental failures are reported.
- The 27-row matrix records tested widths/themes, default and long content, keyboard actions and results, overflow owner, and any fix/retest or unchecked state. Check rendered text and focus contrast, RTL, and a screen-reader path through the catalog, table, and form; disclose unavailable assistive technology. Keep necessary local scrolling for data and code. Both installer artifacts match the final shared source. Do not state “all components accessible” unless the actual matrix supports it.

## STOP conditions

- Current fixtures, renderer shape, or the named table/gallery behavior differ materially from the excerpts above.
- A confirmed fix requires modifying schema, protocol, API routes, or shared third-party primitives.
- A verification command fails twice after a bounded fix attempt.

## Maintenance note

When adding a block or layout type, add its fixture and keep the renderer coverage assertion exhaustive. Repeat narrow-width and keyboard checks for new scroll containers, especially tables, code blocks, tabs, and galleries.
