# RFC: Fable UI 2.0 — Agent-First, Composable, Data-Optional UI

Status: **Architecture reviewed; experimental additive vertical slice implemented**
Date: 2026-10-30
Base repository: https://github.com/shobky/fable-ui
Owner: Fable UI
Decision authority: repository maintainer
Working branch: planning/fable-ui-2-agent-first

## Review update — 2026-10-30

The protocol and trust-boundary decision is recorded in
[`fable-ui-v2-decisions.md`](./fable-ui-v2-decisions.md). The first v2 slice
uses the framework-neutral `@json-render/core` stream compiler behind Fable's
own strict catalog and React renderer; it does not use `@json-render/react`.
OpenUI Lang remains a benchmarked alternative. The current benchmark uses
deterministic fixtures, not model-generated output, so model quality and
semantic selection remain unmeasured.

The model-facing spec selects bounded display structure and explanatory copy.
Metrics, entities, tables, chart series, filters, and media resolve through
host-owned result or asset IDs. v2 begins with already-authorized host data;
the new generic server resource API and reactive query mode are deferred.
All v1 components, integrations, registry entries, drivers, and routes remain
available without migration.

This checkpoint is an experimental slice, not completion of PR-1 or PR-2.
It adds a deterministic stream playground, strict Fable validation/rendering,
host-owned result references, local filtering, semantic block rich content,
and host-approved links selected by opaque IDs. Live model output, the wider
layout/state catalog, general server resources, and stable-release gates
remain open.

## 0. Executive decision

Fable UI will evolve from individual AI-SDK tool-rendered components into an extensible **copy-and-own UI design system with optional generative composition**.

1. Preserve the shadcn registry, existing 13 published entries, working consumer installations, and MIT licensing.
2. Provide framework-ordinary React components with typed props that do not require an AI provider or Fable data provider.
3. Add an opt-in composable renderer capable of progressively rendering model-authored layouts from a tightly allowlisted catalog.
4. Evaluate OpenUI Lang against json-render before adopting an external UI protocol; do **not** build a proprietary compiler as the first milestone.
5. Replace implicit resource-driver coupling with three intentional data modes: inline props, authorized server tool results, and optional reactive queries.
6. Keep host-controlled auth, permissions, tenant isolation, actions, and all side effects outside the model.
7. Rebuild design foundations, documentation, and the public agent experience around outcome-oriented copyable prompts.

**No bulk migration or removal of v1 APIs before a running vertical slice, benchmark, migration adapter and consumer smoke test.**

### Success statement

A developer with Next.js and shadcn can ask a coding agent to install Fable; within a fresh consumer repository the agent can render a coherent streamed response with text, cards, an image, a chart and a filter; without touching Firebase, creating resource drivers or importing a Fable data provider.

An existing consumer of v1 must continue to work throughout the initial phases.

## 1. Evidence-based audit

### Reviewed source files

- README.md and registry.json: 13 public registry items; quickstart registers two display tools, not full catalog.
- lib/fable-ui/core/definitions.ts and tool-renderer.tsx: one tool-name → one schema-validated renderer; supports loading, streaming and error states.
- lib/fable-ui/core/types.ts: unified DataSourceDriver / ResourceConfig / ResourceRuntime, query and action types.
- lib/fable-ui/core/registry.ts: process-local driver and resource registrations, browser/server instances independent.
- lib/fable-ui/core/provider.tsx: client-side query cache and snapshot publication; visible snapshot bounded at 100 rows, 12 columns, 64 KiB.
- lib/fable-ui/tools/get-rendered-data-tool.ts: client UI tool to return current rendered snapshot to model.
- components/fable-ui/data-browser/hooks/use-data-browser-query.ts: client fetch, snapshot lifecycle, local row mode.
- lib/fable-ui/drivers/{firebase,rest}: driver-specific querying and actions.
- components/fable-ui/charts/{charts.tsx,charts.types.ts,tool-definition.ts}: line/bar/pie Recharts, inline data.
- components/fable-ui/metric-card/metric-card.tsx: max-width card, large monospaced value and forced card wrapper.
- app/layout.tsx and app/globals.css: Geist, Geist Mono, shadcn/Tailwind, light/dark variables.
- content/docs/ai-sdk-integration.mdx, content/docs/data-sources/overview.mdx, content/docs/agent-setup.mdx, .agents/skills/fable-ui/SKILL.md.
- package.json: Next 16, React 19, AI SDK 7, Zod 4, Tailwind 4, shadcn registry.
- next.config.ts: **typescript.ignoreBuildErrors=true**; this must not be used as a quality signal. Use standalone typecheck now, consider removing the suppression once repository passes.

### Findings

F1. Current individual tool-per-component design restricts composition and increases per-component server/client registration work.

F2. DataBrowser already supports inline rows without resource IDs. This path should become the default story for all visual primitives.

F3. Resource-backed data is fetched by a client provider. The model sees a manifest, *not* inherently those rows. get_rendered_data is an explicit bounded bridge, not automatic omniscience.

F4. A server-returned tool result can be shared with model and UI; fetching an equivalent resource again inside the browser wastes work and risks inconsistent views.

F5. Existing v1 security boundaries are useful: don't pass SQL, Firestore paths, secrets, or authorization decisions from model into driver code.

F6. Current design lacks a common composition vocabulary and has inconsistent default card containment. Better visual hierarchy depends more on rhythm and layout than new accents.

F7. Website is code-first despite a substantial existing agent skill. Preserve the skill and make generated copyable prompts the front door.

F8. The current homepage demo is narrow and uses hardcoded demo sales data; a v2 showcase must demonstrate the real renderer with honest mock/live mode labeling.

## 2. External research and limits

### OpenAI Intelligent UI

OpenAI explicitly describes native streamable components, a progressive compiler, and model training for layout/interactivity:
https://openai.com/index/gpt-6-for-everyone/

The full ChatGPT renderer/compiler is not announced as an embeddable public API module. Use GPT-6.1 Sol for the Codex implementation workflow, but don't assume API responses automatically render ChatGPT Intelligent UI:
https://developers.openai.com/api/docs/models/gpt-6.1-sol

An independent OpenUI blog attempts to infer a DIL/JS/runtime architecture. Treat this as third-party analysis, **not authoritative OpenAI internals**:
https://www.openui.com/blog/how-chatgpt-intelligent-ui-works

### Candidate protocols

**OpenUI Lang** — library from Zod schemas, model prompt generator, line-oriented streaming syntax, parser, renderer, client reactive query and mutation support, MIT license. Keep gateway service optional; proof must work locally and without paid gateway.
https://www.openui.com/docs/openui-lang/overview
https://www.openui.com/docs/openui-lang/defining-components
https://www.openui.com/docs/openui-lang/renderer
https://www.openui.com/docs/openui-lang/queries-mutations
https://github.com/thesysdev/openui

**json-render** — constrained catalog, declarative JSON / JSON patches, action and state bindings. Inspect current package APIs and licensing before adopting:
https://json-render.dev/
https://github.com/vercel-labs/json-render

**A2UI** — cross-platform declarative protocol and catalogs. Useful later for portability; not needed for initial React/shadcn-first delivery:
https://a2ui.org/

### Current interoperability research — 2026-10-30

- OpenUI's current `@openuidev/react-lang` release is 1.0.2 (MIT), requires
  React 19 or newer, and supports Zod 3.25 or 4. Its telemetry defaults to
  install-time collection while runtime collection is off; consumers can opt
  out. This makes it a viable optional integration, but it still brings a
  separate language/runtime surface and should not own Fable's host data
  contract.
- The installed `@json-render/core` is 0.21.3 (Apache-2.0, Zod 4). It adds
  `experimental_composeSpec` candidate-based composition and
  `experimental_createEvaluator`; these APIs are marked experimental, and
  the convenience evaluator uses Vercel AI Gateway by default. The evaluator
  can be supplied by the host, but the current slice does not exercise model
  composition or infer factual values. Keep the API out of the stable Fable
  contract until prompt quality and host-result boundaries are measured.
- The separate `@json-render/react` renderer declares a React `^19.2.3`
  peer range. The current React 19.2.4 consumer matches it, but older Next.js
  applications may not; keeping Fable on the framework-neutral core avoids
  taking that renderer peer range into its base surface.
- A2UI's current production protocol is 0.9.1, with 1.0 still a candidate.
  Its versioned, cross-platform catalogs are a future portability option; the
  added catalog negotiation is not needed for a React/Next-only vertical
  slice.
- Vercel AI SDK 7 exposes typed tool results and custom UI data parts in its
  message stream. A later adapter can carry validated Fable specs through
  those host-owned messages while keeping AI SDK optional in the component
  entry point.
- GPT-6 Intelligent UI's public announcement describes native streamable
  components and training for clarity, usefulness, and completeness. The
  public GPT-6.1 Sol model documentation does not describe an embeddable
  Intelligent UI runtime; that is an inference from the published API docs.
  Fable's differentiator should be copy-and-own Next.js primitives and
  host-owned evidence, with a model-quality benchmark before any claim that
  its generated layouts surpass GPT-6 Intelligent UI.

The live model-quality gate in the execution handoff calls for 12 fixtures,
three runs, and two models (72 prompts). The local evaluation configuration
is capped at 25 prompts, so this implementation records model-quality results
as unverified and does not exceed that cap. The deterministic protocol
benchmark compares encoding, validation, and stream behavior only.

The consumer smoke currently proves Next.js 16.2.6, React 19.2.4, and the
installed Tailwind stack. “Works in any Next.js app” remains a product goal,
not a verified compatibility claim; document the tested support floor and
smoke-test older supported Next/React combinations before making that claim.

Do not uncritically use vendor performance claims. OpenUI's published benchmark uses serializations derived from a shared format and some latency is estimated from token throughput; independently test real Fable prompts/providers:
https://www.openui.com/docs/openui-lang/benchmarks

### Selection rule

Run P0 with identical Fable catalog and **identical test tasks** on OpenUI Lang and json-render, using the actual installed versions. Choose OpenUI Lang if it passes reliability, licensing, accessibility, build-size, state persistence and no-gateway requirements; otherwise select json-render or defer protocol adoption. A faster token count by itself is not sufficient.

## 3. Architectural decisions (ADRs)

### ADR-01: Pure components as the foundation — ACCEPT

UI components accept conventional props and callbacks and may be consumed as React components without AI SDK, resource registry, tool implementations or global provider.

    <FableMetric label="Revenue" value={12540} unit="USD" />
    <FableDataTable rows={rows} columns={columns} />

No static data component invokes fetch directly. Client-only interactions (sorting already-present rows) are allowed.

### ADR-02: UI language isolated behind adapter — ACCEPT WITH BOUNDARY

Fable presentation components and strict per-component schemas are stable.
The selected stream parser is an optional integration module and must not
leak into base component props. The stream adapter accepts bounded chunks,
emits progressive validated snapshots from its current root, preserves
element IDs, and exposes loading, invalid, canceled, and error states. A root
swap keeps the previous valid snapshot until its replacement node arrives;
unresolved child references fail on completion. The exact exported API is
specified by the implementation and consumer smoke test; a boolean
`streaming` flag alone is not an adequate stream contract.

Catalog groupings: layout, typography, media, information, charts, forms/actions. Inject only relevant groups into each prompt to reduce output cost and confusion.

### ADR-03: Three data modes — ACCEPT

**A. Inline/default.** Ordinary React components render values supplied by
the host in typed props. A model-facing v2 spec may contain bounded text and
layout, but business values resolve from host-owned result IDs. UI rendering
does not require a Fable data provider.

**B. Server-sourced/model-visible.** Deferred for a later consumer-backed
design. If adopted, a host-owned authorized server tool returns a validated
business-data result; the UI reuses that result through opaque IDs and must
not re-fetch it. Any model-visible projection, provenance, and bounds remain
host-owned policy decisions.

**C. Optional reactive query.** Deferred beyond the first v2 slice. Any
future implementation requires a host-exposed allowlisted query ID and
validated arguments, server-enforced auth and policy, and host-provided
caching. The browser must not supply a resource name, URL, SQL, or database
path.

For B/C: **model awareness and UI awareness are different**. A browser-only query result is not automatically model-visible. On user request, run the corresponding authorized server query or provide a size-bounded current-view snapshot intentionally.

### ADR-04: Server resource contract — DEFER

Do not introduce `defineFableResource` in the first v2 slice. The following
signature remains a proposal only:

    const orders = defineFableResource({
      id: "orders.list",
      description: "List authorized tenant orders",
      input: z.object({ status: z.enum(["open", "closed"]).optional() }),
      output: ordersResultSchema,
      query: async (input, ctx) => {
        await ctx.requirePermission("orders:read")
        return ctx.db.orders.list({ tenantId: ctx.tenantId, ...input })
      }
    })

The v1 driver/resource integrations remain unchanged. A v2 server contract
requires a real consumer use case, host authorization review, tenant-bound
tests, and proof that the same authorized result is reused without an
unnecessary second fetch. Context and DB would be injected by the host server,
never sent by the model. Dynamic resource names, raw URLs, SQL, or Firestore
paths from model output remain prohibited.

Resource output passed to model and client must have a safe public projection, bounds, and an explicit consent/policy decision for sensitive data. Avoid serializing unbounded datasets into token context. For large datasets the model receives summaries, available aggregations, and controlled follow-up tools.

### ADR-05: Interactive operations — ACCEPT

Actions use an allowlisted action ID + validated payload. Distinguish (1) local UI state, (2) submit message back to assistant, (3) host query, (4) privileged mutation. Client buttons must not directly execute arbitrary model-authored code or URLs. Privileged operations require server authZ and appropriate approval UI; make writes idempotent and audit-ready.

A confirmation surface is not authorization; approval tied to action ID, specific arguments and expiry where appropriate.

### ADR-06: Stream updates preserve identity — ACCEPT

Use stable node IDs, parent-child topology, and progressive replacement only in model-produced parts. Existing input focus, cursor, local filter state, chart selection and scroll position should survive incoming chunks when node identity is unchanged. Test out-of-order reference resolution, cancellation, malformed output and repeated finalization.

### ADR-07: Styling — ACCEPT

Create scoped theme tokens applied through a Fable root class or component variants. No automatic global font rewrite on an individual component install. Defaults built atop shadcn primitives, Tailwind utilities and semantic CSS variables. Provide light/dark and RTL.

Typography candidates: Instrument Sans primary; Instrument Serif optionally for editorial accents; Geist Mono for code and selective data; Noto Sans Arabic fallback. Check font licenses and layout samples. Preserve host font unless opt-in theme installed.

### ADR-08: Compatibility — ACCEPT

- v1 registry URLs continue working.
- Existing quickstart and tool-renderer remain stable initially.
- New components land under isolated v2 namespace/registry entries; no silent overwrites of host files.
- Publish migration cookbook: v1 metric, chart, data browser, driver and get_rendered_data usage.
- No mass file moves until tests prove consumer installation and migration adapter.
- A semver major release is required for breaking removals.

## 4. Catalog and composition plan

Twenty reusable product surfaces (v1 reused/refactored where possible):

1. MediaImage — image ratio, safe sources, caption, zoom, fit, CSS grayscale/filter control.
2. ImageGallery — grid, bento, hero, lightbox, accessible selection.
3. MediaCarousel — responsive slides, keyboard/touch, reduced motion.
4. EntityCard — product, place, event, article/job with optional slots, not 15 unrelated props.
5. EditorialCard — image, title, excerpt, source, date, link.
6. ResultCollection — card/list/grid/carousel layouts, filtering/search/pagination where appropriate.
7. RichContent — semantic headings, paragraph, lists, quotes, links, code.
8. MetricCard — value, unit, delta, trend, sparkline, source.
9. Chart — line, bar, area, stack, donut, pie, scatter; precise whitespace and formatting.
10. DataTable — rows-first static table; optional external adapter.
11. Comparison — table/cards with explicit dimensions and tradeoffs.
12. MapView — host map SDK adapter, pin/carousel, no mandatory map vendor.
13. Timeline — historical/plan steps, dates, status.
14. ProgressView — milestones/checklists/progress.
15. FilterBar — pills/select/range/date/query state.
16. FormCard — schema-validated fields with host-controlled submission.
17. ConfirmationCard — explicit safe approval request.
18. SuggestedActions — follow-up prompts/actions.
19. ArtifactView — shared draft/editor shell with code, document and email adapters.
20. DetailPanel — entity attributes/actions/media in sidebar/drawer/inline mode.

Underlying noncatalog primitives: Stack, Inline, Grid, Columns, Container, Section, Surface, Spacer, Divider, ScrollArea, Tabs, Accordion; plus Heading, Text, Caption, List, Quote, Link, Badge/Pill, Icon, Code.

**Design constraint:** components may render without Card wrappers. Avoid badges when typography conveys the same information, and don't use colorful callouts as the default answer format.

### Composition presets

- editorial: title + introductory prose + media + related cards;
- insights: metric row + chart + explanation + evidence table;
- discover: filters + entity collection + optional map;
- compare: entity summaries + comparison matrix + decision factors;
- workflow: steps + form + confirmation + result;
- gallery: featured image + bento/grid + captions;
- itinerary: timeline + map + grouped places;
- troubleshooting: diagnosis + progressive steps + action checklist.

Model must be instructed to prefer plain text for trivial questions; composable UI is justified only when it improves understanding or action.

## 5. Design tokens and visual QA

Direction: editorial utility; off-white canvas, near-black ink, purposeful blue accent, accessible data series, restrained borders, generous whitespace.

Initial token intentions (NOT accessibility-approved palette):
- canvas #FAF9F6, ink #242827, muted #7C827D, blue #435ED7;
- spacing scale 4/8/12/16/24/32, card padding usually 20–24;
- controls about 8–10 radius; cards about 14–18;
- body 14–16 app UI / 16–18 editorial reading;
- data visuals use tabular numbers and localized formatters.

Define light/dark token values, 200/400% zoom behavior, reduced motion, RTL, and high-contrast semantics.

Charts: no arbitrary categorical line smoothing; zero baseline for bars; legible axes; right sized top/bottom margins; readable legend wrapping; accessible data summary; disabled/unavailable states; formatter for compact/currency/percent/large numbers; no invented data interpolation.

Media: v2 model output selects only a host-curated `assetId`; arbitrary URLs
and external image lookup are not accepted. The host owns each asset source,
alternative text, and decorative status. Grayscale/filter options must retain
focus indicators and accessible contrast.

Use Playwright screenshots at 360, 768, 1280 widths and light/dark; approve representative composition snapshots rather than rely on subjective reviews.

## 6. P0 protocol spike — must happen before migration

The deterministic PR-0 baseline has compared two isolated protocol encodings
for 12 authored fixtures. It does not satisfy the separate model-quality
benchmark below. Build two isolated prototypes of the **same** constrained
catalog and examples before making model-quality or adoption claims:

- A: OpenUI Lang + its React renderer, without gateway dependency.
- B: json-render + corresponding React renderer.
- Optional C: simple JSON schema + existing Vercel AI SDK tools if A/B fail.

Representative fixtures: simple answer; one stat; three metrics+line chart; article+image; shopping 3-card comparison; five-image gallery; table+filters; form+confirmation (inert); timeline; trip locations/map placeholder; local-state calculator; malicious URL/action payload.

Test at least 3 full runs per case using GPT-6.1 Sol high reasoning and one low-cost model. Track:
- schema/parse validity and repair;
- prompt + output tokens (total, not just generated);
- time to first meaningful block, final render;
- visual match to shared screenshot reference;
- responsive rendering;
- input state survival under streaming;
- security boundary and permission enforcement;
- copy-and-own install complexity, lockfile/package weight;
- offline/air-gapped build, no required hosted gateway;
- accessibility and testability;
- licenses and maintenance risk.

Decision gate: before a stable model-driven release, the candidate must pass
zero arbitrary code/URL execution, deterministic action allowlisting, no paid
gateway dependency, stable rerender state, and consumer build. The current
deterministic benchmark selects json-render core only as an optional stream
compiler; it does not select a model-facing protocol on model-quality
evidence. Keep that claim provisional until repeated model runs are available.

Initial target goals (tune after baseline): >=95% syntactically valid final renders in the 12-fixture benchmark; >=90% semantic usefulness; no unapproved mutations; all fixtures satisfy screen-reader checks; single small component install requires no Firebase/AI SDK.

## 7. Implementation phases / PR scopes

### PR-0 — Review and spike (S)
- Create this RFC, Codex handoff, fixtures, evaluation template.
- Review actual source and correct outdated assumptions.
- Implement isolated OpenUI and json-render examples behind unlinked playground routes.
- Document protocol and license decision; do not modify v1 runtime.
**Done:** deterministic fixture benchmark and ADR recorded in
`fable-ui-v2-decisions.md`. Same-runtime browser screenshots and model-quality
runs remain separate verification items; do not imply either was completed
by the parser benchmark.

### PR-1 — Foundation (M)
- Scoped design tokens and typography opt-in.
- Pure layout primitives (Stack, Inline, Grid, Container, Section, Surface, ScrollArea).
- Zod props library and render/empty/loading states.
- DOM/accessibility/reduced-motion tests.
**Acceptance:** standalone Next+shadcn consumer imports components without AI SDK/data provider, with passing typecheck.

**Current progress (not PR-1 complete):** the experimental `v2-primitives`
and `v2-renderer` entries install in an isolated consumer without adding an
AI SDK or provider in the earlier checkpoint. `FableRichContent` now supplies
bounded paragraphs, h2/h3 headings, ordered/unordered lists, quotes, literal
code, and host-approved links. A clean consumer smoke for this follow-on is
unverified because package resolution failed at the npm registry during DNS
lookup. Scoped theme tokens, the full proposed layout set, richer
empty/loading/error states, and broad keyboard/reduced-motion/RTL coverage
remain open.

### PR-2 — First real composition (M)
- Selected protocol adapter and catalog mapping.
- Pure components for typography/rich text, MetricCard, MediaImage, EntityCard, and Chart.
- One vertically integrated streamed response: heading + 3 entity references + chart + local filter.
- Resolve values and filter options only through host-owned, typed IDs; no model-supplied business values or server actions.
- Stable state/ID tests, model parsing tests and fallback to readable text.
**Acceptance:** a model-driven demo works on 360–1440px widths and both themes, with stable inputs.

**Current progress (not PR-2 complete):** the local playground renders a
deterministic stream with readable text, metrics, host-owned entities, a
chart, a local filter, block-rich explanatory content, and a host-owned guide
link. Cancellation keeps the last valid snapshot. Browser review covered
320, 390, 768, and 1280px in light and dark themes. This is not a live-model
demo; model quality, image composition, and the full 360–1440px acceptance
range remain unverified.

### PR-3 — Server data contract (M)
- defineFableResource with input/output Zod and host context.
- Server tool result projection reused for reasoning and render, with provenance.
- Avoid duplicate fetches for same request.
- Revise get_rendered_data as explicit, optional current-view snapshot, not default.
- REST/Firebase cookbook with tenant isolation tests.
**Done:** model sees exactly authorized server result; client requests cannot choose unknown resources; no data leak.

### PR-4 — Reactive browsing / actions (L)
- DataTable accepts plain rows or an opt-in authorized resource binding.
- Local filters, sort and pagination; server query on explicit interaction.
- Action registry with confirmation and idempotent host operations.
- Cache key scopes tenant/session/request; invalidate on mutation.
**Done:** local filters perform 0 LLM calls; mutation requires permission; cross-tenant access blocked.

### PR-5 — Media, layouts, interaction catalog (L)
- Remaining 20 surfaces, compositions and docs.
- Chart quality revision, image controls, gallery and carousel.
- Optional map integration with provider choice.
**Done:** regression screenshots and WCAG 2.2 AA-oriented checks pass.

### PR-6 — Agent-first docs and release (M)
- Website hero: live demonstrator + copy install prompt + choose use case.
- Docs: agent tab first, preview, ordinary React props, AI props/schema, states, copy buttons.
- Refresh .agents/skills/fable-ui references/doctor/preflight, preserve secure installation.
- Migration docs, registry consumer smoke, release notes and deprecations.
**Done:** test installer with a clean repo and two existing shadcn repos; all v1 examples still pass.

Sizes represent relative scope, not time guarantees.

## 8. Agent and docs requirements

Homepage call-to-action is not "read tool definitions"; it is "Describe what you need; install Fable with your coding agent."

Provide 3 copyable prompts: (1) static React components, (2) generative AI chat renderer, (3) authorized live business data. Use the existing agent skill as source of installation safety: inspect dependencies/aliases, dry-run registry writes, review collisions, never overwrite blindly, validate host.

Every component page should show working story first, mobile/dark variants, state examples, accessibility guidance, command/prompt, React API, AI catalog schema and "when not to use".

Prompt builder should copy text without revealing env values or writing secrets into public demos.

## 9. Data security model

Trust categories:
- model-created display text, image URLs, props, filter values = untrusted;
- host input and server tool result = trusted only **after** validation and permission checks;
- client session = not trusted as authorization;
- renderer = no JS eval, custom HTML insertion, arbitrary fetch, unrestricted navigation or dynamic code execution;
- resource map/action map = allowlisted and host-owned.

Security test cases: URL javascript/data schemes, SVG/external embeds, HTML injection, prompt injection inside rows, cross-tenant resource query, unauthorized mutation, replayed approval, oversized payload, deeply nested UI, high-frequency rerender, telemetry/secrets leakage.

No sensitive data in public examples; prompt can include only safe resource descriptions (not tokens, query templates, table/collection locations). Enforce max nodes/depth/media count/rows at schema boundary. Log errors without sensitive payloads.

## 10. Performance and DX acceptance

- Tree-shakeable pure primitives; no accidental Recharts or Firebase on metric-only install.
- Registry pieces validate with pnpm registry:check and consumer smoke.
- v1 tests, typecheck and lint green. next.config.ts currently ignores build TS errors; standalone pnpm typecheck is mandatory.
- Existing quickstart continues working.
- Streaming cancel/retry never leaves broken half-executed effects.
- No unverified live data claims in demo.
- Documentation links and prompts match actual release state, not roadmap.
- At least one demo must work from static fixtures without an API key.
- No unexplained addition of new global provider, cache or driver layer.

## 11. Rollout and rollback

Publish v2 components under new registry names initially (e.g. v2-stack, v2-metric, v2-renderer; final naming chosen after registry lint validation). Keep v1 items, old install URLs and tool manifests unchanged. Hide unfinished catalog from public docs or label "experimental". Feature-flag renderer route. Roll back via disabling new registry pages/routes; no v1 data migration required.

After successful consumer smoke, optionally introduce a semver-major consolidation with automated migration guide/codemods; don't delete v1 types without a dedicated compatibility PR.

## 12. Codex review mandate

GPT-6.1 Sol must read this entire RFC, inspect current files, challenge assumptions, and improve the plan with an explicit decision log before touching production paths.

In particular decide:
1. Whether Fable should adopt OpenUI Lang rather than json-render, with measured tradeoffs;
2. Whether separate data resource abstraction is really needed or host tool results suffice for most use cases;
3. Whether pure React components should be the only published library and rendering adapters shipped as recipes;
4. How to preserve model access to data in a secure single-fetch path;
5. How to scope styles and font assets without disrupting consuming app;
6. How to keep backward compatibility with 13 registry entries;
7. How to split PRs so each gives independently demonstrable value.

Proceed with PR-0 prototype after documenting the decisions; if proposal is materially changed, edit this RFC and explain why. Never silently switch architecture or rewrite main.

## 13. Source links

- https://github.com/shobky/fable-ui
- https://openai.com/index/gpt-6-for-everyone/
- https://developers.openai.com/api/docs/models/gpt-6.1-sol
- https://www.openui.com/docs/openui-lang/overview
- https://www.openui.com/docs/openui-lang/defining-components
- https://www.openui.com/docs/openui-lang/renderer
- https://www.openui.com/docs/openui-lang/queries-mutations
- https://www.openui.com/docs/openui-lang/benchmarks
- https://json-render.dev/
- https://github.com/vercel-labs/json-render
- https://a2ui.org/
- https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage
- https://ui.shadcn.com/docs
