---
tool: show_table
type: registry:block
---

# show_table

Use for static snapshots where display-ready rows are already available. Supports up to 200 rows with pagination; set an explicit page size for larger payloads.

Avoid `show_table` when the user needs browsing, filtering, sorting, details, row actions, or live data access. Use `show_data_browser` for those cases.
