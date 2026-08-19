# Fable UI catalog

Use the smallest set that covers the next user action. Every URL is hosted: `https://fable-ui.shobky.com/r/<item>.json`.

| Item                  | Choose it for                                          | Tool or role                                           | Notes                                                                                  |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `core`                | A shared renderer, schemas, provider, or data registry | Foundation                                             | Surface items normally bring it transitively.                                          |
| `metric-card`         | One KPI or compact metric                              | `show_metric`                                          | Display only.                                                                          |
| `suggested-actions`   | Follow-up prompts                                      | `show_next_actions`                                    | Host converts a click into a normal chat send.                                         |
| `confirmation-card`   | Explicit user confirmation before host action          | `request_confirmation`                                 | Needs `onConfirm` and `onCancel`; server still authorizes and validates.               |
| `form-card`           | A few missing structured fields                        | `collect_input`                                        | Needs `onFormSubmit`; treat values as untrusted.                                       |
| `charts`              | A comparison, trend, or composition                    | `show_chart`                                           | Pass validated display-ready data; never let the model query live data.                |
| `text-editor-card`    | A local text draft                                     | `show_text_editor`                                     | User-controlled draft, not a persistence API.                                          |
| `email-composer-card` | A user-controlled compose handoff                      | `show_email_composer`                                  | Never sends email; use direct `onDraftChange` only when host needs draft observation.  |
| `code-block-card`     | Inspectable source text                                | `show_code_block`                                      | Never executes code or writes host files.                                              |
| `data-browser`        | A table or registered resource browser                 | `show_table`, `show_data_browser`, `get_rendered_data` | Register host-safe resource IDs; read rendered data only through the provider cache.   |
| `rest-driver`         | A host-approved REST data adapter                      | Driver                                                 | Define host validation and authorization.                                              |
| `firebase-driver`     | A host-approved Firestore data adapter                 | Driver                                                 | Review package build-script decisions; do not auto-approve.                            |
| `quickstart`          | An isolated minimal chat example                       | Example                                                | Adds `/fable-chat` and `/api/fable-chat`; registers only metric and suggested-actions. |

Do not infer that quickstart includes the other ten integration surfaces. Add a surface only when requested, then read `chat-integration.md` for the server/client pair. Select exactly one driver only when the host actually needs it; drivers do not authorize access.
