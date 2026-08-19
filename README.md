# Fable UI

Fable UI is a copy-and-own shadcn registry for AI-intent-aware product UI in Next.js. It pairs trusted React surfaces with Zod-validated AI SDK tool contracts, model-facing manifests, and examples so an assistant can select a bounded UI instead of emitting untrusted HTML or JSX.

The host application still owns data access, authentication, authorization, validation, persistence, and every side effect.

## Install

The canonical public registry origin is `https://fable-ui.shobky.com/r/<item>.json`. Install an item by URL into a Next.js app that already has shadcn/ui:

```bash
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/quickstart.json
```

Use `pnpm.cmd` instead of `pnpm` on Windows when a PowerShell execution policy blocks the `pnpm.ps1` shim. Inspect the proposed files and do not use `--overwrite` unless you have reviewed the exact target collision.

## Quickstart boundary

`quickstart` installs `/fable-chat` and `/api/fable-chat` with exactly two display tools:

- `show_metric`
- `show_next_actions`

It is a minimal chat example, not the complete Fable catalog. It does not register confirmation, form, chart, editor, email, code, DataBrowser, driver, or `get_rendered_data` integration. Add those deliberately with the [AI SDK integration guide](https://fable-ui.shobky.com/docs/ai-sdk-integration).

Configure the installed route with server-only values in `.env.local`:

```env
FABLE_AI_PROVIDER=google
FABLE_AI_MODEL=gemini-3-flash-preview
FABLE_AI_API_KEY=replace-with-the-real-secret
```

Do not write `FABLE_AI_API_KEY=$OPENAI_API_KEY`: `.env.local` does not do shell-style interpolation. Paste the intended secret value into `FABLE_AI_API_KEY`, keep the file ignored, and never log or commit it.

## Registry catalog

All 13 public items are available from the hosted origin:

| Item                  | Category      | Tool or responsibility                                                                                  |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `core`                | Foundation    | Shared renderer, schemas, provider, and data-source registry. Usually transitive; directly installable. |
| `metric-card`         | Surface       | `show_metric`                                                                                           |
| `suggested-actions`   | Surface       | `show_next_actions`                                                                                     |
| `confirmation-card`   | Surface       | `request_confirmation`                                                                                  |
| `form-card`           | Surface       | `collect_input`                                                                                         |
| `charts`              | Block         | `show_chart`                                                                                            |
| `text-editor-card`    | Surface       | `show_text_editor`                                                                                      |
| `email-composer-card` | Surface       | `show_email_composer`                                                                                   |
| `code-block-card`     | Surface       | `show_code_block`                                                                                       |
| `data-browser`        | Block         | `show_table`, `show_data_browser`, and client-only `get_rendered_data`                                  |
| `rest-driver`         | Driver        | Host-owned REST resource adapter                                                                        |
| `firebase-driver`     | Driver        | Host-owned Firestore resource adapter                                                                   |
| `quickstart`          | Example block | Minimal two-tool chat at `/fable-chat`                                                                  |

Install items one at a time when adopting them into an existing app:

```bash
# Foundation
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/core.json

# Product surfaces and blocks
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/metric-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/suggested-actions.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/confirmation-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/form-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/charts.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/text-editor-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/email-composer-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/code-block-card.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/data-browser.json

# Optional host-owned data drivers
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/rest-driver.json
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/firebase-driver.json

# Minimal example chat
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/quickstart.json
```

## What installs where

The shadcn CLI resolves `@components`, `@lib`, and `@hooks` through the host app's `components.json`; keep those aliases accurate before installing. Fable items can install all of these target categories:

| Target category          | Typical destination                                                |
| ------------------------ | ------------------------------------------------------------------ |
| Fable core               | `lib/fable-ui/core/*`                                              |
| Surface and block source | `components/fable-ui/<item>/*`                                     |
| Tool contracts           | `lib/fable-ui/tools/*`                                             |
| Model manifests          | `lib/fable-ui/manifests/*`                                         |
| Shared hooks             | `hooks/*`                                                          |
| Data drivers             | `lib/fable-ui/drivers/rest/*` or `lib/fable-ui/drivers/firebase/*` |
| shadcn primitives        | Host `components/ui/*` files resolved from registry dependencies   |
| Quickstart routes        | `app/fable-chat/page.tsx` and `app/api/fable-chat/route.ts`        |
| Quickstart UI and config | `components/fable-ui/chat/*` and `lib/fable-ui/quickstart/*`       |
| Quickstart notes         | `docs/fable-ui/quickstart.md`                                      |

Routes use explicit `app/...` targets. The quickstart does not overwrite `/chat` or `/api/chat`.

## Add a tool deliberately

On the server, pass only the AI SDK tool object to `streamText`. In the client, map the complete Fable definition to `FableToolPart`.

```ts
import { streamText } from "ai"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"

streamText({
  model,
  messages,
  tools: { show_metric: showMetric.tool },
})
```

```tsx
import { FableToolPart } from "@/lib/fable-ui/core/tool-renderer"
import { showMetric } from "@/lib/fable-ui/tools/show-metric-tool"

const registry = { show_metric: showMetric }

export function ToolPart({ part }: { part: unknown }) {
  return <FableToolPart part={part} registry={registry} />
}
```

Read the [AI SDK guide](https://fable-ui.shobky.com/docs/ai-sdk-integration) for additive email registration/rendering, confirmation and form callbacks, and the provider-backed `get_rendered_data` loop. Read [Manifests](https://fable-ui.shobky.com/docs/manifests) before changing tool-selection behavior.

## Firebase with pnpm 11

`firebase-driver` can surface a pnpm 11 ignored-build prompt for `@firebase/util` and `protobufjs`. Do not approve either script by default. Review the package scripts and the actual deployment runtime, record an explicit `allowBuilds` policy in `pnpm-workspace.yaml`, then install and validate. A compile-only mock may deny both scripts, but that is not a production recommendation. See the [Firebase driver guide](https://fable-ui.shobky.com/docs/data-sources/firebase).

## Agent setup

The repository skill at `.agents/skills/fable-ui` is an installation and integration guide for coding agents, not an MCP server. See [Agent setup](https://fable-ui.shobky.com/docs/agent-setup) for the repository install command and downloadable `.skill` package.

## Documentation

- [Introduction](https://fable-ui.shobky.com/docs/introduction)
- [Installation](https://fable-ui.shobky.com/docs/installation)
- [Registry](https://fable-ui.shobky.com/docs/registry)
- [Tool Definitions](https://fable-ui.shobky.com/docs/tool-definitions)
- [AI SDK Integration](https://fable-ui.shobky.com/docs/ai-sdk-integration)
- [Data Sources](https://fable-ui.shobky.com/docs/data-sources/overview)
- [Components](https://fable-ui.shobky.com/docs/components)
- [Agent setup](https://fable-ui.shobky.com/docs/agent-setup)

## Local development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm registry:check
```

Run `pnpm registry:consumer-smoke` before publishing a registry update. It validates installed consumer behavior, which is stronger evidence than JSON validation alone.

## License

Fable UI is available under the [MIT License](./LICENSE.MD).
