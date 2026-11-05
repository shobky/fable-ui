# Plan 001: Finish Fable UI v2 as a compatible, measured Next.js UI kit

> **Executor instructions**: Use GPT-6.1 Sol with high reasoning for the
> architecture and review work. Execute the milestones in order, implement the
> accepted scope, and update the draft PR with verified results. This is not a
> plan-only assignment. Preserve the existing v1 API and behavior. If a STOP
> condition occurs, report the evidence and the smallest decision needed; do
> not guess at authorization or budget.
>
> **Drift check (run first)**: `git diff --stat ff7ed40..HEAD -- components/fable-ui/v2 "app/(app)/v2" registry.json public/r content/docs docs/rfcs`
> If the branch, PR head, current source, or recorded state below differs, use
> the live repository as ground truth and revise this plan before coding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ff7ed40`, 2026-11-03

## Why this matters

Fable UI is intended to install into an existing Next.js app and provide
composable layouts, typography, rich content, dynamic streamed responses, and a
useful review of its component catalog. The current branch is a working but
experimental foundation; its deterministic demo does not prove model quality,
consumer compatibility, or stable release readiness. This plan completes the
highest-value foundation and integration evidence while keeping optional AI
and host data boundaries out of the provider-free component layer.

## Current state

Re-check all of these facts before relying on them:

- Repository: `D:\fable-ui`; current feature branch is
  `planning/fable-ui-2-agent-first`, at `ff7ed40` when this plan was written.
  Draft PR #6 is `https://github.com/shobky/fable-ui/pull/6`; it was open,
  unmerged, and pointed at this branch. Fetch the remote PR and compare its head
  before continuing.
- The user authorized work on feature branches and draft PRs, and prohibited
  pushing or merging to `main`. Continue PR #6 as a draft. Do not deploy or
  merge.
- Four user-added skill directories are untracked:
  `.agents/skills/apple-design`, `frontend-design`, `improve`, and
  `make-interfaces-feel-better`. Preserve them; do not stage them or alter
  their files as part of product work.
- The app uses Next.js `16.2.6`, React `19.2.4`, AI SDK `7.0.14`, Zod `4.4.3`,
  and optional `@json-render/core` `0.21.3` in the current lockfile. Recheck
  `package.json` and the lockfile; do not assume those versions are still
  current. `AGENTS.md` requires reading the relevant installed Next.js guide
  under `node_modules/next/dist/docs/` before changing Next.js code.
- The registry contains 13 existing v1 entries and two experimental v2
  entries. `components/fable-ui/v2/index.ts` is the pure React barrel;
  `catalog.ts`, `stream.ts`, and `renderer.tsx` form the optional validated
  model-spec path. Keep AI SDK, provider, renderer, and Zod imports out of the
  pure barrel.
- `RichContent` currently supports bounded paragraphs, h2/h3 headings,
  ordered/unordered lists, quotes, literal code, and host-curated link IDs.
  The model selects a `linkId`; the host owns the visible label and href.
  `parseSafeFableLinkHref` rejects unsafe schemes, credentials, and local paths
  that normalize to `//`.
- The playground is a deterministic eight-patch fixture at
  `http://127.0.0.1:3002/v2/playground`. It has no live model or provider call.
  Check that the local server still exists before starting another; never kill
  an unidentified process.
- Last recorded verification (2026-10-30): 21 Vitest files / 98 tests,
  typecheck, registry validation, and registry build passed. Lint had zero
  errors and 39 warnings. The consumer smoke was blocked by DNS failures for
  `ui.shadcn.com` and `registry.npmjs.org`. The post-change production build
  stalled, and the webpack fallback failed with Windows `EPERM`. A fresh
  protocol benchmark lacked `FABLE_PROTOCOL_BENCH_ROOT`; historical benchmark
  numbers are wire-byte evidence only. Re-run current checks and record actual
  results rather than copying these results forward.

### Existing design decisions to preserve

- Keep Fable's own strict schema, host-owned data/assets/links, and renderer.
  `@json-render/core` is only optional patch-compiler infrastructure; do not
  adopt `@json-render/react` as the public renderer.
- Keep v1 integrations and all 13 v1 registry entries available.
- Specs select bounded components and explanatory copy. Factual values and
  links resolve only from validated host maps. No model-authored HTML, TSX,
  JavaScript, CSS, unrestricted URLs, database queries, or actions.
- Do not turn the RFC's deferred server resource or action proposals into
  default v2 behavior without a concrete host, authorization contract, and
  separate review.

Reference documents to read completely before implementation:

- `docs/rfcs/2026-10-fable-ui-v2.md`
- `docs/rfcs/FABLE-UI-V2-CODEX-EXECUTION.md`
- `docs/rfcs/fable-ui-v2-decisions.md`
- `AGENTS.md`, relevant installed Next.js docs, and the current component and
  registry implementations.

Current external references to refresh from primary sources:

- OpenAI Intelligent UI overview:
  https://openai.com/index/gpt-6-for-everyone/
- OpenUI Lang:
  https://www.openui.com/docs/openui-lang/overview
- json-render:
  https://json-render.dev/docs/streaming and
  https://json-render.dev/docs/catalog
- A2UI specification: https://a2ui.org/specification/v0.9.1-a2ui/
- Vercel AI SDK chatbot/tool usage:
  https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage

Refresh version-sensitive docs before designing the adapter. GPT-6 Intelligent
UI is a comparison target; do not imply its private runtime is embeddable or
claim Fable superiority without live evaluation evidence.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Bounded full test suite | `pnpm exec vitest run --pool=threads --maxWorkers=2 --reporter=dot` | All current files and tests pass; this avoids a prior Windows worker temp-file `EPERM` seen with the default pool. |
| Typecheck | `pnpm typecheck` | Exit 0. `next.config.ts` skips build-time TypeScript validation, so this is required separately. |
| Lint | `pnpm lint` | Exit 0; report warning count and compare with the current baseline. |
| Registry validation | `pnpm registry:validate` | All 15 or updated expected entries validate; preserve all 13 v1 names. |
| Registry generation | `pnpm registry:build` | Generated `public/r` files match source registry. |
| Registry consumer checks | `pnpm registry:check` and `pnpm registry:consumer-smoke` | Clean install, typecheck, lint, and build pass; if DNS blocks them, report as unverified. |
| Production build | `pnpm build` | Build completes and route generation succeeds. Do not substitute dev-server HTTP success. |
| Browser review | Start/verify `pnpm dev --port 3002`; open `http://127.0.0.1:3002/v2/playground` | Actual UI is inspected at narrow and desktop widths, keyboard and theme states. Leave the page available for the user. |

Run validation against the current branch. Network-dependent checks may be
retried only after identifying the environment failure; do not claim a pass
from an earlier commit.

## Scope

**In scope**:

- `components/fable-ui/v2/` and `app/(app)/v2/` for foundation, tests, and
  deterministic demonstrations.
- Registry metadata and generated v2 entries in `registry.json` and `public/r/`.
- `content/docs/components/v2.mdx` and the three RFC/decision/execution files
  when the implementation or supported contract changes.
- A clearly isolated, optional AI SDK adapter and a clean consumer fixture if
  research confirms a stable contract and the provider remains optional.
- Agent installation guidance and migration docs after actual consumer
  behavior is verified. Inspect `.agents/skills/fable-ui` before editing it;
  preserve user-owned changes and installer safety behavior.

**Out of scope unless a separate decision and host are approved**:

- Replacing or removing v1 exports, integrations, registry items, or runtime.
- A mandatory AI SDK, Firebase, provider, global Fable service, or private
  OpenAI runtime dependency.
- Model-executed code/styles/HTML, model-authored business facts or URLs,
  default server fetches, privileged actions, or speculative generic resource
  and mutation frameworks.
- Production data, credentials, deployments, PR merge, or `main` changes.
- Raising the live-evaluation cap beyond 25 prompts or incurring model/API cost
  without explicit approval.

## Git workflow

- Continue on `planning/fable-ui-2-agent-first` unless current remote state
  requires a safe, reviewed feature branch. Fetch before work and preserve any
  uncommitted/user-owned files. Never reset, force-push, or push to `main`.
- Use focused Conventional Commit messages. Push only to the feature branch and
  keep PR #6 draft and unmerged. Update its body with actual test/build/browser
  results; distinguish verified, blocked, and unverified items.
- Never stage `.agents/skills/apple-design`, `frontend-design`, `improve`, or
  `make-interfaces-feel-better` unless the user separately asks for skill
  changes.

## Steps

### Step 1: Reconcile current state and baseline

Fetch origin, confirm branch/PR heads and working tree, inspect the RFCs, code,
registry, tests, and package lock. Read the installed Next guide before code
changes. Run the commands above and record failures separately. Do not read or
print `.env` values; do not execute historical payloads or untrusted scripts.

**Verify**: `git status --short --branch`, `git log -5 --oneline`, bounded
Vitest, typecheck, lint, registry checks, and build. Expected result is a
documented baseline, not assumed success.

### Step 2: Finish and audit the pure component foundation

Create a small component audit table in the decision record: current v1
component, v2 reuse/wrapper decision, API/state gaps, compatibility risk, and
test evidence. Inspect all proposed additions against actual consumer value.
Close the explicitly recorded gaps: opt-in scoped tokens, remaining justified
layout primitives, loading/empty/error states, semantic structure, focus and
keyboard behavior, RTL, reduced motion, and narrow content/code overflow.
Apply the supplied `apple-design`, `frontend-design`,
`make-interfaces-feel-better`, and relevant accessibility skills. Keep host
fonts/tokens intact; do not add global visual overrides.

**Verify**: focused component and renderer tests plus the full bounded suite;
browser review at 320, 360, 390, 768, 1280, and 1440 CSS pixels, light/dark,
LTR/RTL where supported, keyboard navigation, focus visibility, and reduced
motion. Capture screenshots and check console errors/warnings. Preserve stable
input identity when streamed specs update.

### Step 3: Add an optional stream adapter only after its contract is clear

Refresh the official AI SDK and OpenAI API docs, inspect installed SDK docs and
types, then define a versioned Fable UI message payload. Keep the adapter behind
an optional entry point; base React imports must not load AI SDK/provider code.
Reuse Fable validation and host maps. Add readable text fallback and cover
abort/cancel, malformed and oversized chunks, replay/duplicate updates, stable
IDs, unknown versions, and terminal errors. The adapter must not resolve
business data, authorize requests, or invoke actions.

**Verify**: adapter tests with a local deterministic stream and a clean v2-only
consumer that imports pure primitives without AI SDK or Firebase. Do not send
credentials to a model provider during these tests.

### Step 4: Prove one host-owned Next.js use case and decide evaluation scope

Use an isolated example consumer to install v2 and render a host-authorized
result through opaque IDs. Prove no duplicate fetch or module-level
cross-request cache. State exact tested Next/React/Tailwind versions; do not
say “any Next.js app” unless a documented compatibility matrix supports that
claim.

The deterministic benchmark script requires an isolated
`FABLE_PROTOCOL_BENCH_ROOT`. Set it only when dependencies are available; keep
wire bytes separate from model tokens, latency, and quality. A live comparison
requires at least 72 prompts and a separate budget decision because the current
local cap is 25. If approval is absent, keep the evaluation as an explicit open
gate and make no model-quality or superiority claim.

**Verify**: clean consumer install/typecheck/lint/build and a host-boundary
test proving model IDs cannot select unknown values. If network or host
authorization is unavailable, report that gate without substituting an older
smoke result.

### Step 5: Finish docs and hand off the draft PR

Document actual install commands, supported versions, static React use,
optional AI stream use, authorized data use, empty/error states, and v1-to-v2
migration. Provide three copyable agent prompts (static components, AI chat,
authorized data) only when their steps match tested behavior. Update the RFC,
decision record, and execution evidence; label remaining deferred server/action
work as future scope. Review the final diff, commit logically, push only the
feature branch, and update PR #6 while leaving it draft.

**Verify**: `pnpm skill:check`, all relevant tests/build/consumer results, a
clean diff, and confirmed PR head/draft/unmerged state.

## Test plan

- Keep all current v1 tests and all 13 v1 registry entries. Add regressions for
  every new schema, layout, state, keyboard, RTL, reduced-motion, stream, and
  host boundary.
- Model link tests must retain literal and encoded dot-segment escape cases,
  unknown IDs, unsafe schemes, credentials, whitespace/control characters, and
  host-owned labels. Model text/code must remain inert.
- Consumer tests must prove the pure import path works without an AI SDK,
  provider, Firebase, or Fable data service. The adapter can be installed and
  tested separately.
- Re-run the full bounded Vitest command, typecheck, lint, registry validation
  and build, consumer smoke, and production build. Record actual outcomes and
  environment blockers independently.

## Done criteria

- [ ] v1 exports, examples, and all 13 registry items remain available.
- [ ] A component inventory documents reuse, gaps, and test evidence.
- [ ] The pure v2 component layer is provider-free, accessible, responsive, and
      documented; optional AI integration remains an optional import.
- [ ] The optional adapter passes abort, malformed input, replay, stable-ID,
      version, and fallback tests.
- [ ] A clean Next.js consumer proves install and host-owned data use, with
      tested framework versions named accurately.
- [ ] Tests, typecheck, lint, registry, consumer, and production build are
      rerun; blocked results remain explicitly unverified.
- [ ] Any 72-prompt quality evaluation has explicit budget approval and reports
      validity, usefulness, retry rate, latency, and cost separately.
- [ ] Docs and skill-check output match tested behavior; PR #6 stays draft and
      unmerged; no commit reaches `main`.

## STOP conditions

- The remote branch, PR base/head, or working tree differs and cannot be
  reconciled without overwriting work.
- Implementation requires changing v1 behavior, adding a mandatory provider,
  reading production secrets/data, or changing authorization/action behavior.
- The plan would exceed the 25-prompt evaluation cap or incur unapproved model
  charges.
- A host-authorized example requires a real app/account/credential that is not
  explicitly available for the task.
- A dependency's current API or license conflicts with the accepted contract.
- A security, accessibility, or v1 regression cannot be fixed within scope.

## Maintenance notes

- Revisit the data/action RFCs only with a named consumer use case and a written
  host authorization contract. Their acceptance requires independent security
  and tenant-isolation review.
- Re-check the Next.js and AI SDK guidance whenever versions change; the
  repository explicitly warns that its Next.js APIs differ from prior
  conventions.
- The protocol benchmark from the earlier branch is not a quality benchmark.
  Keep it historical unless rerun from a configured isolated install.
