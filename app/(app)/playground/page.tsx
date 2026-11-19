import type { Metadata } from "next"

import { PlaygroundClient } from "./playground-client"

export const metadata: Metadata = {
  title: "Playground",
  openGraph: { title: "Fable UI Playground", images: [{ url: "/brand/playground.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/brand/playground.png"] },
  description: "Watch an agent answer with articles, tables, charts, forms, drafts and galleries, streamed and themed.",
}

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
