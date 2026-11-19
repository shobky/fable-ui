# Fable UI: independent product and architecture research

Prepared for Opus 5.5 on 2026-11-13. Research and implementation handoff; no source changes made.

## Decision brief

Prioritize adoption inside existing products before expanding the catalog. Fable already has useful breadth: 24 content blocks, three layouts, bounded schemas, streaming rendering, host actions, and copy-owned styling. Its next advantage should be reliable, attractive task surfaces that fit the host application's UI, data and lifecycle.

Recommended sequence: repair integration contracts; establish modular installation and a tested existing-app path; organize documentation around user tasks; deliver two distinctive composition recipes; validate design and real consumer workflows. Avoid a wholesale protocol rewrite or a large new catalog before these work.

## Evidence and limitations

Working baseline: D:/fable-ui, branch planning/fable-ui-2-agent-first, HEAD 06318ea, one commit ahead of the tracked remote. Dirty provider/eval files and untracked BYOK/workspace/browser database modules exist. Preserve them and establish ownership before implementation. They are not proof of shipped functionality.

This research inspected current source and primary external documentation. It is not a browser usability study, performance benchmark, or proof that all components are visually polished. Earlier checks in this chat: 45 tests passed, 14 skipped; lint had zero errors and 19 warnings; registry check passed for three items/29 files; typecheck failed in malformed generated Next types. Do not present those earlier results as validation of future changes. Production build and clean consumer install remain unverified.

The public PR #6 describes the older experimental architecture. Reconcile its scope before using it as a release specification. The earlier live checks found the three new registry URLs returned 404. Recheck deployment before implementation; this is a release condition, not an architectural defect in the registry format.

## What to preserve

- One render_ui entry point is an understandable default for model integration.
- Keep bounded model data, independent block validation, host-controlled actions, image policy and deterministic Markdown export.
- Container-relative layouts are appropriate for embedding in cards, panels and chat messages.
- Keep the optional starter; make existing-app installation the primary documentation journey.
- Keep the two-level layout constraint until a real workflow demonstrates that it is insufficient. A more expressive tree introduces streaming, validation and interaction complexity.

## Confirmed issues and design constraints

| Finding | Evidence | Consequence and recommended change | Priority / effort / confidence |
| --- | --- | --- | --- |
| Existing-chat example omits stream lifecycle | components/fable-ui/tool-part.tsx defaults active=true and documents interruption handling; content/docs/installation.mdx renders it without active | Stopped input-streaming parts remain treated as streaming. Pass the host chat's active status and test stop, transport failure and history replay. | P1 / S / high |
| Renderer-only users install the AI SDK and all block dependencies | registry.json bundles tool.ts, tool-part.tsx, charts and all blocks into fable-ui | Offer a genuinely renderer-only path; separate optional AI SDK adapter and chart pack. Keep current aggregate item as a convenience bundle. Measure installed dependencies and built output before claiming bundle savings. | P1 / M / high |
| Client entry reaches tool initialization | tool-part.tsx imports FABLE_TOOL_NAME from tool.ts, which imports ai and initializes fableTool | Put shared protocol constants/types in an inert module. Verify client output before assigning a performance severity. | P2 / S / high on coupling, unmeasured on size |
| State is scoped by positional block paths and a default renderer ID | renderer.tsx uses positional item keys and id="fable"; provider.tsx stores a Map and initializes state only once | Two default-ID renderers under one provider can collide; inserting/reordering blocks can associate edits with the wrong content. Define explicit stable surface/block identity for persisted or mutable surfaces. Preserve positional fallback for legacy append-only specs. | P1 for reusable surfaces / M / high |
| Persistence is provider lifetime only | provider.tsx useState(Map), no persistence adapter | Document this accurately. Add optional controlled state/export-import hooks only with versioning, scope cleanup and sensitive-data boundaries. Do not silently persist drafts globally. | P2 / M / high |
| Extending a block requires edits in multiple central files | content/docs/custom-blocks.mdx; schema.ts, renderer.tsx, skeleton.tsx, to-markdown.ts, prompt.ts | Introduce a small typed catalog definition or generated manifest connecting schema, renderer, prompt, fallback and examples. Prototype with one custom block before replacing the existing switches. | P2 / M / high |
| Documentation overstates portability | installation.mdx says Next 15 works and any shadcn style; only one app configuration is evidenced | Publish tested configurations and separate renderer requirements from starter requirements. Broader support must follow consumer tests. | P1 / S-M / high |
| Surface identity is not consistently instance-safe | chat/fable-composer.tsx uses a constant DOM ID | Use instance-safe IDs and test two embedded chats with label associations. | P2 / S / high |

Security release condition: app/api/playground/route.ts can use a server API key for public live requests without an evident request quota or access boundary. Resolve before enabling paid public live mode. An installed starter must clearly explain host authentication, authorization and usage responsibilities.

## Surface taxonomy

Use two distinct views of the same catalog: user intent for discovery, implementation kind for developers. Do not rename every schema type or create incompatible aliases merely to reorganize documentation.

| User task | Current building blocks | Useful next recipe |
| --- | --- | --- |
| Understand | markdown, heading, callout, quote, code, article | Evidence brief |
| Compare and decide | metrics, table, chart, cards, details | Comparison workspace |
| Explore and inspect | image, gallery, sources, list, faq | Result list with detail inspector |
| Provide information | form, checklist, actions | Guided intake |
| Draft and revise | template, email, file | Reviewable revision |
| Plan and follow progress | list, checklist, metrics | Plan with explicit progress states |

Developer kinds: primitives (host buttons/inputs), content blocks, interactive blocks, layout compositions, workflow recipes, and optional application shells. Sections, columns and tabs are layouts; email is a task-specific surface; the chat shell is an application integration. Presenting them as equivalent components hides their different dependencies and contracts.

Every catalog entry should expose: purpose; appropriate and inappropriate use; required data; editable/read-only behavior; streaming policy; action capability; minimum useful width; empty/error states; keyboard behavior; persistence scope; Markdown fallback; dependencies; and installation item. Generate the docs inventory and model capability list from this metadata where practical. Keep model instructions concise rather than sending the entire documentation catalog.

Add faceted discovery: task, display versus interaction, data shape, width, streaming support, framework support, dependency weight, and readiness. Recipes should show both plain React and agent-driven examples.

## Existing-app adoption design

Provide four entry points, each with a complete minimal example:

1. Render existing JSON in a React panel. No model provider, chat hook or backend changes.
2. Add Fable to an existing AI SDK chat. Preserve host transport, tools, history, authentication and stop conditions; wire rendering and lifecycle explicitly.
3. Use an existing non-AI-SDK backend. Define a small transport-neutral spec/status contract; demonstrate complete and partial responses with cancellation and errors.
4. Install the complete Next chat starter when a user actually wants one.

Proposed dependency direction: schema/resolver/safety -> React renderer -> optional AI SDK adapter -> optional Next starter. The host owns routing, auth, tenancy, network requests, durable storage and design tokens. This is an architectural target, not a claim that today's registry already has those boundaries.

Do not promise support for every app. First prove Next App Router and a Vite React host with Tailwind v4 and the supported shadcn primitives. Investigate plain CSS and non-React adapters only after real consumer demand. Custom aliases, src/ layouts, existing components and portal theming need explicit checks.

Offer structured interaction events alongside the onReply convenience callback: surface ID, block ID, event name and validated values. Preserve types and provenance for forms, selections and draft edits. The host decides whether to send a user message, update local UI, or call its authorized backend. Never treat model-generated IDs or payloads as authorization.

For installation, avoid modifying host themes or replacing its chat route by default. Print planned files/dependencies, respect overwrite prompts, provide explicit font-token guidance, and keep themes optional. Registry dependency references and install-time CSS metadata are supported by shadcn; use official mechanisms before building a custom installer [S1].

## Creative opportunities

These are proposals, not implemented features. Build the first two as recipes using current blocks before inventing new schema primitives.

| Proposal | Why useful and composition | Required behavior | Priority |
| --- | --- | --- | --- |
| Evidence brief | Summary, key facts and expandable source evidence; useful in research, support and operations | Source IDs come from host data; missing evidence is explicit; sources remain keyboard reachable; show freshness without inventing confidence scores | First |
| Comparison workspace | A shortlist with shared criteria, tradeoffs and a detail inspector | Stable entity IDs, missing-value treatment, keyboard selection, narrow-screen stacked view, preserve selected options across updates | First |
| Reviewable revision | Original and proposed content with a concise change list | Accept/reject is explicit; preserve unsaved edits; conflicts and pending saves are visible; no silent overwrite or send | Next |
| Guided intake | Small groups of questions with a persistent answer summary | Host-defined branching and validation, back navigation without losing values, optional fields, server error recovery | Next |
| Plan and progress | Steps, owners, dependencies and execution state | Clearly separate proposed work from host-confirmed execution; updates are authorized; cancellation/retry states are real | Later |
| Result inspector | Compact result list alongside details, collapsing to a drawer on narrow containers | Keyboard focus return, stable selection, host pagination, empty/error states, no fabricated records | Later |

Avoid decorative dashboards with arbitrary metric tiles. A composition earns its place by helping someone complete a task. Likewise, avoid a generic model-programmed workflow engine, arbitrary JavaScript, unlimited layout nesting or a drag-only interaction. These would greatly expand risk and QA cost.

## Premium UI acceptance criteria

Premium quality requires repeatable review, not an adjective in a prompt. Establish a visual harness for every block and recipe: narrow embedded panel, phone, tablet and desktop; light/dark; long localized text; RTL content; keyboard-only use; reduced motion; loading, empty, error, disabled and success states.

Check visual rhythm, type hierarchy, readable line lengths, restrained surfaces, chart legibility, focus visibility, touch controls, media sizing and stable streaming geometry. Do not freeze dynamic text into brittle exact screenshot comparisons: use deterministic fixtures for visual regression and separate live-model task tests.

Record before/after screenshots and intentional differences. Test keyboard behavior manually for dialogs, tabs and composite controls. Use native tables for tabular reading; an ARIA grid needs explicit focus and arrow-key behavior and should only be introduced when the task requires it [S4].

Streaming must preserve user focus and edits, avoid announcing every token, show understandable interruption states, and avoid repeatedly moving the reader's scroll position. Verify multiple surface instances, remounts, replayed history and response replacement. These scenarios matter more for embedding than a single polished demo.

## Opus 5.5 execution sequence

### Phase 1: reliable contracts

Read AGENTS.md and relevant installed Next guides. Inspect git status and preserve unfinished user work. Fix the provider/export mismatch on the agreed source baseline. Repair generated-type state safely without discarding source. Add behavioral tests for interrupted tool parts, two renderer instances and scope changes. Establish green typecheck, tests, lint and build. Document any failure rather than suppressing it.

### Phase 2: prove adoption

Prototype the dependency split with one renderer-only consumer and one existing chat consumer. Keep aggregate registry URLs compatible. Verify installed source imports, aliases, optional chart loading and exported APIs. Run clean consumer installs in Next and Vite; verify production output and that no host routes/theme overrides are introduced unexpectedly. Do not claim a bundle improvement without measuring before/after under the same build.

### Phase 3: taxonomy and two recipes

Create shared catalog metadata and generate inventory checks. Reorganize docs around the task taxonomy with migration redirects for removed public pages. Build evidence brief and comparison recipes using existing blocks where possible. Escalate schema changes only when composition cannot express the required behavior.

### Phase 4: design and release proof

Run the visual and interaction matrix. Verify public registry URLs after deployment; update PR scope and migration docs. Have an independent reviewer inspect action boundaries, identity/state changes and compatibility. Launch claims must match the tested stack and actual implemented recipes.

Verification commands from the repository: pnpm test; pnpm typecheck; pnpm lint; pnpm build; pnpm registry:build; pnpm registry:check; pnpm registry:smoke; pnpm skill:check. Inspect scripts before execution. Live pnpm eval calls incur model cost and need an explicit bounded evaluation scope; do not reuse old scores as current evidence.

Definition of done: a developer adds one useful surface to an existing app without adopting Fable's chat or backend; two simultaneous surfaces keep independent state; interrupted streams settle correctly; structured actions preserve host authorization; the documented install works from a clean consumer; screenshots and keyboard evidence cover the promised states.

Stop and report if the implementation would overwrite existing user work, require a protocol migration without a compatibility strategy, expose server credentials, or require a new action authorization framework. Resolve architecture with the maintainer rather than silently broadening the product.

## Independent review synthesis and rejected recommendations

Two separate read-only investigations covered integration and surface design. Both favored modular adoption, task-oriented discovery, explicit state ownership and richer evidence/inspection workflows. The root review retained recommendations supported by directly inspected source and narrowed speculative architecture.

- Do not report custom aliases as inherently broken: shadcn can resolve consumer configuration. The actual gap is missing consumer proof for alias and src/ combinations.
- Do not move canonical source into a different directory solely to imitate a registry convention. Current source paths are not themselves a correctness defect; avoid duplicate canonical implementations.
- Defer npm package publishing. Modular registry items can establish the boundaries first. Packages add versioning, exports, peer dependencies and support obligations.
- Do not put the AI SDK tool in a supposedly framework/transport-independent core. Keep shared schema and protocol types separate from its adapter.
- Do not label client host-action callbacks insecure by themselves. The existing docs already require server authorization. The requirement is to make that boundary easy to implement and impossible to mistake for client confirmation.
- Do not claim a larger catalog causes selection errors without comparative evaluation. Catalog subsets are an available optimization to measure, not proof of poor current model performance.
- Do not add model-generated confidence percentages to recommendations. Use evidence, assumptions, missing information and host-supplied provenance.
- Do not call existing layouts recursively composable or existing sources host-ID-only: these are proposed capabilities, not the current contract.

## Ready-to-use prompt for Opus 5.5

Read plans/002-independent-product-research-opus-5-5.md and the applicable AGENTS.md. Start by confirming current Git state and the source contracts cited here; this report is a dated investigation, not authority to overwrite unfinished work. Implement Phase 1 first, then demonstrate the smallest existing-app integration from Phase 2 before expanding the architecture. Keep the aggregate registry compatible, treat new API sketches as proposals, and use bounded recipes before new schema primitives. Preserve the model-data safety boundary and host-owned authorization. Supply actual tests, consumer install/build evidence and screenshots for any completed UI claims. Report findings that no longer reproduce, completed acceptance criteria, and unresolved constraints. Do not merge or deploy as part of this handoff unless the user separately authorizes that step.

## Primary sources

- [S1 — shadcn registry item format](https://ui.shadcn.com/docs/registry/registry-item-json). Primary reference for registry files, dependencies and install metadata.
- [S2 — AI SDK generative interfaces](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces). Tool results can map to application-owned React UI; useful precedent for keeping host chat integration separate.
- [S3 — json-render documentation](https://json-render.dev/docs). Catalog, renderer, streaming and integration boundaries are useful comparative research. This report does not recommend replacing Fable with it or claim relative performance.
- [S4 — W3C APG grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/). Keyboard and focus responsibilities for interactive grids.
- [S5 — W3C keyboard interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). Basis for interaction verification.

External docs were retrieved on 2026-11-13 and may change. Source-supported observations and proposed designs are explicitly separated above. No comparative model-quality or UX superiority claim is supported by this research.
