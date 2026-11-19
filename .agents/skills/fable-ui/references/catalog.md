# Block catalog

Source of truth: `components/fable-ui/schema.ts`. Spec: `{ title?, blocks: Block[] }`, max 24 blocks. Layouts contain content blocks and never nest.

## Content blocks

| Block | Use for | Key fields |
| --- | --- | --- |
| `markdown` | Prose (default) | `text` (GFM, no HTML/images) |
| `heading` | Titling a multi-part answer | `text`, `eyebrow`, `description`, `level` |
| `callout` | One warning/tip/takeaway | `tone`: info, tip, success, warning, danger; `title`, `text` |
| `metrics` | 1–8 headline numbers | `items[]`: `label`, `value`, `format` (number, currency, percent, compact), `currency`, `delta` (%), `invertDelta` |
| `table` | Comparisons, records | `columns[]`: `key`, `label`, `type` (text, number, currency, percent, date, badge, link); `rows[]`; `footer`; `sortable`; `searchable`; `downloadable` |
| `chart` | Trends, comparisons, shares | `kind` (bar, line, area, pie, donut), `xKey`, `series[]` (`key`, `label`), `data[]`, `format`, `stacked`, `horizontal` |
| `details` | Facts about one thing | `items[]`: `label`, `value`, `tone` |
| `list` | Items, steps, timelines | `style` (bullet, numbered, check, steps, timeline), `items[]`: `title`, `description`, `meta`, `status` |
| `checklist` | Tasks to tick off | `items[]`: `label`, `checked`, `note` |
| `code` | Code, commands | `code`, `language`, `filename` |
| `quote` | Quotations | `text`, `author`, `source` |
| `image` | One image | `image` (`src`, `alt`, `caption`, `credit`), `aspect` |
| `gallery` | Several images | `layout` (grid, featured, masonry, carousel), `images[]` |
| `cards` | Options to pick from | `items[]`: `title`, `description`, `image`, `badge`, `meta`, `action`; `columns` |
| `hero` | Opening a plan or guide | `variant` (split, cover, editorial, spotlight), `title`, `eyebrow`, `description`, `image`, `stats[]`, `actions[]` |
| `article` | Long-form writing | `title`, `subtitle`, `byline`, `readingTime`, `cover`, `sections[]` (`heading`, `body`) |
| `form` | Clarifying questions | `fields[]`: `name`, `label`, `type` (text, textarea, email, number, date, select, radio, checkbox, toggle), `options`, `required`, `defaultValue`; `submitLabel` |
| `template` | Fill-in text | `body` with `{{name}}`, `variables[]` (`name`, `label`, `value`), `filename` |
| `email` | Editable draft | `to[]`, `cc[]`, `subject`, `body`, `sendAction` |
| `actions` | Next steps | `items[]` (max 6) |
| `file` | Downloadable text file | `filename`, `mimeType`, `content`, `description` |
| `sources` | Citations | `items[]`: `title`, `url`, `publisher`, `snippet` |
| `faq` | Collapsible Q&A | `items[]`: `question`, `answer` |
| `divider` | Separating parts | `label` |

## Layouts

| Block | Fields |
| --- | --- |
| `columns` | `ratio` (equal, wide-left, wide-right), `columns[]` (2–3) of `{ blocks[] }` |
| `section` | `title`, `description`, `variant` (plain, card, muted), `blocks[]` |
| `tabs` | `tabs[]` (2–6) of `{ label, blocks[] }` |

## Actions

| `type` | Fields |
| --- | --- |
| `reply` | `label`, `message` |
| `link` | `label`, `url` (https/http/mailto) |
| `copy` | `label`, `text` |
| `download` | `label`, `filename`, `content`, `mimeType` (text/plain, text/markdown, text/csv, application/json, text/calendar) |
| `host` | `label`, `action` (registered name), `payload` |

All actions accept `style` (primary, secondary, outline, ghost) and `icon` (see `FABLE_ICONS`).
