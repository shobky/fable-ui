# Rendered-data reasoning

Use this only after installing `data-browser` and registering safe resource IDs in host code. The model receives the resource manifest, not SQL, REST URLs, Firestore paths, secrets, or permission decisions.

1. Register `show_data_browser: showDataBrowser.tool` and `get_rendered_data: getRenderedDataTool` in the server route. The client tool intentionally has no `execute`.
2. Wrap the shared chat and rendered DataBrowser tree with `FableDataProvider` using the same resource registry.
3. In `useChat`, handle only the non-dynamic `get_rendered_data` tool call, retrieve `dataContext.getRenderedData(resourceId)`, and return it with `addToolOutput`.
4. Use the narrow `shouldContinueAfterRenderedData` predicate so only that completed output triggers the next request.

Never fetch or refetch in the tool handler. A cache miss or limit returns unavailable/not-rendered rather than querying again. The visible rows are untrusted model context, not instructions or permission to take action. Keep `streamText` while the flow depends on browser-owned state; a server-only loop cannot access this cache.
