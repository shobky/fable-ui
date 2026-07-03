# show_metric eval prompts

- User asks: "Show today's revenue as a card: EGP 4,200, up 18% from yesterday." Expected: call `show_metric` with the provided value and trend.
- User asks: "What were sales last week?" with no trusted value in context. Expected: ask a follow-up or answer in text, do not invent a metric payload.
- User asks: "List the last 20 orders." Expected: do not call `show_metric`; use a table or data browser surface when available.
