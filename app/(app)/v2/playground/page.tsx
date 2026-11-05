import type { Metadata } from "next"

import { PlaygroundClient } from "./playground-client"

export const metadata: Metadata = {
  title: "Fable UI 2.0 Playground",
  description: "A deterministic, composable Fable UI 2.0 preview.",
}

export default function FableV2PlaygroundPage() {
  return <PlaygroundClient />
}
