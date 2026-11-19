"use client"

// The renderer entry is intentionally independent of the AI SDK adapter. It
// accepts an already-produced JSON spec and can be embedded in any React app.
export { FableProvider, FableScope, useFable, useFableState } from "./provider"
export type { FableConfig, FableHostAction } from "./provider"
export { FableRenderer } from "./renderer"
export type { FableRendererProps } from "./renderer"
export { resolveSpec } from "./resolve"
export { specToMarkdown } from "./to-markdown"
export type * from "./schema"
