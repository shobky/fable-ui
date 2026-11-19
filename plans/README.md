# UI redesign plans

Prepared with the `improve` skill on 2026-11-13 against commit `d2bd90d` on `staging`. These plans cover the landing page and chat playground requested in this task. The current branch had no `plans/` directory. Read each plan fully, check for drift, and update its status after execution.

| Order | Plan | Priority | Effort | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | [001: Center and clarify the landing experience](001-landing-redesign.md) | P1 | M | None | DONE |
| 2 | [002: Make the playground chat first and easy to explore](002-playground-redesign.md) | P1 | M | 001 visual language | DONE |
| 3 | [003: Make the playground catalog useful at every width](003-playground-catalog-and-shell.md) | P1 | M | None | Implemented; QA evidence below |
| 4 | [004: Verify every Fable block and remove confirmed interaction gaps](004-component-accessibility-and-overflow.md) | P1 | L | 003 for integrated checks | Implemented; extended QA limits recorded |

**Sol implementation handoff:** Use this current `D:\fable-ui` checkout (HEAD at review: `6df3266`). Plans 003/004 and the current playground edits are uncommitted; a clean checkout of that SHA alone is insufficient. Read both plans and the relevant installed Next docs, record the starting status/diff, implement 003 then 004, and preserve unrelated work. Verify desktop and mobile flows, record the component matrix, regenerate affected registry payloads, and report observed results and gaps. Mark each plan done only after its acceptance checks. No deployment or push is part of this handoff.

If the pinned pnpm wrapper cannot start offline on Windows, use the installed equivalents from the repo root: `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run` (append a test path for a focused run), and `node node_modules/eslint/bin/eslint.js` followed by the quoted changed source paths. Compare diff hygiene with the recorded dirty baseline. Separate new issues from existing ones.

## Implementation and validation — 2026-11-13

- Landing: centered hero with a playground-first CTA, aligned interactive preview, explicit July 2026 sample data, accessible Reset, and cancellable stage timers.
- Playground: chat-first shell, compact desktop browse rail, mobile drawer, four mock-backed example prompts, New chat reset, and clearer composer settings.
- Passed: `pnpm typecheck`; scoped ESLint on changed source files; `pnpm build`; `git diff --check` on changed source files.
- Browser checked: landing and chat at 1440, 390, and 320 CSS px; no document-level horizontal overflow. Sample metric and data browser rendered, mobile drawer selected an example and closed, New chat returned to the empty state, and light/dark playground surfaces were inspected.
- Not verified: exact match to an external design reference (none supplied), 1024px and 200% zoom screenshots, RTL mirroring, live provider responses, attachment sending, and all four mock example outcomes. These are follow-up QA limits, not claims of a complete visual matrix.

## Findings and direction

| ID | Finding | Impact | Effort | Fix risk | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| UI-01 | Hero and demo use separate width and spacing systems | Medium: weak shared alignment and visual hierarchy | M | Low | High | `app/page.tsx:52-66`, `components/page-header.tsx:9-13`, `components/interactive-demo/landing-playground-demo.tsx:114-118` |
| UI-02 | Landing mock has little orientation or route into the real playground | Medium: visitors can miss the product's interactive value | M | Low | High | `app/page.tsx:56-62`, `components/interactive-demo/landing-playground-demo.tsx:119-131` |
| UI-03 | Demo timers survive Reset and the displayed month is fixed | Medium: stale state and misleading sample context | S | Low | High | `components/interactive-demo/landing-playground-demo.tsx:36-71`, `:91-107`, `:291-295` |
| UI-04 | Playground shows the full docs sidebar beside an unlabelled chat workspace | Medium: browsing competes with the chat | M | Medium | High | `app/(app)/chat/layout.tsx:11-24`, `app/(app)/chat/page.tsx:25-36`, `components/chat/chat.tsx:115-138` |
| UI-05 | Empty chat gives no prompt to test structured UI | Medium: first use depends on inventing a prompt | M | Low | High | `components/chat/chat.tsx:120-128`; existing suggestion rendering in `components/fable-ui/suggested-actions/suggested-actions.tsx` |

The landing page should lead with a short promise and a primary route to `/chat`; docs remain a secondary route. The playground should reserve the widest readable area for messages and show examples or component links in a quieter browse rail. A full session history is outside these plans because the current chat keeps messages only in client state (`components/chat/chat.tsx:40-48`); presenting history without persistence would be misleading.

## Dependencies and verification baseline

- Plan 002 should use the visual width, spacing, surface, and interaction choices established by Plan 001, but can be implemented independently if those choices are documented first.
- Repo scripts: `pnpm typecheck`, `pnpm lint`, `pnpm build`. No dedicated browser or UI test script was found in `package.json`; visual acceptance therefore requires browser inspection and screenshots during implementation.
- Before any code change, read the relevant Next 16.2.6 guidance in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, `layout.md`, and `01-getting-started/11-css.md`, per `AGENTS.md`.
- Preserve pre-existing edits in `.source/browser.ts`, `.source/server.ts`, `pnpm-workspace.yaml`, and untracked `desktop.ini` unless the owner separately scopes them in.

## Considered and rejected

- A full chat-session browser: current sessions are not persisted, so a history rail would be a false affordance. Start with example/component browsing.
- A new visual component library: the existing Tailwind tokens, shadcn primitives, and chat components already cover the needed controls.

## Audit boundary

This was a focused UI and interaction survey. Backend security, dependency health, data-source behavior, and registry internals were not audited. No code was changed, and no browser screenshot or runtime check was performed during planning.

## Playground catalog and component follow-up — 2026-11-13

Plans 003 and 004 were added after inspecting the current `/playground` UI and Fable renderer sources. At 390x844, the toolbar measured 635px of content inside a 375px visible area while hiding its scrollbar; the prompt sheet had two independently scrollable regions. At 320x700, the document had a 2px horizontal overflow, and a comparison table had 626px of necessary local content inside a 258px scroll region. The prompt search lacked an accessible name in the browser accessibility tree, and ArrowRight did not move the custom theme radio selection. The catalog repeated group chips and per-row category badges while showing only part of the list in a 720px-tall desktop viewport.

Source review found `renderer.test.tsx` includes all 24 content examples but explicitly asserts only the first 21 and slices away all three layout examples; the gallery forces smooth scroll regardless of motion preference, and the horizontally scrollable table wrapper has `tabIndex={-1}`. Plan 004 requires a browser confirmation of the table keyboard path before selecting a fix. The existing `motion-safe` block entrance, labelled form fields, `aria-sort` on sortable tables, and chart table alternative were kept as positive patterns.

Direct installed binaries were used because the pinned pnpm wrapper could not resolve registry metadata due to DNS failure: `vitest run` passed 64 tests with 14 skipped, `tsc --noEmit` passed, and focused ESLint on the inspected playground and Fable files passed. Browser inspection covered the playground at 1280x720, 390x844, and 320x700, including the comparison scenario. It was not an exhaustive 27-example, 200% zoom, contrast, screen-reader, or RTL matrix. Source files were not edited in this follow-up.

## Implementation follow-up — 2026-11-13

Plans 003/004 are implemented. The [component matrix](004-component-matrix.md) records measured widths, interaction evidence, and unchecked states. See [desktop](evidence/playground-desktop.jpg) and [mobile](evidence/playground-mobile.jpg) captures. Full tests passed (98 tests, 14 skipped), TypeScript and focused lint passed, and affected installer payloads were regenerated and compared with source. No commit, push, or deployment was performed. Extended accessibility checks listed in the matrix remain unverified.

Production build: the default Turbopack run stalled during compilation and was stopped; the webpack run reported DNS failure (ENOTFOUND fonts.googleapis.com) fetching the four existing Google fonts. Production compilation is not verified in this environment.
