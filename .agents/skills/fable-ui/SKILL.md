---
name: fable-ui
description: Install, configure, extend, debug, or validate Fable UI in a Next.js and shadcn/ui consumer app. Use when adding Fable UI registry items or quickstart chat, selecting the smallest complete surface set, wiring AI SDK tools and trusted renderers, configuring host callbacks or rendered-data reasoning, diagnosing an installation, or checking a consumer without using a Fable UI source checkout.
---

# Fable UI

Integrate from the hosted registry into a consumer app. Inspect before writing, select only the requested experience, and keep data access and side effects in host code.

## Guardrails

- Refuse the Fable UI source checkout. Run `node scripts/preflight.mjs <project-root> --items <csv>` and stop on `sourceRepository: true`.
- Use only `https://fable-ui.shobky.com/r/<item>.json`; never copy files from a checkout.
- Let preflight choose the package manager and report Next, shadcn, aliases, existing installations, and collisions.
- Preview every hosted item with `add --dry-run`; do not use `--overwrite`. Stop and ask for approval if a reviewed install still needs an overwrite.
- Never read, echo, serialize, or print environment-variable values. Check names only when configuration is relevant.
- Preserve the host's auth, authorization, validation, data access, writes, and styling. A rendered confirmation or model output is never authorization.

## Workflow

1. Inspect the target with preflight. If it is Next.js but lacks shadcn, initialize it with `pnpm dlx shadcn@latest init --preset rhea --base radix --yes` (or the detected runner); `radix-rhea` is the generated style name, not the CLI preset. If it is not a Next.js consumer, report the missing prerequisite rather than modifying its configuration.
2. Read [the catalog](references/catalog.md). Ask only for a missing choice that materially changes the selected surfaces or data source; do not install the full catalog by default.
3. Preview each selected hosted URL, show collisions, and install sequentially with the detected runner. Run the host typecheck after each meaningful install.
4. For chat-enabled work, read [chat integration](references/chat-integration.md). Register each `.tool` on the server and each full definition in the client renderer; either half alone is incomplete.
5. For `data-browser` reasoning, also read [rendered-data](references/rendered-data.md). Keep the provider and client-tool output browser-owned and no-refetch.
6. Run `node scripts/doctor.mjs <project-root> --items <csv>`. Use `--run` only after static checks are clean to run the detected typecheck, lint, and build commands.
7. Report selected items, installed URLs, host glue, checks passed, known failures, and separately unverified provider, browser, live-registry, device, or deployment behavior.

## Commands

Use the runner that preflight reports. Example for pnpm:

```bash
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/metric-card.json --dry-run
pnpm dlx shadcn@latest add https://fable-ui.shobky.com/r/metric-card.json --yes
pnpm exec tsc --noEmit
```

On Windows, use `pnpm.cmd` when PowerShell blocks the pnpm shim. For an existing Fable item, inspect the shadcn diff and merge the specific change; never overwrite by default.

## Completion standard

- Install the smallest complete requested item set from hosted URLs.
- Register selected chat tools on the server and full definitions on the client.
- Supply explicit host callbacks for interactive tools; email is a user-controlled compose handoff, not automatic delivery.
- Keep rendered-data reads in the provider cache with no new fetch.
- Resolve doctor errors owned by the integration, then report typecheck, lint, build, and any browser smoke independently.
