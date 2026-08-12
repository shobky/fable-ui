---
tool: show_email_composer
type: registry:component
---

# show_email_composer

Use `show_email_composer` to present one plain-text email draft with a subject, body, and optional recipients.

Provide the exact `subject` and `body`. Optional `to` values are individual email addresses. After generation completes, the user can edit the draft, copy one plain-text email package, or choose Gmail, Outlook, or their configured default mail client after recipient validation.

Gmail and Outlook are best-effort browser compose handoffs, not delivery. The fixed menu cannot discover installed apps. Keep subject and body short enough for the mailto handoff; if sending is unavailable, the user can still copy the package.

Avoid it for automatic delivery, bulk mail, attachments, HTML email, tracking, secret values, or host-side sending. An empty recipient list is valid when the user should choose recipients in their mail client.
