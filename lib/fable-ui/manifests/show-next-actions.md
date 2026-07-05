---
tool: show_next_actions
type: registry:component
---

# show_next_actions

Use `show_next_actions` for safe follow-up prompts the user may choose to send back into the chat.

Each action has UI copy and model-facing intent:

- `label` is the short button text shown to the user.
- `prompt` is the complete user message the host chat sends if the user clicks the button.
- `description` may add brief context under the label.

Prompts must be complete enough to send as the user's next turn without hidden state. Good prompts include the subject and desired operation, such as "Compare this revenue metric to yesterday" or "Show the source rows for this answer."

Do not use this tool to perform host API calls, writes, purchases, deletes, sends, refunds, approvals, or status changes. Suggested actions are prompt-only. Side effects belong in confirmation, form, or host-owned action flows where the app validates and executes the operation.
