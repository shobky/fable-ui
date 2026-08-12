---
tool: show_text_editor
type: registry:component
---

# show_text_editor

Use `show_text_editor` for one self-contained plain-text or Markdown draft that the user can review, edit locally after generation completes, copy, or download.

Include the complete `content`. Use `format: "markdown"` only when the text is Markdown. Set `editable: false` for a read-only historical or host-controlled draft. Use `direction` when the content direction is known; otherwise leave it as `auto`.

Avoid it for rich text, multiple email recipients, source code, structured forms, live collaborative editing, file writes, or data retrieval. The card does not persist edits or mutate host files.

`maxLength` is a visible soft guidance limit, not a truncation or validation rule. Partial and interrupted text stays available to copy or download when meaningful.
