# Fable UI quickstart

This item installs a production-ready AI SDK chat at `/fable-chat` with a route handler at `/api/fable-chat`.

## Configure the model

Add three server-only environment variables to `.env.local`:

```env
FABLE_AI_PROVIDER=google
FABLE_AI_MODEL=gemini-3-flash-preview
FABLE_AI_API_KEY=your-provider-api-key
```

Supported `FABLE_AI_PROVIDER` values are `google`, `anthropic`, `openai`, `openrouter`, `mistral`, and `deepseek`.

Restart the dev server after changing `.env.local`, then open `/fable-chat` and start chatting. If the variables are missing, the chat will respond with a setup message listing the values to add.

## What it installs

```txt
app/fable-chat/page.tsx
app/api/fable-chat/route.ts
components/fable-ui/chat/*
lib/fable-ui/quickstart/*
```

The quickstart includes `metric-card` and `suggested-actions` tool rendering. Suggested action clicks send the action prompt through the same chat route as a manually typed message. Add more Fable UI registry items when your assistant needs more surfaces, or configure a data source driver when tool calls should read from host-owned data.
