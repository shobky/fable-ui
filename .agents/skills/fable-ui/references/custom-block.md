# Adding a custom block

All paths are in `components/fable-ui/`.

1. **`schema.ts`** — define `const XBlock = z.object({ type: z.literal("x"), ... })`. Bound every string (`label(n)`, `text(n)`) and array (`.max(n)`). Add it to `CONTENT_BLOCKS` and `ALL_CONTENT`. Add `"x"` to `STREAMABLE_BLOCKS` only if a partial version is useful to show.
2. **`blocks/x.tsx`** — `export function XBlock({ block }: { block: BlockOf<"x"> })`. Rules:
   - shadcn tokens only (`bg-card`, `text-muted-foreground`, `ring-border`, `var(--chart-n)`); no hex colors;
   - the shared `surface` class for framed blocks;
   - container-query breakpoints (`@lg:`, `@2xl:`), not viewport ones;
   - `tabular-nums` for numbers, `text-balance` on headings, `text-pretty` on prose;
   - images through `FableImg`, links through `safeLinkUrl`, buttons through `ActionButton`;
   - local state through `useFableState(key, initial)` so it survives streaming.
3. **`renderer.tsx`** — add a `case "x"` in `Content`.
4. **`blocks/skeleton.tsx`** — add a case if the default text lines don't match the block's footprint.
5. **`to-markdown.ts`** — add a case.
6. **`prompt.ts`** — add one line to `guide` saying when to use it.
7. **Test** — add an example to `lib/block-examples.ts` (if present) and run the tests and type checker.
