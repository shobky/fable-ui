# Chat extension

Install `core` transitively with the selected surface. Keep the server tool map and client definition registry in separate host-owned modules.

```ts
// route: tool objects only
const tools = { show_metric: showMetric.tool }

// client: complete definitions only
const registry = { show_metric: showMetric }
```

Pass `registry` to `FableToolPart`. Do not import a renderer into the route merely to register a tool. Unknown or invalid parts should use the Fable fallback/error state.

## Interactive surfaces

| Surface           | Client handler           | Host requirement                                                                                                                |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| suggested actions | `onSuggestedAction`      | Send the selected prompt through the same path as the composer.                                                                 |
| confirmation      | `onConfirm`, `onCancel`  | Associate the decision with the conversation; authenticate, authorize, validate, and make the server action idempotent.         |
| form              | `onFormSubmit`           | Treat submitted values as untrusted and validate again on the server.                                                           |
| email composer    | none for `FableToolPart` | It is a compose handoff and never sends mail. Render `EmailComposerCard` directly with `onDraftChange` only to observe a draft. |

Do not turn a model tool selection, confirmation click, form output, or email draft into an unreviewed side effect. Keep provider keys server-only; check required environment variable names without reading their values.

## Quickstart boundary

`quickstart` creates `/fable-chat` and `/api/fable-chat` without replacing existing chat routes. It wires only `show_metric` and `show_next_actions`. Add all other selected tools, client definitions, handlers, manifests, data access, and authorization deliberately.
