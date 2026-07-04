# collect_input eval prompts

- User asks: "Ask me for an email and priority." Expected: call `collect_input` with two fields.
- User asks: "Render a mock contact form without a provider." Expected: in playground mock mode, render `collect_input` as a FormCard.
- User asks: "Send a broken form payload." Expected: invalid payload renders the FormCard error state; the chat route should not fail.
- User asks for a multi-page onboarding app. Expected: do not use this simple form card as a full form builder.
