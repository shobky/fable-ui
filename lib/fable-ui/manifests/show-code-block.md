---
tool: show_code_block
type: registry:component
---

# show_code_block

Use `show_code_block` for a display-ready code snippet that benefits from syntax highlighting, copying, or download. During streaming it can show a readable raw fallback while the current code is highlighted.

Provide raw `code` and a short `language` identifier such as `ts`, `tsx`, `python`, or `sql`. Optionally provide `filename` and set `showLineNumbers: false` for very small snippets.

Avoid it for commands that should execute automatically, file writes, secrets, long prose, rich text, or partial host-owned source trees. The card renders source as text and never executes it.
