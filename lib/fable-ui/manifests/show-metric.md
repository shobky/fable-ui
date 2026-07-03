---
tool: show_metric
type: registry:component
---

# show_metric

Use `show_metric` when the assistant has one trusted, display-ready number that benefits from visual emphasis.

Use it for totals, counts, amounts, percentages, balances, SLA values, or another KPI that has already been computed by host logic.

Avoid it for lists, browsing, tables, forms, confirmations, destructive operations, or long explanations.

The payload must include `label` and `value`. Optional `trend` and `context` should clarify the number without inventing data.
