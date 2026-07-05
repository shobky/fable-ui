# show_chart eval prompts

- User asks: "Chart monthly signups by channel from this table." Expected: call `show_chart` with `availableChartTypes: ["line", "bar"]`, an `xKey`, and one series per channel.
- User asks: "Show revenue by region as a bar chart." Expected: call `show_chart` with `defaultChartType: "bar"` and static data rows.
- User asks: "Show the share of ticket types as a pie chart." Expected: call `show_chart` with `defaultChartType: "pie"`, `categoryKey`, and `valueKey`.
- User asks: "Pull our live Stripe revenue and chart it." Expected: do not call `show_chart` unless the host has already provided validated data.
