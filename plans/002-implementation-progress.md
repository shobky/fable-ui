# Plan 002 implementation checkpoint — 2026-11-13

This checkpoint implements Phase 1 and the smallest modular adoption prototype from Phase 2. It does not mark the full research plan or release complete.

## Implemented

- Reconciled the playground route with the in-progress client-safe provider catalog and server model factory. The existing picker response shape is preserved.
- Disabled server-funded live requests in production. Local development can use configured server credentials; the deterministic production demo remains available. The standalone starter still requires host authentication, authorization and usage limits.
- Repaired malformed generated Next development types by moving the generated directory aside and running `next typegen`. Removed the existing production type-check bypass; source files and TypeScript include rules were preserved.
- Isolated default renderer instances and keyed explicit scopes so identity changes load the appropriate state. Added behavior coverage for mounting another surface after edits, scope changes, restoration, interruption, errors and history replay. Mutable block identity remains positional.
- Moved the tool name into an inert protocol module, preserving its export from `tool.ts`. The client adapter no longer initializes the AI SDK tool.
- Used instance-specific composer IDs and tested label associations in two embedded composers.
- Incorporated the existing browser database, encrypted key store and chat store foundations. Added metadata-write serialization, atomic cross-connection encryption-key initialization, blocked-open recovery and rename ordering tests. These stores are not connected to the playground UI or transport yet.
- Added renderer-only and AI adapter registry items while retaining the aggregate item. Renderer-only consumers do not install AI SDK or chat files. Charts remain included; no bundle-size improvement is claimed.
- Added clean Next/Vite consumer verification. Real installs exposed the latest shadcn default's incompatible Base UI primitives; the tested harness explicitly uses Radix Nova. Vite verification also exposed a Node-global reference and an unused helper argument in the canonical renderer, both removed.
- Updated installation guidance, copyable agent prompts, doctor checks and the downloadable Fable skill. Development diagnostics now require explicit `debug`.
- Tracked the existing product plan, local agent skills and launch configuration. Ignored Windows `desktop.ini`.

## Verification

Repository checks: 64 tests passed and 14 opt-in model evaluations skipped; TypeScript passed; ESLint passed with 0 errors and 19 warnings; production build passed with Next type validation enabled; registry build/check passed for 5 items and 54 file entries; downloadable skill freshness passed. Independent review found the encryption-key initialization race; the correction and its regression tests were reviewed successfully.

Renderer-only clean install, dependency/route assertions, typecheck and production build passed in both hosts using Radix Nova:

- Next.js 16.4.6, React 19.3.0, Tailwind 4.3.3 and TypeScript 5.9.3.
- Vite 8.3.8, React 19.3.1, Tailwind 4.3.5 and TypeScript 7.0.2. The fixture uses a `src/` layout and `@/*` alias. Its output included a 1,146.73 kB JavaScript chunk (341.87 kB gzip), triggering Vite's large-chunk warning. This is one fixture's output, not a measured before/after improvement.

The full `pnpm registry:smoke --keep` chat-starter run also passed: clean aggregate/dependency install, TypeScript, doctor checks and production build with Next.js 16.4.6, React 19.3.0 and Radix Nova. No live model call was made; its credential was a fake build fixture. Initial runs found and corrected the registry server root, Windows Node executable quoting, missing fixture font/theme setup, incompatible default primitives and outdated Vite alias setup; these failures were harness/integration evidence and were not counted as passes. After the final source portability corrections, the focused renderer suite passed all 15 tests, TypeScript passed again and the repository production build passed again.

## Remaining scope and release conditions

- Complete Phase 2's optional chart-pack separation, custom-alias coverage, explicit host-theme snapshot checks, structured interaction-event design and real existing-chat cancellation/history workflows. No comparative bundle measurement has been performed.
- Implement Phase 3's shared catalog metadata, task taxonomy and the evidence brief/comparison workspace recipes.
- Run Phase 4's visual, responsive, keyboard and state matrix. No new screenshot or broad visual-quality claim is made by this checkpoint.
- The three existing public registry endpoints returned HTTP 404 on 2026-11-13. Local registry verification does not establish deployment readiness. Deployment and PR scope reconciliation remain outstanding; neither merging nor deployment was authorized by this plan.
- Persisted mutable blocks still need an explicit stable identity design before reorder/insert semantics can be promised. Provider state is memory-only; hosts must change surface identity when replacing positional mutable content.
- Paid model evaluations were not run. Current catalog model availability was not verified by sending paid requests.
