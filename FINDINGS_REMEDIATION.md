# Consumer findings remediation ledger

Source evidence: `D:\fable-ui-test\FINDINGS.md`, `PHASE2_INSTALL_LOG.md`,
`PHASE3_ROUTING_LOG.md`, `SETUP_GUIDE.md`, `AGENT_CONTEXT.md`, and the safety
principles retained from the obsolete `MCP_SERVER_PROPOSAL.md`.

Status meanings:

- `pending`: source repair or regression coverage is not complete.
- `local-fixed`: the source, built artifact, and local regression check pass.
- `live-verified`: the owner has deployed the release and a fresh consumer has
  verified the public endpoint.

| Finding | Source ownership | Intended repair | Regression proof | Local | Live |
| --- | --- | --- | --- | --- | --- |
| F-01 email import | Email composer source and built item | Rebuild the corrected primary-file export boundary and install it after text editor | Per-item clean-consumer typecheck and email-chat fixture | local-fixed | pending |
| F-02 install origin | Registry command helpers, docs, registry dependencies | Use the hosted `/r/<item>.json` origin throughout the complete dependency graph | Command/dependency assertions plus local HTTP registry install | local-fixed | pending |
| F-03 catalog gaps | README and Installation | List all 13 items; describe core as normally transitive | Registry-to-doc catalog assertion | local-fixed | pending |
| F-04 target gaps | README and Installation | Document routes, hooks, drivers, helpers, UI primitives, and installed docs | Registry target-category assertion | local-fixed | pending |
| F-05 Firebase/pnpm | Firebase docs and consumer smoke | Explain the pnpm 11 build-policy decision without prescribing unsafe approval | Isolated Firebase install diagnostic | local-fixed | pending |
| F-06 quickstart scope | Quickstart README and integration docs | Keep two-tool starter explicit and add selected-tool extension recipes | Quickstart registry/renderer assertion | local-fixed | pending |
| F-07 rendered-data loop | AI SDK docs and skill reference | Document and test shared provider, client output, and narrow continuation | Provider no-refetch and continuation fixture | local-fixed | pending |
| F-08 collect input | `collect-input-tool.ts` | Replace permissive model schema with strict discriminated variants | Valid-field and irrelevant-field schema tests | local-fixed | pending |
| F-09 consumer lint | Core registry, Firebase driver, smoke fixture | Remove published lint defects and lint installed files | Source registry lint plus clean-consumer lint | local-fixed | pending |
| F-10 tooltip provider | Code block source and built item | Rebuild self-contained provider behavior and remove stale guidance | Installed runtime/browser tooltip check | local-fixed | pending |
| F-11 manifest docs | Manifests docs and registry metadata | List every installed manifest including rendered-data routing | Manifest completeness assertion | local-fixed | pending |
| F-12 env reuse | Installation and quickstart docs | Warn that `.env.local` does not expand shell references | Documentation assertion | local-fixed | pending |
| F-13 Windows command | Installation troubleshooting | Document `pnpm.cmd` fallback when `pnpm.ps1` is blocked | Documentation assertion | local-fixed | pending |

Production is intentionally a second gate. Do not mark the Live column until
the owner publishes and the same checks pass against `https://fable-ui.shobky.com`.
