# Plan 001: Center and clarify the landing experience

> **Executor**: Read this whole plan and `AGENTS.md` first. Do not disturb unrelated worktree changes. Check drift with `git diff d2bd90d..HEAD -- app/page.tsx components/page-header.tsx components/interactive-demo/landing-playground-demo.tsx components/site-header.tsx app/globals.css`. If an in-scope file changed, compare it with the excerpts below and revise the plan with the owner before implementation.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW for structure; MEDIUM for demo interaction
- **Depends on**: none
- **Category**: direction, correctness
- **Planned at**: `d2bd90d`, 2026-11-13

## Why this matters

The hero is centered, but its long technical headline and the nested demo container weaken the page's first impression. The only hero action sends people to docs, while the real interactive playground is reachable through the global header. The mock demo also uses fixed July 2026 records under a relative “this month” prompt and leaves scheduled stage timers active after Reset. Give visitors a clear product promise, a visible path to try it, and a polished sample that behaves consistently.

## Current state and conventions

- `app/page.tsx:18-20` uses `"a copy-and-own registry of AI-intent-aware product experiences."` as its visible title and metadata, with a much longer supporting sentence.
- `app/page.tsx:52-66` renders `PageHeader`, one docs button, then an outer `.container` around `LandingPlaygroundDemo`.
- `components/page-header.tsx:9-13` centers children with `items-center`, `text-center`, and `px-6`; heading and copy have separate max widths at `:25-42`.
- `components/interactive-demo/landing-playground-demo.tsx:114-118` adds another `max-w-6xl` wrapper; `:119-131` shows only “New Chat” and an icon-only reset control.
- `components/interactive-demo/landing-playground-demo.tsx:91-107` schedules four `window.setTimeout` transitions and Reset changes state without cancelling them.
- `components/interactive-demo/landing-playground-demo.tsx:36-71` hardcodes July 2026 sample sales, and `:291-295` labels them accordingly. Keep sample data local and never imply it is live.
- Reuse Tailwind theme tokens from `app/globals.css`, existing `Button`/`Link` patterns from `app/page.tsx`, and the rounded chat/card language from the demo. Follow the `better-layout` skill for shared edges and responsive structure and `better-ui` for consistent surfaces and motion. The UI skills CLI was not installed locally at planning time; use local skill files under `C:/Users/NEW LAP/.agents/skills/` if the CLI remains unavailable.

## Commands and references

| Purpose | Command | Expected |
| --- | --- | --- |
| Framework rules | Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` and `01-getting-started/11-css.md` | Route and CSS conventions understood before editing |
| Type check | `pnpm typecheck` | Exit 0 |
| Lint | `pnpm lint -- app/page.tsx components/page-header.tsx components/interactive-demo/landing-playground-demo.tsx components/site-header.tsx` | Exit 0 |
| Production compile | `pnpm build` | Exit 0, or record an environmental failure with its exact cause |
| Scope | `git diff --check` and `git status --short` | No whitespace errors; only intended files plus pre-existing changes |

## Scope

**In scope**: `app/page.tsx`, `components/page-header.tsx` only if a shared primitive truly needs adjustment, `components/interactive-demo/landing-playground-demo.tsx`, `components/site-header.tsx` only if active route/CTA alignment requires it, and `app/globals.css` only for reusable tokens or styles not expressible in existing Tailwind classes. Add a focused test only if a browser or component test harness already exists at execution time.

**Out of scope**: AI API routes, provider/key handling, registry item implementation, documentation content, persistence, the user's pre-existing changes in `.source/*` and `pnpm-workspace.yaml`.

## Steps

### 1. Establish the visual target and baseline

Capture the current `/` in light and dark at 1440, 1024, 390, and 320 CSS px. Record current hero, demo, CTA, and overflow behavior. Define a single shared centerline and content width for hero text and demo; the demo may be wider, but its frame should align intentionally with the hero's edge system. Keep DOM reading order equal to visual order.

**Verify**: baseline screenshots exist for all widths and `document.documentElement.scrollWidth <= window.innerWidth` is checked at each width.

### 2. Rework hero copy and action hierarchy

Write a short user-facing promise about rendering trusted product UI from AI requests. Keep the technical explanation one supporting sentence. Make “Try the playground” the primary action linking to `/chat`; make “Read the docs” secondary. Preserve `Metadata`, static rendering, and the existing docs route. Use one `h1` and ensure at 320 px neither action clips or becomes inaccessible.

**Verify**: `pnpm typecheck` exits 0; keyboard Tab reaches both actions in reading order; `/chat` and `/docs/introduction` remain valid destinations.

### 3. Center and frame the mock conversation

Remove redundant or conflicting width/padding layers between `app/page.tsx` and `LandingPlaygroundDemo`. Give the demo a clear “interactive example / sample data” label, a quiet route into the full playground, and a reset action with an accessible name. Keep the conversation and rendered metric/browser/actions as the largest visual area. Do not add a full sidebar to this preview. Keep the table's horizontal scroll inside its card and ensure no page-level overflow at 320 px.

**Verify**: `pnpm lint -- app/page.tsx components/interactive-demo/landing-playground-demo.tsx` exits 0; at 1440, 1024, 390, and 320 px the hero and demo share intentional alignment, the chat remains the focus, and the document has no horizontal overflow.

### 4. Make demo playback and sample context truthful

Cancel every pending stage timer on Reset and unmount, or replace them with one cancellable sequence. Keep Reset usable during playback. Preserve current search/filter/sort interactions after the mock response completes. Change relative “this month” wording to an explicit sample period, or make the displayed period derive from the data; label the results as sample records. Avoid adding a network call.

**Verify**: start → reset before completion → wait longer than 3.4 seconds leaves the demo idle; start → complete → reset → start completes exactly once; navigating away during playback causes no state update warning. Search/filter/sort still work after completion.

### 5. Review visual precision

Compare before/after screenshots for light and dark at 1440, 1024, 390, and 320 px. Check 200% zoom, keyboard focus, reduced motion, and RTL mirror for layout clipping. Adjust spacing, wrapping, radii, icon alignment, and contrast to the existing token system; document measured differences rather than claiming an unsupplied reference was matched pixel for pixel.

**Verify**: `pnpm typecheck`, scoped lint, `pnpm build`, and `git diff --check` pass; screenshots show no clipped text, controls, or page-level horizontal scroll.

## Done criteria

- [ ] Primary hero action enters `/chat`; docs remain secondary.
- [ ] Hero and demo have deliberate centered alignment at 1440, 1024, 390, and 320 px in both themes.
- [ ] Sample label and period match the fixed data.
- [ ] Reset cancels pending playback; repeat and unmount paths are clean.
- [ ] No inaccessible icon-only reset or clipped table/control at 320 px or 200% zoom.
- [ ] Type check, scoped lint, build, and diff checks have recorded results.
- [ ] `plans/README.md` status is updated.

## STOP conditions and maintenance

Stop and report if the page or demo changed since `d2bd90d`, if the redesign requires altering API/provider behavior, or if the visual target depends on a reference design that is not available. Keep the sample demo intentionally separate from live chat data. Review future copy changes against both visible labels and metadata so the page promise stays consistent.
