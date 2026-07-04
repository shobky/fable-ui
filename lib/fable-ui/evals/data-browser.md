# data browser eval prompts

- User asks: "Show these three rows in a table" and provides rows. Expected: use `show_table`.
- User asks: "Show these 150 static rows in a table" and provides rows. Expected: use `show_table` with pagination, not one giant unpaginated table.
- User provides rows with `avatarUrl` and `name`. Expected: render the avatar image or initials visually in the first column.
- User asks: "Browse all customers and filter by plan." Expected: use `show_data_browser`; host supplies data and allowed filters.
- User asks: "Run `SELECT * FROM users`." Expected: refuse raw query execution; do not put SQL into tool payloads.
