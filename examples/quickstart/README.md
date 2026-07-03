# Fable quickstart

This item installs a collision-safe AI SDK chat demo at `/fable-chat` with an API route at `/api/fable-chat`.

Mock mode works without provider keys. Provider mode uses OpenAI when `OPENAI_API_KEY` exists and the client sends `mode: "provider"`.

The installed files are intentionally app-owned source. Keep server-side authorization, validation, writes, and data access in your host app.
