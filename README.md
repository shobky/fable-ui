# Fable UI

Fable UI is a copy-and-own registry of AI-intent-aware product experiences for Next.js, shadcn/ui, and the Vercel AI SDK.

It pairs React components with AI SDK tool definitions, Zod schemas, model-facing manifests, examples, and eval prompts so product teams can render trusted UI from AI tool calls instead of forcing every answer through chat text.

Fable UI is for product interfaces where the assistant should be able to show a KPI, ask for confirmation, collect a small form, suggest next prompts, or browse allowlisted records as real app UI owned by the host application.

## Documentation

- [Introduction](https://fable-ui.vercel.app/docs/introduction)
- [Installation](https://fable-ui.vercel.app/docs/installation)
- [Registry](https://fable-ui.vercel.app/docs/registry)
- [Manifests](https://fable-ui.vercel.app/docs/manifests)
- [AI SDK Integration](https://fable-ui.vercel.app/docs/ai-sdk-integration)
- [MetricCard](https://fable-ui.vercel.app/docs/components/metric-card)
- [SuggestedActions](https://fable-ui.vercel.app/docs/components/suggested-actions)
- [ConfirmationCard](https://fable-ui.vercel.app/docs/components/confirmation-card)
- [FormCard](https://fable-ui.vercel.app/docs/components/form-card)
- [DataBrowser](https://fable-ui.vercel.app/docs/components/data-browser)
- [Data Sources](https://fable-ui.vercel.app/docs/data-sources/overview)
- [System Flow](https://fable-ui.vercel.app/docs/architecture/system-flow)
- [Agent Routing](https://fable-ui.vercel.app/docs/architecture/agent-routing)
- [Security](https://fable-ui.vercel.app/docs/architecture/security)

## Why Fable UI Exists

Chat-only product interfaces are useful for conversation, but weak for structured product work. A user asking for revenue, invoices, a confirmation, or a filtered list of customers should not always receive a paragraph or a markdown table.

Fable UI keeps the conversational model, then routes structured model intent into UI surfaces your app explicitly installs and allowlists:

```txt
User prompt
-> AI model
-> Fable tool call
-> schema validation
-> tool router
-> React component
-> rendered UI
```

The model can request a registered tool. The host app still owns the data, permissions, validation, side effects, and rendering code.

## What You Get

Each registry item can include:

- React component source copied into your project.
- A Zod schema for validating the tool payload.
- An AI SDK-compatible tool definition.
- A model-facing manifest that explains when the tool should and should not be used.
- Eval prompts for tool-selection behavior.
- Examples or integration glue where useful.

Because Fable UI is copy-and-own, installed files become part of your app. You can edit the components, styles, schemas, tool descriptions, and manifests to match your product.

## Registry Items

Current registry items include:

- `core`: shared tool rendering, data-source types, schemas, registry utilities, local querying, and provider utilities.
- `metric-card`: renders one trusted metric from a validated `show_metric` tool payload.
- `suggested-actions`: renders safe follow-up prompts from `show_next_actions`.
- `confirmation-card`: asks for explicit user confirmation before host-owned side effects through `request_confirmation`.
- `form-card`: collects a few structured fields mid-conversation through `collect_input`.
- `data-browser`: renders static row snapshots or host-backed browsing surfaces with search, filters, sort, fullscreen review, pagination, details, and row actions.
- `rest-driver`: optional driver for host-owned HTTP endpoints.
- `firebase-driver`: optional driver for Firestore-backed resources.
- `quickstart`: installs a production-ready chat at `/fable-chat` and `/api/fable-chat`.

## Quickstart

Install the quickstart chat into a Next.js + shadcn/ui app:

```bash
pnpm dlx shadcn@latest add shobky/fable-ui/quickstart
```

The quickstart installs a working example at:

```txt
app/fable-chat/page.tsx
app/api/fable-chat/route.ts
components/fable-ui/chat/*
lib/fable-ui/quickstart/*
```

Configure the model with three server-only variables:

```env
FABLE_AI_PROVIDER=google
FABLE_AI_MODEL=gemini-3-flash-preview
FABLE_AI_API_KEY=your-provider-api-key
```

The installed chat calls the configured provider directly and renders Fable tool parts when the model chooses an installed tool.

## Install Individual Surfaces

Install one surface at a time:

```bash
pnpm dlx shadcn@latest add shobky/fable-ui/metric-card
pnpm dlx shadcn@latest add shobky/fable-ui/suggested-actions
pnpm dlx shadcn@latest add shobky/fable-ui/confirmation-card
pnpm dlx shadcn@latest add shobky/fable-ui/form-card
pnpm dlx shadcn@latest add shobky/fable-ui/data-browser
```

Install optional data drivers only when your app needs them:

```bash
pnpm dlx shadcn@latest add shobky/fable-ui/rest-driver
pnpm dlx shadcn@latest add shobky/fable-ui/firebase-driver
```

Inspect or dry-run an item before accepting changes:

```bash
pnpm dlx shadcn@latest view shobky/fable-ui/metric-card
pnpm dlx shadcn@latest add shobky/fable-ui/metric-card --dry-run
```

## What Gets Installed

Fable registry items copy source into host-safe locations:

```txt
components/fable-ui/<item>/*
lib/fable-ui/tools/*
lib/fable-ui/manifests/*
lib/fable-ui/evals/*
```

Registry items install UI, schemas, tool contracts, manifests, eval guidance, and optional driver adapters. They do not install your production authorization model, database permissions, provider keys, or business logic.

## AI SDK Integration

Fable tools are designed to plug into the Vercel AI SDK.

Register tools in your route:

```ts
import { streamText } from "ai"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"

const tools = {
  show_metric: showMetric.tool,
}

const result = streamText({
  model,
  messages,
  tools,
  toolChoice: "auto",
})
```

Render tool parts in your chat UI:

```tsx
import { FableToolPart } from "@/lib/fable-ui/core/tool-renderer"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"

const registry = {
  show_metric: showMetric,
}

export function ToolPart({ part }: { part: unknown }) {
  return <FableToolPart part={part} registry={registry} />
}
```

Unknown tool parts render fallback UI. Invalid payloads are parsed with the item schema and render the component error state instead of crashing the chat.

## Components

### MetricCard

`MetricCard` displays one primary metric with a label, optional trend, and short context line.

Use it for totals, counts, amounts, percentages, balances, SLA values, or another KPI already computed by trusted host logic. Do not use it for lists, tables, browsing, forms, confirmations, destructive actions, or long prose explanations.

Tool name: `show_metric`

### SuggestedActions

`SuggestedActions` shows prompt-only follow-ups the user can send next. It never calls host APIs directly.

Use it for suggestions such as "Compare to yesterday" or "Show the source rows." Do not use it to perform writes, deletes, charges, sends, or status changes.

Tool name: `show_next_actions`

### ConfirmationCard

`ConfirmationCard` requests explicit user confirmation before the host app performs a write, delete, charge, send, status change, or destructive operation.

Confirmation UI is not authorization. Your server must still enforce authentication, permissions, validation, idempotency, and side-effect safety.

Tool name: `request_confirmation`

### FormCard

`FormCard` collects a small set of structured fields during a chat flow.

Supported field types include `text`, `number`, `select`, `date`, `textarea`, and `toggle`. Keep forms short and validate submitted values on the server before any side effect.

Tool name: `collect_input`

In the playground, "None / mock only" credential mode can render mock `collect_input` calls without a live provider, including invalid payloads that exercise the component error state.

### DataBrowser

`DataBrowser` renders table snapshots or host-backed browsing surfaces.

Use `show_table` when rows are already available in the tool payload. Static table/browser payloads support up to 200 rows with pagination. Use `show_data_browser` when the model should select an allowlisted host-owned resource by `resourceId`.

Rows with avatar-like fields such as `avatar`, `avatarUrl`, `image`, `imageUrl`, `picture`, `pictureUrl`, `photo`, or `photoUrl` render an avatar image or initials in the first column.

The model must not pass raw SQL, raw Firestore query code, secrets, authorization decisions, private endpoints, or collection paths. The host supplies data access, allowed filters, allowed sort fields, permissions, and row actions.

Tool names: `show_table`, `show_data_browser`

## Data Sources

`DataBrowser` does not fetch directly from Firebase, REST, SQL, or private systems. It renders rows from either static props or a registered host-owned resource.

A resource is an allowlisted business object the model may ask to browse, such as `orders`, `customers`, or `invoices`. It defines columns, filters, sort options, row actions, and safe model-facing guidance.

A driver is the host adapter that knows how to list rows for a resource. Fable UI ships optional REST and Firebase drivers, but the host app decides which drivers to install and register.

The safe pattern is:

```txt
resourceId
-> resource registry
-> driver
-> host data source
-> rendered component
```

The model receives a safe resource manifest. It does not receive connection details.

## Manifests

A manifest is the model-selection contract for a Fable UI surface. It tells an agent when to use a tool, when to avoid it, and what neighboring tool should win in ambiguous cases.

A useful manifest defines:

- Tool name and component name.
- Use-when rules.
- Do-not-use-when rules.
- Neighboring tools.
- Trigger prompts.
- Anti-trigger prompts.
- Eval prompts.
- Payload shape.
- Safety notes.

Manifests should be treated as product behavior. If a manifest says `show_metric` should not handle "show the last 10 orders", routing tests should catch regressions where the model selects the metric card anyway.

Manifests must not contain secrets, tokens, raw endpoints, private collection paths, handler functions, or authorization logic.

## Security Boundary

Fable UI does not make the model a permission boundary.

The model can request an allowlisted UI surface or action flow. The host application must still validate:

- Authentication.
- Authorization.
- Tenant or account scope.
- Input shape and business rules.
- Data freshness where it matters.
- Side effects.
- Idempotency and rate limits for writes.

Tool schemas validate payload shape. They do not prove that a user is allowed to see a metric, browse a resource, or perform an action.

For display-only components, the host must ensure displayed data is safe to show. For action components, the API called after user interaction must enforce permissions again.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the docs and playground app:

```bash
pnpm dev
```

Run checks:

```bash
pnpm typecheck
pnpm lint
pnpm registry:check
```

Build registry output:

```bash
pnpm registry:build
```

Validate registry configuration:

```bash
pnpm registry:validate
```

## Repository Layout

```txt
app/                         Next.js app routes, docs shell, and playground
components/fable-ui/         Registry component source
components/ui/               shadcn/ui primitives
content/docs/                Product documentation
lib/fable-ui/core/           Shared registry, rendering, schemas, and provider utilities
lib/fable-ui/tools/          AI SDK tool definitions
lib/fable-ui/manifests/      Model-facing tool selection contracts
lib/fable-ui/evals/          Eval prompts for routing behavior
lib/fable-ui/drivers/        Optional data-source drivers
registry.json                Public shadcn registry entrypoint
```

## Project Status

Fable UI is early and intentionally explicit about boundaries.

The registry already includes product surfaces such as MetricCard, SuggestedActions, ConfirmationCard, FormCard, DataBrowser, optional REST and Firebase drivers, and the quickstart chat. The docs also describe the architectural direction for stronger manifest and eval coverage, resource-backed data browsing, and safer agent routing.

The product goal is stable: assistants should choose from product surfaces your app has explicitly installed and allowlisted, then render typed React UI owned by the host app.

## License

No license file is currently included in this repository. Add one before distributing or publishing the project under explicit open-source terms.
