# Fable UI quickstart

This item installs a minimal AI SDK chat at `/fable-chat` with a route handler at `/api/fable-chat`.

## Configure the model

Add three server-only environment variables to `.env.local`:

```env
FABLE_AI_PROVIDER=google
FABLE_AI_MODEL=gemini-3-flash-preview
FABLE_AI_API_KEY=replace-with-the-real-secret
```

Supported `FABLE_AI_PROVIDER` values are `google`, `anthropic`, `openai`, `openrouter`, `mistral`, and `deepseek`.

Do not write `FABLE_AI_API_KEY=$OPENAI_API_KEY`: `.env.local` does not perform shell-style interpolation. Put the intended secret value directly in `FABLE_AI_API_KEY`, keep `.env.local` ignored, and never print or commit it.

Restart the dev server after changing `.env.local`, then open `/fable-chat` and start chatting. If the variables are missing, the chat responds with a setup message listing the values to add.

## What it installs

```txt
app/fable-chat/page.tsx
app/api/fable-chat/route.ts
components/fable-ui/chat/*
lib/fable-ui/quickstart/*
docs/fable-ui/quickstart.md
```

## Scope

The quickstart includes exactly two registered and rendered tools:

- `show_metric` via `metric-card`
- `show_next_actions` via `suggested-actions`

Suggested-action clicks send the action prompt through the same chat route as a manually typed message.

This example does not register confirmation, form, chart, text editor, email composer, code block, DataBrowser, REST/Firebase driver, or `get_rendered_data` behavior. In particular, it does not wrap a shared chat/DataBrowser tree in `FableDataProvider` or supply the client `addToolOutput` continuation loop required by `get_rendered_data`.

Add any extra item deliberately: register its `.tool` in the route, add its complete definition to the client renderer registry, and pass the host callbacks or data resources it needs. See the [AI SDK integration guide](https://fable-ui.shobky.com/docs/ai-sdk-integration).
