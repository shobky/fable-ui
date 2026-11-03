import type { Metadata } from "next"

import { PlaygroundClient } from "./playground-client"

export const metadata: Metadata = {
  title: "Playground",
  description: "Watch an agent answer with articles, tables, charts, forms, drafts and galleries, streamed and themed.",
}

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
