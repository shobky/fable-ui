# Fable UI Documentation Skill

## Purpose

Use this skill when writing, rewriting, or reviewing documentation for **Fable UI**.

Fable UI is a copy-and-own registry of AI-intent-aware product experiences. It helps developers add trusted generative UI to existing products by pairing React components with AI SDK tool definitions, model-facing manifests, examples, and integration guidance.

The goal of the docs is not to describe a component library in abstract terms. The goal is to help a product engineer understand how to install Fable UI pieces, expose tools to an AI model, render tool results as product UI, and safely connect those UI surfaces to app-owned data and actions.

## When to use this skill

Use this skill when working on:

* Fable UI docs pages.
* Component docs.
* Registry and installation docs.
* AI SDK integration docs.
* Manifest and eval docs.
* Architecture docs.
* Security docs.
* Data-source/resource docs.
* MDX examples and component previews.
* README-style project explanations.
* Documentation navigation and page structure.

## Product definition

Fable UI is:

* A **copy-and-own registry** inspired by shadcn/ui.
* A set of **AI-intent-aware product surfaces**, not generic decorative widgets.
* Built for **Next.js, React, TypeScript, shadcn/ui, Tailwind, and Vercel AI SDK**.
* Designed around the pattern: **model selects a tool → host app validates payload → UI renderer displays trusted component → host app owns data/actions**.
* A toolkit for product engineers who want AI interfaces that go beyond chat text and markdown tables.

Fable UI is not:

* A full agent framework.
* A chat provider.
* A replacement for Vercel AI SDK.
* A database ORM.
* A permission system.
* A black-box npm UI package.
* A prompt-to-app/code generator.
* A system where the model directly queries private data or decides authorization.

## Core mental model

Teach this sequence consistently:

```txt
Install UI
→ expose tools
→ register available surfaces/resources
→ let the agent choose
→ render trusted UI
→ keep data, auth, validation, and actions app-owned
```

For the current and near-future architecture, explain the system like this:

```txt
User prompt
  ↓
AI model
  ↓
Tool call selected from registered Fable tools
  ↓
Tool payload validated with schema
  ↓
Tool router maps tool name to component
  ↓
React renderer displays the Fable UI surface
  ↓
Optional host-owned data/action layer executes real work
```

For future data-backed components, use this model:

```txt
User prompt
  ↓
AI model selects a registered tool and resourceId
  ↓
Component renders with resourceId
  ↓
useFableResource(resourceId)
  ↓
Fable registry resolves ResourceConfig
  ↓
ResourceConfig resolves driver
  ↓
Driver talks to the host data source
  ↓
Component renders rows, metrics, forms, or action states
```

Always make clear that the AI model selects from **allowlisted tools/resources**. It does not get raw database access.

## Canonical terms

Use these terms consistently.

### Registry item

An installable Fable UI unit. A registry item may include component source, types, AI SDK tool definitions, manifests, examples, docs snippets, and helper files.

### Component surface

The UI experience rendered inside the chat or agent interface. Examples: `MetricCard`, `SuggestedActions`, `ConfirmationCard`, `FormCard`, `DataBrowser`.

### Tool definition

The AI SDK-compatible tool schema and description that tells the model what payload shape it can emit.

### Manifest

The model-facing and developer-facing selection contract. It explains when to use a surface, when not to use it, neighboring tools to prefer instead, payload shape, examples, safety notes, and eval prompts.

### Tool router

The host-side mapping from tool result names to React components.

### Tool renderer

The client-side UI layer that receives AI SDK message parts/tool parts and renders the correct Fable UI component.

### Resource

A host-defined data capability, such as `orders`, `customers`, or `inventory`. A resource is identified by a stable `resourceId`.

### Data source

A backend category such as Firebase, REST, Supabase, or Postgres.

### Driver

The implementation that knows how to talk to one kind of data source.

### Resource config

A serializable description of a resource: id, label, driver, source shape, columns, filters, sort options, actions, and model-facing hints.

### Resource runtime

Non-serializable runtime behavior associated with a resource: handlers, callbacks, invalidation logic, and host-owned side effects.

### Agent resource catalog

A safe, serializable projection of registered resources that can be included in model context. It should include labels, descriptions, aliases, allowed filters, allowed actions, and usage guidance. It must not expose secrets, endpoints, collection paths, tokens, handlers, or private auth logic.

## Shipped vs planned rule

Always separate what exists from what is planned.

Use language like:

* “Currently available”
* “Planned”
* “Coming later”
* “The intended architecture”
* “This page describes the design direction”
* “This is not required for the current MetricCard setup”

Never imply that a component, driver, registry item, data source, command, or file exists unless it exists in the codebase.

When code is not implemented yet, documentation may explain the future architecture, but it must label it clearly as planned.

## Documentation style

Write like shadcn-style developer docs:

* Direct.
* Practical.
* Install-first.
* Code-heavy.
* Minimal marketing language.
* Short paragraphs.
* Clear headings.
* Runnable examples.
* No hype.
* No vague claims.
* No “magic” language unless immediately explained.

Prefer:

> Fable UI renders AI tool results with components you own.

Avoid:

> Fable UI revolutionizes AI-native interfaces with powerful next-gen magic.

## Page structure rules

Most pages should follow this structure:

```mdx
---
title: Page title
description: One-sentence page description.
---

# Page title

Short explanation of what this page covers.

## Overview

Explain the concept in practical terms.

## When to use this

Explain when this page matters.

## Installation or setup

Show commands or file changes if relevant.

## Usage

Show complete examples.

## How it works

Explain the flow.

## Notes

Mention constraints, current limitations, security notes, or planned work.

## Next steps

Link to related pages.
```

Component pages should follow this structure:

```mdx
---
title: ComponentName
description: What this component does.
---

# ComponentName

Short summary.

<ComponentPreview name="..." />

## Installation

Install command or current local usage.

## Usage

Basic usage with complete imports.

## Tool

Tool name and payload shape.

## Props

Document key props.

## States

Loading, empty, error, disabled, etc.

## How the agent uses it

Explain the tool-selection moment.

## Safety

Mention whether the component has side effects or not.

## Next steps

Link to AI SDK integration, manifests, or registry docs.
```

Architecture pages should include diagrams where helpful. Mermaid is preferred.

## Required Fable docs pages

### `introduction.mdx`

Explain:

* What Fable UI is.
* What problem it solves.
* Why chat text alone is not enough.
* How Fable differs from shadcn/ui, Vercel AI SDK, assistant-ui, CopilotKit, and prompt-to-code tools.
* What is currently available vs planned.
* The core flow from prompt to tool call to UI rendering.

### `installation.mdx`

Explain:

* Prerequisites.
* How to install/use current registry items.
* How shadcn registry installation works.
* How to wire installed components into a host app.
* How to verify the setup.
* Current limitations.

Do not invent a custom CLI unless the codebase has one.

### `registry.mdx`

Explain:

* Copy-and-own registry model.
* Registry item anatomy.
* Component source.
* Tool definition.
* Manifest.
* Examples/evals.
* Registry dependencies.
* Difference between built-in shadcn dependencies and Fable registry item dependencies.
* How installed code becomes owned by the host app.

### `manifests.mdx`

Explain:

* Manifests as model-selection contracts.
* Use-when and do-not-use-when rules.
* Neighboring component boundaries.
* Trigger and anti-trigger examples.
* Eval prompts.
* Safety notes.
* Why manifests are not user-editable runtime prompts.

### `ai-sdk-integration.mdx`

Explain:

* How Fable UI works with Vercel AI SDK.
* Tool definition registration.
* `streamText` route pattern.
* Tool result/message part rendering.
* Tool router pattern.
* How to map a tool call to a React component.
* How approval/confirmation fits into side effects.

Use the codebase’s actual AI SDK version and APIs. Do not document obsolete APIs.

### `components/metric-card.mdx`

Explain:

* What `MetricCard` is.
* When to use `show_metric`.
* When not to use it.
* Basic usage.
* Tool payload shape.
* Props.
* States.
* Mock preview.
* How it renders inside chat.

### `architecture/system-flow.mdx`

Explain the full Fable UI flow:

```txt
Prompt → model → tool call → schema validation → tool router → component renderer → optional host action/data layer
```

Include a Mermaid diagram.

### `architecture/agent-routing.mdx`

Explain:

* How the model chooses tools.
* How manifests guide selection.
* How future resource catalogs help the model choose valid resources.
* Why the model must not invent component names or resource IDs.
* How tool conflicts should be tested.

### `architecture/security.mdx`

Explain:

* The model is not the permission boundary.
* UI confirmation is not authorization.
* Host APIs must validate auth, permissions, and inputs.
* Tool schemas constrain payloads but do not replace server validation.
* Manifests must not contain secrets.
* Resource catalogs must not expose backend internals.

## Component preview rules

When writing docs with component examples:

1. Inspect the existing docs system first.
2. Reuse the project’s existing preview convention if one exists.
3. If no preview convention exists, add the smallest practical one.
4. Use mock data.
5. Keep examples realistic.
6. Keep preview code separate from the component implementation.
7. Do not require live AI calls for docs previews.
8. Do not require real databases for docs previews.
9. Make imports match the actual project aliases.
10. Verify TypeScript paths compile.

For `MetricCard`, include examples such as:

```tsx
<MetricCard
  label="Revenue today"
  value="EGP 4,200"
  trend={{ direction: "up", delta: "+18% vs yesterday" }}
  context="Best Monday this month"
/>
```

Also include neutral, loading, and error states if the component supports them.

## Code example rules

Examples must be:

* Complete enough to copy.
* Based on real file paths.
* Based on existing exports.
* Small.
* Realistic.
* Consistent with the current codebase.
* Updated if implementation names differ from the plan.

Do not invent imports. Inspect source files before writing examples.

## Architecture writing rules

For architecture docs:

* Start with the simple flow.
* Then explain each part.
* Use diagrams.
* Explain what exists today and what is planned.
* Keep abstractions named consistently.
* Avoid overengineering language.
* Explain why each boundary exists.

Important boundaries:

* The model selects tools; it does not render arbitrary code.
* Tool schemas validate payload shape; they do not authorize actions.
* Components render trusted, typed payloads.
* The host app owns data access.
* The host app owns side effects.
* The host app owns auth, permissions, and validation.
* Future resources and drivers must be allowlisted by developers.

## Security writing rules

Every doc touching actions, data, or AI routing must include the relevant security boundary.

Use this phrasing where appropriate:

> Fable UI does not make the model a permission boundary. The model can request a UI or action flow, but the host application must still validate authentication, authorization, input, and side effects on the server.

For destructive actions:

> Confirmation UI improves user trust, but it does not authorize the operation. The API called after confirmation must still enforce permissions.

For data resources:

> Resource catalogs should describe what the model may ask for. They should not expose connection details, secrets, raw endpoints, collection paths, or private authorization logic.

## Data-source architecture guidance

Even if data-source code does not exist yet, the docs may describe the intended architecture.

Use this future architecture:

```txt
Data source = backend category, such as Firebase or REST.
Driver = implementation for one data source.
Resource = app-specific dataset or capability.
Registry = maps resourceId to resource config and driver.
Component = calls useFableResource(resourceId), never Firebase/fetch directly.
DataSourceContext = auth, tenant, and extra context passed to drivers.
```

Recommended future package split:

```txt
fable-data-core
fable-data-source-firebase
fable-data-source-rest
data-browser
metric-card
confirmation-card
form-card
suggested-actions
```

Do not document future commands as currently available unless the registry already supports them.

## Manifest guidance

Every component manifest should answer:

* What does this component do?
* When should the model use it?
* When should the model avoid it?
* Which neighboring tool should be preferred instead?
* What payload shape is expected?
* What examples prove correct usage?
* What eval prompts test the boundary?
* What safety notes matter?

For examples:

```md
Use when:
- The user asks for one primary number.
- The value benefits from visual emphasis.
- A short trend or context line helps interpretation.

Do not use when:
- The user wants to browse many records.
- The user needs to submit a form.
- The user is confirming a side effect.
```

## Writing quality checklist

Before finishing docs work:

* The docs no longer describe shadcn/ui as the product.
* The docs explain Fable UI’s actual purpose.
* All examples use real project imports.
* Current features are separated from planned features.
* Navigation is updated.
* Code blocks are formatted.
* MDX compiles.
* Component previews render with mock data.
* No fake commands are documented.
* No unimplemented data source is presented as shipped.
* No secrets or private backend details appear in examples.
* Security boundaries are stated wherever relevant.
* The docs help a new developer understand the full system even if only one component currently exists.

## Implementation behavior

When editing a Fable UI repo:

1. Inspect the existing docs structure.
2. Inspect available components, registry files, tool definitions, and chat integration.
3. Identify what is shipped.
4. Identify what is planned from project docs/specs.
5. Replace irrelevant inherited docs with Fable-specific docs.
6. Add or update preview components as needed.
7. Update docs navigation/config.
8. Run typecheck/lint/build if available.
9. Report changed files and any commands that failed.

Do not rewrite unrelated application code unless needed for docs previews or broken imports.
