# Fable UI 2.0: protocol and integration decisions

- Date: 2026-10-30
- Status: Accepted for an experimental, additive vertical slice
- Scope: protocol boundary, data contract, and v1 coexistence

## Verdict

Fable should provide a hostable, copy-and-own React design system for agent
interfaces. The product opportunity is useful composition inside an existing
application: strong typesetting, readable rich text, compact data views,
responsive layouts, and reviewable interaction patterns that inherit the
host's theme. This can complement GPT-6 Intelligent UI without copying its
ChatGPT-specific compiler or implying that OpenAI exposes it as an embedding
SDK. The public material reviewed for this decision does not describe an
embeddable GPT-6 UI runtime; that is an inference from the published product
and API material, not a statement about private OpenAI systems.

Choose `@json-render/core` only as an optional JSONL/JSON-Patch stream
compiler. Fable owns its strict component catalog, prop validation, host-data
resolution, stable React identity, accessibility behavior, and rendering. Do
not use `@json-render/react` as the Fable renderer. Keep OpenUI Lang as a
benchmark and possible future adapter, not a production dependency in this
slice. Plain components remain usable without either protocol, an AI SDK, a
provider, or a Fable server service.

Every incoming patch is parsed and allowlisted before it reaches the compiler:
only `add`/`replace` on `/root` or `/elements/<safe-id>`, with a typed bounded
value, is accepted. Deep JSON Pointer paths, removals, action/state fields,
unknown node props, and prototype-related IDs are rejected before compiler
state can be mutated.

The model may describe **which** allowed view to show and provide bounded
explanatory copy. It cannot author business values, arbitrary URLs, resource
queries, callbacks, actions, CSS, HTML, or code. Metrics, chart series,
entities, tables, images, and filter options resolve from host-owned IDs and
data that the host has already authorized. A missing or mismatched ID renders
an explicit unavailable state. The renderer never fetches to resolve it.

The implementation is additive. Existing v1 registry entries, integrations,
drivers, provider, route, and public APIs remain unchanged. No generic v2
server-resource abstraction is added until an actual consumer proves its
contract and authorization boundary.

## Assumptions changed or rejected

| RFC assumption | Decision | Reason |
| --- | --- | --- |
| The adapter can be summarized as `render(response, streaming)`. | Rejected as underspecified. A stream has a session, bounded parser state, validated snapshots, stable IDs, cancellation/error states, and host data. Keep protocol parsing separate from the pure renderer. | A boolean cannot express partial, invalid, canceled, or stale output, and it hides state-preservation requirements. |
| Metrics, charts, and entities may be represented with model-supplied values. | Rejected for business data. Specs refer to opaque host-owned `resultId` values; the host passes a matching typed result map. | Prevents hallucinated or cross-tenant values from being presented as authoritative. |
| A new `defineFableResource` server abstraction should be accepted in principle. | Deferred. The v1 resource registry remains intact; v2 starts with resolved host data and inert display specs. | The prototype has no consumer evidence to justify another fetch/cache/authZ layer. |
| OpenUI Lang and json-render React renderers are equivalent candidates for an embedded app library. | Revised. Compare both protocols, but separately evaluate core parsing and React rendering. Use json-render core only; Fable owns rendering. | `@json-render/react@0.21.3` declares React `^19.2.3`, narrower than the React versions used by many Next.js apps. |
| A stronger demo should add an optional model/API key. | Deferred. The first demo is deterministic and explicitly labeled; host model transport is an integration seam, not an embedded key flow. | A static fixture proves the renderer and interaction without credentials, provider coupling, or misleading model-quality claims. |
| Use the existing v1 chart component for the v2 slice. | Rejected for this slice. Add a small accessible SVG chart with a host-owned series reference. | The existing chart module re-exports a tool definition and imports the AI SDK; that would violate the provider-free component boundary. |

## Weighted comparison

Scores are engineering judgments for this Fable use case, not benchmark output.
Each category is scored 1–5 and multiplied by the stated weight. The scores
should be revisited if a real model/prompt evaluation changes the evidence.

| Candidate | Trust boundary and allowlisting (30%) | React/Next compatibility (20%) | Streaming and recovery (20%) | Wire compactness (15%) | Maintenance ownership (15%) | Weighted score |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| OpenUI Lang parser + Fable-owned renderer | 4 | 4 | 4 | 5 | 3 | 4.00 |
| json-render core compiler + Fable validation and renderer | 4 | 5 | 5 | 3 | 4 | 4.25 |
| Fable-owned JSONL patch protocol and compiler | 4 | 5 | 3 | 4 | 2 | 3.70 |

OpenUI's grammar is concise and its parser exposes incremental results and
unknown-component errors. The current React Lang package family is MIT
licensed, but `@openuidev/lang-core@1.0.2` installs telemetry by default; its
docs describe opt-out environment variables. That is manageable, but an
unnecessary default-install concern for a copy-and-own UI package. OpenUI's
parser also does not replace Fable's strict validation of component-specific
data references or host authorization.

json-render's SpecStream is more verbose in this deterministic fixture set,
but `@json-render/core@0.21.3` provides a framework-neutral incremental
compiler and JSON Patch stream. Its structural `validateSpec` accepted the
unknown component and extra `style` prop attack cases in the benchmark, so
Fable must apply strict Zod schemas and exact component allowlisting before
rendering. The React package is intentionally excluded to avoid its narrow
React peer range and keep renderer ownership with Fable.

The GPT-6 Intelligent UI announcement is a product/design reference for
progressive useful UI, not a third-party library candidate. Fable should
surpass it for its own use case through transparent data provenance, host
theme and component ownership, explicit app-specific interaction, copyable
installation, and support across compatible Next.js apps. It should not claim
parity with OpenAI model training or private runtime behavior.

## Protocol benchmark: deterministic baseline

The implementation workflow ran 12 authored, semantically matched fixtures
through OpenUI Lang and json-render using `@openuidev/react-lang@1.0.2`,
`@json-render/core@0.21.3`, `@json-render/react@0.21.3`, React 19.2.4, and Zod
4.4.3. The package experiment was installed in a temporary isolated directory
with install scripts disabled; project manifests were not changed for the
baseline.

| Observation | OpenUI Lang | json-render SpecStream |
| --- | ---: | ---: |
| Encoded fixture bytes | 1,995 | 5,661 |
| Fixture nodes | 36 | 36 |
| Streaming evidence | Root and nodes became visible while chunks were pushed | 48 JSON Patch operations were compiled while chunks were pushed |
| Unknown component | Parser reported one error | Structural validation accepted it; Fable strict validation rejected it |
| Unknown `style` prop | Not applicable to the declared component props | Structural validation accepted it; Fable strict validation rejected it |

These are serialized byte counts, not model tokens. Fixtures were authored by
the benchmark, not generated by GPT-6.1 Sol or another model. The run does
not measure model quality, semantic selection, first useful paint in a
browser, bundle size, accessibility, persisted user state, or consumer
compatibility. The bytes show a wire-format tradeoff only. The runnable
benchmark is `scripts/benchmark-fable-ui-v2-protocols.mjs`.

The security result is the decisive one: both protocols require Fable's own
strict schema and host-data resolver. json-render core is selected because
its patch compiler gives Fable useful incremental structure while leaving
component behavior, theme, state, and trust policy under Fable's ownership.
If the optional core dependency causes unacceptable installation or
compatibility cost in the consumer smoke test, the fallback is an internal
small JSONL patch adapter behind the same Fable contract, not adoption of the
json-render React renderer.

## Repository baseline before v2 UI implementation

- `pnpm exec vitest run --pool=threads --maxWorkers=2 --reporter=dot` passed:
  16 test files and 71 tests. The default fork pool timed out while starting
  seven workers when run alongside typecheck and lint; the bounded thread-pool
  run completed cleanly.
- `pnpm typecheck` passed.
- `pnpm lint` passed with 0 errors and 40 existing warnings.
- `pnpm registry:check` passed: 13 current entries validated, 70 published
  source files linted, two focused registry smoke installs passed, and
  typecheck passed.
- `pnpm registry:consumer-smoke` passed: all 13 entries installed in an
  isolated consumer, with typecheck after each install, final lint, and a
  production build.
- `pnpm build` passed on Next.js 16.2.6: optimized build compiled and all 35
  static pages generated. The build reports that it skips TypeScript
  validation due to the existing config; standalone typecheck is therefore
  part of this baseline.

These are pre-change checks. They do not prove v2 behavior or browser
usability; those must be verified after the vertical slice is implemented.

## Experimental slice verification — 2026-10-30

The implementation keeps all 13 existing registry items and adds two
experimental items: `v2-primitives` and `v2-renderer`. The first publishes
copy-and-own React primitives; the renderer adds the optional
`@json-render/core` patch compiler and Zod. Neither item requires an AI SDK,
Firebase, or a Fable data provider.

The `/v2/playground` route uses a labeled, deterministic fixture and eight
validated patches. The browser review exercised local filtering and stream
cancellation, which kept the last valid visible snapshot. At 320, 390, 768,
and 1280 CSS pixels, the document had no horizontal overflow after a shared
site-header padding fix; entity layout moved from one to two to three columns.
Light and dark themes were inspected, and the browser reported no console
errors. This validates the local fixture flow only; there was no live model,
provider, authorization service, or production deployment in this test.

The deterministic protocol benchmark remains limited to fixture structure and
encoded bytes: OpenUI used 1,995 bytes; json-render SpecStream used 5,661
bytes over 48 patches for 12 authored fixtures. Those numbers are not model
tokens, latency, quality, bundle size, accessibility, or rendering metrics.

## Data contract

The protocol shape follows a flat `root` plus `elements` map so a patch can
replace one stable element. This slice accepts only a bounded tree:

```ts
type FableElement = {
  type: "Text" | "RichText" | "Metric" | "EntityList" | "Chart" |
        "Filter" | "Media" | "Stack" | "Grid" | "Section" | "Surface"
  props: unknown // parsed against the exact schema for `type`
  children: string[]
}

type FableViewSpec = {
  root: string
  elements: Record<string, FableElement>
}

type FableViewData = Record<string,
  | { kind: "metric"; label: string; value: number; format: "number" | "currency" | "percent"; currency?: string; unit?: string; locale?: string }
  | { kind: "entity-list"; label: string; valueLabel?: string; locale?: string; items: Array<{ id: string; name: string; location: string; description: string; value: number; unit?: string; changePercent?: number; filterValues?: Record<string, string> }> }
  | { kind: "chart"; label: string; points: Array<{ label: string; value: number }>; format: "number" | "currency" | "percent"; currency?: string; locale?: string }
  | { kind: "filter"; label: string; allValue: string; options: Array<{ label: string; value: string }> }
>

type FableAssetCatalog = Record<string, {
  src: string // host-curated local image path
  alt: string // host-owned alternative text
  decorative: boolean
}>
```

For `Metric`, `EntityList`, `Chart`, and `Filter`, the model-facing props
carry only a bounded `resultId` or `filterId`; the host-supplied map must
contain that ID and the expected kind. Factual labels, units, values, filter
option labels, image alt text, and decorative status come from the host
result or asset map. The model cannot relabel a host value as a different
business measure. For `Media`, `assetId` resolves against a host-provided
asset catalog. Rich text is a bounded array of plain text and known marks
(`plain`, `strong`, `emphasis`, `code`), never raw HTML or a model URL. `Text`
strings remain model-authored explanatory text and must not be treated as
provenance or as a substitute for a host result. User-entered filter state
stays keyed by host filter ID; a stable element under the same parent keeps
its DOM and focus for prop and Stack-direction updates. Reparenting a node may
remount its DOM and does not guarantee focus continuity.

The direct-spec validator enforces, at minimum: exact keys per component,
known component names, identifier syntax, a single existing root, all child
references resolved, no cycles, no orphans, maximum 32 elements, maximum
depth 6, maximum 24 children per element, and component-specific string/array
limits. Stream snapshots are projected from the current root and validated
before they replace the last valid view. A root swap can wait for its new
element while the previous view remains visible; superseded unreachable nodes
are pruned, while unresolved child references fail at stream completion.
Invalid updates leave the previous snapshot visible and expose an error state
without logging the payload.

The public component API remains ordinary React props. The data-reference
contract belongs only to the optional model-facing adapter; consumers can
render the same components directly with their own typed values and callbacks.

## Threat model and controls

| Threat | Control in this phase | Deferred boundary |
| --- | --- | --- |
| Prompt injection in model or row text | Treat all copy as inert text; no interpretation, links, or tool calls from it; display source labels separately. | Product-specific trust UX and content review policy. |
| Arbitrary URL, HTML, CSS, or code execution | No URL, raw HTML, CSS, expression, `eval`, or component-name lookup outside the fixed catalog. `assetId` resolves only in a host catalog. | Optional HTTPS links require a separately reviewed URL policy and user affordance. |
| Authorization or tenant bypass | Renderer performs no fetch, authorization, or action. Host passes already-authorized values; unknown IDs fail closed. | Any server adapter requires host authZ/tenant review before implementation. |
| Unauthorized mutation/replay | No actions or server mutations are in the first slice. Local filter is read-only and scoped to the current view. | Confirmations, idempotency, replay defense, and action audit before any future action catalog. |
| Cross-request caching or data leakage | No module-level data cache; demo data is static and non-sensitive. Per-view state stays in the component instance. | Any cache requires tenant/session key review, expiry, invalidation, and no cross-tenant reuse proof. |
| Oversized/deep/malformed stream | Bound bytes, element count, depth, arrays, and strings; validate before commit; retain last valid snapshot; stop parsing after a terminal error. | Load and fuzz testing at real stream limits. |
| Streaming identity/state loss | Model element IDs are stable keys; local interaction state is keyed by those IDs; invalid patches do not replace the current tree. | Cross-session persistence is out of scope. |

## Migration strategies, ranked

1. **Additive v2 namespace and preview registry entries — chosen.** Keep every
   v1 route, component, provider, driver, tool manifest, and registry URL
   available. Add v2 exports/files and a clearly labeled playground. This has
   the smallest rollback surface and gives existing consumers no migration
   work.
2. **Compatibility adapter from v1 tool results to v2 view data — defer.**
   Useful only after a real consumer proves which validated v1 result should
   be reused and how its authorization identity reaches the v2 renderer. Do
   not refetch the same resource or expose client-only cache state implicitly.
3. **Replace v1 renderer/resources with v2 runtime — reject for now.** It
   broadens the change, makes rollback and consumer upgrades harder, and is
   unsupported by current benchmark or migration evidence.

## No-go conditions and fallback

Do not ship the v2 renderer as stable if any of these are true:

- an unknown component, prop, result ID, or asset can render or trigger a
  network request;
- patches can introduce cycles, unbounded nesting, unbounded text, or
  arbitrary callbacks/actions;
- values are accepted from model output where the host result map is the
  source of truth;
- a malformed patch replaces the last valid visible result or loses local
  control state for an unchanged element ID;
- a registry consumer smoke test overwrites or removes any v1 entry;
- the production build or strict standalone typecheck fails;
- the mobile layout has horizontal overflow or keyboard interaction is
  blocked;
- the example is presented as model-generated when it is a deterministic
  fixture.

If `@json-render/core` fails React/Next consumer compatibility or adds
unacceptable dependency cost, retain the public Fable spec contract and swap
the optional parser for a small internal JSONL patch decoder. Do not weaken
schema validation, host authorization, or the copy-and-own distribution
strategy to keep a protocol package.

## Sources reviewed

- OpenAI, [GPT-6 for Everyone](https://openai.com/index/gpt-6-for-everyone/) and [GPT-6.1 Sol API model docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
- OpenUI Lang [overview](https://www.openui.com/docs/openui-lang/overview), [renderer](https://www.openui.com/docs/openui-lang/renderer), [telemetry](https://www.openui.com/docs/openui-lang/telemetry), and [React API](https://www.openui.com/docs/api-reference/react-lang).
- json-render [streaming](https://json-render.dev/docs/streaming), [catalog](https://json-render.dev/docs/catalog), [specs](https://json-render.dev/docs/specs), and [`@json-render/react` package metadata](https://www.npmjs.com/package/%40json-render/react).
- Next.js 16.2.6 installed local docs: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`.

## Final implementation verification — 2026-10-30

| Check | Result |
| --- | --- |
| `pnpm test` | Passed: 19 files, 89 tests. |
| `pnpm typecheck` | Passed. |
| `pnpm lint` | Passed with 0 errors and 39 warnings; the baseline had 40 warnings, and no v2 source file added a warning. |
| `pnpm registry:validate` | Passed: all 15 registry items validated. |
| `pnpm registry:check` | Passed: 82 published source files linted, `quickstart` and `data-browser` install smoke checks passed, then root typecheck passed. |
| `pnpm registry:consumer-smoke` | Passed: all 15 items installed into a clean combined consumer and type-checked after each item; final consumer lint and production build passed. A separate clean v2-only Next consumer installed both v2 entries, type-checked after each, linted, production-built, and verified no direct AI SDK, OpenRouter, or Firebase dependency. `@json-render/core` resolved at the pinned `0.21.3`. |
| Root production build | Default Next build compiled, then its seven page-data workers ran out of memory. Retried with `CIRCLE_NODE_TOTAL=2` (one Next worker); `pnpm build` passed and generated all 37 routes, including `/v2/playground`. The project config skips build-time TypeScript validation, so the separate passing `pnpm typecheck` is required evidence. |
| Browser review | `http://127.0.0.1:3002/v2/playground` reloaded with the sample ready at eight validated patches. Selecting Cairo left only the Cairo property. At 320, 390, 768, and 1280 CSS pixels, document widths were 305, 375, 753, and 1265 pixels respectively (no horizontal overflow); the property grid used 1, 1, 2, and 3 columns. Light/dark themes and stream recovery were also reviewed. |

The preview remains a deterministic local fixture: no model, production data
provider, authorization service, or deployment was exercised. The browser
console retains nine earlier hot-reload errors/warnings from 09:28 UTC, before
the fixture and host-owned data corrections. After the final reload, the page
rendered all eight patches and the console returned no newer entries. This is
historical development evidence, not a current rendering failure.
