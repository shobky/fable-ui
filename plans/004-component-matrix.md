# Component verification — 2026-11-13

Implemented plans 003/004 in the current dirty worktree at 6df3266. All 27 canonical previews were measured in the browser at 320, 390, and 1280 CSS px in light/dark appearances. Their preview frames had zero horizontal overflow; local wide-table/code scrolling is intentional. Component frame widths were 257, 327, and 640px. The initial 2px docs document overflow at 320px came from the shared header; spacing was fixed and the light matrix rerun at all three widths with zero document overflow. See evidence/block-metrics.json for raw values.

| Component | Default responsive frame | Automated rendering | Additional observed interaction |
| --- | --- | --- | --- |
| markdown | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| heading | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| callout | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| quote | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| code | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| divider | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| metrics | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| table | No frame overflow at 320/390/1280 | Passed fixture assertion | Browser keyboard focus and ArrowRight scrolled 40px; unit tests cover overflow changes/non-sortable/vertical-only |
| chart | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| details | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| list | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| checklist | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| faq | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| sources | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| image | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| gallery | No frame overflow at 320/390/1280 | Passed fixture assertion | Featured preview measured; carousel motion preference and RTL covered by focused unit tests |
| cards | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| hero | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| article | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| form | No frame overflow at 320/390/1280 | Passed fixture assertion | Invalid submit focused Project name and exposed aria-invalid |
| template | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| email | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| actions | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| file | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| columns | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| section | No frame overflow at 320/390/1280 | Passed fixture assertion | No separate manual interaction recorded |
| tabs | No frame overflow at 320/390/1280 | Passed fixture assertion | Details activated and table panel rendered |

## Integrated playground checks

- Document scroll overflow was [0,0] at 320, 640, 1024, and 1280px.
- Mobile examples: exactly one nav scroller; search, no-results, reset, and selecting the comparison scenario worked; the drawer closed and the answer streamed.
- Settings: labelled Select controls exposed agent, speed, and preset; Cobalt selection, dark appearance, and RTL changes worked. No live model request was made.
- Inspector: narrow drawer rendered empty and populated states; Escape closed it and restored focus to the Inspector button. At 1280px it rendered beside the catalog and conversation.
- Search clear/reset now returns focus to its input, following independent review.

## Checks and limits

- Full Vitest: 98 passed, 14 skipped. TypeScript and focused ESLint passed. Registry dependency check and normalized embedded table/media source equality passed.
- Independent Sol source/diff review: no must-fix findings; focus recovery improvement resolved. React review checklist applied: effects clean up listeners/observers, state is component scoped, no new dependencies or protocol changes.
- Not verified: actual browser 200% zoom (640px reflow was checked), screen-reader speech, full rendered contrast matrix, pseudo-localization/long strings for every block, live providers, physical devices, and manual keyboard interaction for every widget. The canonical fixtures and targeted interaction tests support the specific fixes, not universal accessibility certification.

Production build: the default Turbopack run stalled during compilation and was stopped; the webpack run reported DNS failure (ENOTFOUND fonts.googleapis.com) fetching the four existing Google fonts. Production compilation is not verified in this environment.
