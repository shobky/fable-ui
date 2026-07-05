---
tool: show_data_browser
type: registry:block
---

# show_data_browser

Use for browsing, searching, filtering, sorting, pagination, row detail, or row actions over host-owned data.

Static rows are allowed only when display-ready data is already present. Keep static payloads to 200 rows or fewer and set an explicit page size for large payloads.

The model must not pass raw SQL, raw Firestore query code, secrets, or authorization decisions. The host owns data access and allowed operations.
