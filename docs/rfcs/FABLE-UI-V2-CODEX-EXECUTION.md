# Codex GPT-6.1 Sol — Fable UI 2.0 Review, Improve, Execute

You are acting as principal engineer, design systems architect, and AI UX researcher for the **real repository** \`shobky/fable-ui\`.

Branch: \`planning/fable-ui-2-agent-first\`
Start with: \`docs/rfcs/2026-10-fable-ui-v2.md\`
Date of brief: 2026-10-22
Review update: 2026-10-30

The accepted decision record is `docs/rfcs/fable-ui-v2-decisions.md`. The
first implementation is additive: host-owned typed result IDs, strict Fable
validation and rendering, and an optional json-render core stream compiler.
OpenUI Lang remains a measured alternative. A deterministic 12-fixture
protocol baseline is recorded; it does not claim GPT-generated quality,
browser paint, state persistence, accessibility, bundle size, or consumer
compatibility. The first playground uses a visibly labeled deterministic
stream fixture and requires no model key. Server resources, model transport,
and privileged actions remain outside this slice.

## Assignment and autonomy

Do not just summarize this RFC or generate a fresh plan. **Review, challenge, improve it, and begin implementing a working, small, reversible vertical slice.** You may edit the RFC and record decisions with evidence. Work in reviewable branches and PR-sized commits; never silently rewrite the entire existing codebase.

Use GPT-6.1 Sol high reasoning (or maximum available) for architecture review, security analysis, comparative protocol spike and implementation. If Codex has model picker, select that model. You have authority to read code, run tests, research official source docs, add experimental files, and fix failing changes. Do not push breaking changes to main or remove v1 exports without review.

## Non-negotiable constraints

- Keep the shadcn copy-and-own registry as the distribution strategy, unless strong measured evidence justifies a separately reviewed ADR.
- Keep all 13 current registry items available and their behaviors stable.
- Preserve all authentication, authorization, tenant isolation and host control of writes.
- Do not require Firebase/REST, AI SDK, Vercel services or a global Fable data provider to render pure components.
- Reuse the validated result of a host-owned server tool for both LLM reasoning and UI rendering.
- Do not expose client-only queried rows to the model implicitly; use an explicit safe snapshot or rerun an authorized server query on demand.
- Do not allow model-supplied arbitrary TSX, JavaScript, CSS code, raw HTML, unrestricted URLs, DB queries or mutations.
- Component naming, external protocol and all v2 API signatures are **proposals**, not required truths: evaluate and improve them.
- Avoid global CSS overrides; create opt-in scoped theme tokens and preserve the consumer's fonts and shadcn setup.
- Do not use a private OpenAI Intelligent UI implementation or claim it can be embedded directly from GPT-6 API.

## Exact workflow

### Step 1: Ground truth

Inspect actual repo: README, registry.json, all core definitions, renderer, provider, registry, drivers, manifest, AI-SDK handlers, DataBrowser, charts, tests, docs, skill, scripts, Tailwind tokens. Run baseline:

\`\`\`bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm registry:check
pnpm registry:consumer-smoke
pnpm build
\`\`\`

Capture passes, failures and preexisting issues separately. Note that next.config.ts has typescript.ignoreBuildErrors=true: it cannot substitute for typecheck. Avoid reading or printing secret values. Check installed Next documentation (AGENTS.md).

### Step 2: Research with independent judgement

Compare the actual latest versions of:
1. OpenUI Lang: https://www.openui.com/docs/openui-lang/overview
2. json-render: https://json-render.dev/
3. A2UI: https://a2ui.org/
4. Vercel AI SDK chatbot tool usage: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage
5. ChatGPT Intelligent UI's public announcement: https://openai.com/index/gpt-6-for-everyone/

Inspect source/LICENSE and current API surface. Do not assume third-party reverse engineering is OpenAI's source. Verify package compatibility with React 19 / Next 16 / AI SDK 7 / Zod 4. Record constraints if incompatible.

Challenge whether adopting external protocol brings more maintenance cost than simple JSON tree + adapter. Prefer architecture with smallest reliable implementation, not novel parser complexity.

### Step 3: Explicit design review before implementation

Write \`docs/rfcs/fable-ui-v2-decisions.md\` with:
- 1-page verdict;
- changed/rejected RFC assumptions with explanations;
- comparison matrix and weighted criteria;
- chosen spike option and why;
- core data contract/types examples;
- threat model (prompt injection, arbitrary URLs, authZ, tenants, mutations, cross-request caching);
- 2-3 migration strategies ranked;
- explicit **no-go** conditions and fallback.

Then amend the RFC where necessary and proceed. If a decision is still uncertain, isolate it as a benchmark hypothesis rather than pretend certainty.

### Step 4: Implement minimal protocol benchmark

Run the same 12 authored fixtures through OpenUI Lang and json-render in an
isolated benchmark. Keep protocol dependencies out of the pure component
entry point. The selected v2 stream path uses `@json-render/core` only as an
optional compiler behind Fable-owned strict validation and rendering; do not
ship either third-party React renderer in the base component surface.

For deterministic fixture runs, record encoded bytes, structural/strict
validation, parser/patch behavior, and known invalid payloads. Do not label
bytes as model tokens. Browser paint, stable control state, package bundle,
keyboard/a11y, and real model quality require separate checks and are not
proven by the protocol script.

If live GPT-6.1 Sol API credentials are unavailable, test deterministic parser/stream fixtures and clearly mark model quality benchmark as unverified. Never fabricate token or latency numbers. Record experimental results and select a protocol only with evidence.

### Step 5: First useful vertical slice

Once the protocol boundary is documented, add a set of **pure** design primitives under an experimental `v2` namespace:
- Stack, Inline, Grid, Surface, Section and Typography;
- scoped Fable theme CSS (preserve host theme);
- polished metric component and at least one image/entity component;
- a demonstrator with title, three host-owned entity references, chart and local filter, rendered from the Fable spec;
- an explicitly labeled deterministic stream fixture without a model key.

Give each component an ordinary React public API and a Zod model-facing schema created from the same semantics. Do not couple the UI to model transport. Do not register experimental components as stable shadcn items until registry validations pass.

### Step 6: Tests and consumer checks

Add automated tests:
- React render without AI SDK/data provider;
- empty/loading/error states;
- unknown components/props/IDs, malformed patches, oversized/deeply nested render tree;
- focus/value persistence when partial UI streams;
- keyboard traversal, reduced-motion, light/dark and basic RTL;
- host data-kind checks fail closed; no renderer-side fetch or action path.

Keep v1 regression tests and verify all 13 current registry items remain
available when the experimental v2 registry entry is added.

Run all scripts again. If some can't run in this environment, say so precisely. Prepare a clean-consumer smoke test that dry-runs a minimal shadcn registry install and exercises a real import.

### Step 7: Update docs and agent skill last

Only after a real slice works, add documentation with:
- three copyable prompts: standalone components, AI chat, authorized live data;
- actual install commands and supported modes;
- "works without AI or Firebase" demonstration;
- migration from v1;
- no invented functionality.

Keep .agents/skills/fable-ui safe: inspect repo, dry-run, review collisions, preserve target files, do not overwrite silently.

### Step 8: Deliver

Produce:
1. A short summary of architectural decisions and tradeoffs, with evidence.
2. List of exact changed files and commits.
3. Screenshots/demo location and what actually works.
4. Test command outputs grouped passed/failed/unverified.
5. The next four PRs, with explicit owners/dependencies/acceptance criteria.
6. Open security or model-integration risks.

Commit changes on a feature branch and open a draft PR; **do not merge**. Stop only for genuinely external blockers (permissions, credentials or upstream limitations). Otherwise make progress on the highest-confidence slice.

## Execution result — 2026-10-30

- Latest `planning/fable-ui-2-agent-first` was fetched and verified against
  the open draft PR before implementation. Work stayed on this non-main branch.
- Protocol decision: use `@json-render/core` only as an optional JSONL patch
  compiler behind Fable's strict schema, fixed React renderer, and
  host-owned result/asset IDs. OpenUI Lang remains an evaluated alternative;
  no model-quality conclusion is claimed from deterministic fixtures.
- Added an experimental `/v2/playground` composition with text, rich text,
  host-backed metrics/entities/chart, local filtering, validated stream
  replay, and cancellation that preserves the last valid snapshot. The demo
  uses a clearly labeled deterministic fixture and makes no model/provider
  request.
- Kept all 13 v1 registry entries and added `v2-primitives` and
  `v2-renderer`. Consumer, registry, build, and test outcomes are recorded
  in the pull request and this decision record; no stable release or merge
  is part of this work.
- The local preview is `http://127.0.0.1:3002/v2/playground`. It was reviewed
  at 320, 390, 768, and 1280px in light and dark modes, with filter and
  cancellation interactions. Final review notes and remaining limitations
  are in the pull request.
- A GPT-6.1 Sol high-reasoning architecture pass challenged the slice and
  identified the missing reduced-motion behavior on skeletons; the classes
  and focused regression test are now part of the final verification.
- Current OpenUI Lang 1.0.2, json-render core 0.21.3, A2UI 0.9.1, and AI SDK 7
  integration paths are documented in the RFC and decision record. The full
  live model-quality design requires 72 prompts, while the local cap is 25;
  no live comparative model-quality claim is made.

### Follow-on implementation — semantic rich content

The broad product target remains a composable Next.js UI kit for agent chat:
typeset prose and rich text, compose layouts and components, stream validated
UI, and help hosts review existing components. This follow-on adds one useful
vertical slice to that foundation; it does not claim the entire target is
complete.

- Added an additive `RichContent` renderer primitive while preserving the
  existing `Text` and `RichText` APIs. Its bounded semantic blocks are
  paragraphs, level-two/three headings, ordered/unordered lists, quotes, and
  literal code blocks. Inline content is text marks or references to host links.
- The host owns link IDs, labels, and destinations. The model can only refer to
  an ID; destinations are limited to same-origin absolute paths or HTTPS URLs.
  Paths whose dot-segment normalization would become protocol-relative are
  rejected too. Invalid and unknown link references render as unavailable.
  Rich content does not interpret HTML, Markdown, or model-authored URLs.
- The schema bounds the payload to 12 blocks, 16 inline children per text block
  or list item, 12 list items, 240 characters per text span, 4,000 code
  characters, 8,000 aggregate text characters, 24 host links, and a 12 KiB
  serialized element.
  These limits keep a single escaped JSONL patch line below the 16 KiB stream
  line cap and are covered by catalog, renderer, and stream tests.
- The deterministic playground fixture now composes rich paragraphs, a
  heading, a list, and a host-owned guide link alongside its existing metric
  and chart surfaces. Registry metadata includes the new standalone primitive
  and renderer-backed surface; the 13 v1 entries remain in place.

### Baseline and follow-on verification

Before the rich-content edits, the branch baseline passed 20 Vitest files and
90 tests, `pnpm typecheck`, and `pnpm lint` (0 errors, 39 existing warnings).
`pnpm registry:validate` accepted all 15 registry items. The documented
deterministic protocol benchmark remains 12 authored fixtures, 1,995 bytes for
OpenUI Lang 1.0.2 versus 5,661 bytes for json-render core 0.21.3, with 36 nodes
and 48 patches. Those are serialized wire bytes, not model tokens, quality, or
latency. A fresh benchmark invocation in this shell was not reproduced because
the script requires an isolated `FABLE_PROTOCOL_BENCH_ROOT` environment.

The 72-prompt live model comparison was not run because the configured local
cap is 25; there is no new model-quality claim. The follow-on results are:

- Full Vitest run passed: 21 files and 98 tests. `pnpm typecheck` passed.
  `pnpm lint` passed with 0 errors and 39 warnings.
- `pnpm registry:validate` passed all 15 entries, `pnpm registry:build`
  produced all 15 entries, and registry source lint passed for 84 published
  files. `pnpm registry:check` stopped during the quickstart dry-run because
  `ui.shadcn.com` failed DNS resolution (`ENOTFOUND`). The clean consumer
  smoke also remains unverified: after switching to a task-local pnpm store,
  package resolution at `registry.npmjs.org` failed with `ENOTFOUND`.
- `pnpm build` remained at “Creating an optimized production build” for about
  three minutes and was canceled after no progress. The explicit
  `pnpm exec next build --webpack` fallback failed with `EPERM` while creating
  `.next/static/chunks/app/(app)/docs`. No post-change production build passed.
- The live preview was reloaded at `http://127.0.0.1:3002/v2/playground` and
  completed all eight validated patches with the new semantic content and
  host-owned guide link. Browser inspection at 320, 390, 768, and 1280 CSS
  pixels found no horizontal overflow; the layout used one, one, two, and
  three property columns. ArrowDown selected Dahab and Home restored all
  destinations. A current browser console-log check was not completed.
- The protocol-size record above is from the earlier isolated deterministic
  benchmark. Re-running the script here stopped before measurement because
  `FABLE_PROTOCOL_BENCH_ROOT` was not configured; do not present a new run as
  completed.
- Static review of the earlier PR security finding confirmed branch commit
  `102e2cb` removed the obfuscated loader, VS Code auto-run task, and `.orc`
  payload, and restored the `.env*` ignore rule. Current package hooks are
  ordinary Next.js commands and the PostCSS config only installs Tailwind. This
  follow-on also removes a remaining `npm run lint` folder-open task from
  `.vscode/settings.json`. The current security review inspected source only
  and executed no payload.

## Evaluation rubric

Total 100 points:
- 20: standalone UI simplicity / no mandatory data layer;
- 20: composable streaming stability;
- 15: safe host-owned data/query/action boundary;
- 15: polished shadcn-based design and accessibility;
- 10: agent-first install reliability;
- 10: backward-compatible incremental migration;
- 5: cost/latency;
- 5: maintainability/dependencies.

Minimum score to accept a candidate: 75/100, AND passes all critical security and no-gateway gates. An approach with zero verified working demos cannot score as production ready.

## Context reminders

The goal is **not** to copy ChatGPT's internal renderer or build a generic clone of shadcn. It is a strong open-source, agent-first generative UI composition experience. Prefer meaningful typography and content over cards and decorative badges. Make the model select UI based on utility; ordinary prose remains valid.

The starting RFC is substantial but not sacred. Argue with it, improve it, and ship a first tested implementation.
