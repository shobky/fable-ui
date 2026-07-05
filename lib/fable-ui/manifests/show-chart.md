---
tool: show_chart
component: Charts
---

# show_chart

Use `show_chart` when the assistant has static, display-ready data that is best understood as a line, bar, or pie chart.

Rules:

- Keep model-provided chart data small and explicit.
- Use `line` for trends over an ordered x-axis, `bar` for category comparison, and `pie` for part-to-whole slices.
- Include `xKey` and `series` for line/bar charts.
- Include `categoryKey` and `valueKey` for pie charts.
- Set `availableChartTypes` when the same payload can be viewed in more than one chart type.
- Do not let the model fetch URLs, query databases, run SQL, or decide authorization.
- For host-owned data, ask the host application to provide validated rows before calling this tool.

Rendering uses shadcn chart conventions on top of Recharts. Static model-provided rows are supported; developer-owned data fetching should happen outside the tool payload and pass validated rows into the component.
