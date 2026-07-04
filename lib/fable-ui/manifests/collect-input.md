---
tool: collect_input
type: registry:component
---

# collect_input

Use `collect_input` for a short, structured mid-conversation form.

Valid payloads need a title and one to eight fields. Supported field types are `text`, `number`, `select`, `date`, `textarea`, and `toggle`; `select` fields need non-empty string options.

Keep v1 forms simple. The host app must validate submitted values server-side and decide what to do with them.
