import { type Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, ShieldCheckIcon, SwatchBookIcon, WavesIcon } from "lucide-react"

import { CopyPrompt } from "@/components/docs/copy-prompt"
import { HomeDemo } from "@/components/home/home-demo"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { CONTENT_BLOCKS } from "@/components/fable-ui/schema"

const title = "Your agent's answers, designed."
const description =
  "Fable UI gives your AI agent a design system it can speak. It streams articles, tables, charts, forms, editable drafts and galleries — rendered with shadcn/ui components you own."

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: { absolute: "Fable UI — generative UI for AI agents" },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title, description },
  twitter: { card: "summary", title, description },
}

const pillars = [
  {
    icon: WavesIcon,
    title: "Streams without jumping",
    body: "Finished blocks land as they close. The open block streams its text or holds its exact space, so nothing shifts under the reader.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Nothing the model writes runs",
    body: "The model writes JSON, not code. Every block is validated and bounded, links and images pass a policy, and side effects only run through actions you register.",
  },
  {
    icon: SwatchBookIcon,
    title: "Looks like your product",
    body: "Blocks read your shadcn tokens. Paste a theme from the shadcn customizer or use one of six presets, in light and dark.",
  },
]

export default function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="container-wrapper">
        <div className="container flex flex-col items-center gap-6 px-6 pt-16 pb-12 text-center sm:pt-24">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            24 blocks · 3 layouts · 6 themes
            <ArrowRightIcon className="size-3" />
          </Link>
          <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href="/playground">
                Open the playground <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs/installation">Install</Link>
            </Button>
          </div>
          <code className="mt-2 max-w-full overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground sm:text-sm">
            npx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json
          </code>
        </div>
      </section>

      <section className="container-wrapper">
        <div className="container px-4 pb-20 sm:px-6">
          <HomeDemo />
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container grid gap-10 px-6 py-16 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="space-y-2">
              <pillar.icon className="size-5 text-primary" aria-hidden />
              <h2 className="font-heading text-lg font-semibold tracking-tight">{pillar.title}</h2>
              <p className="text-sm leading-6 text-pretty text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container grid gap-10 px-6 py-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">Let your coding agent install it</h2>
            <p className="text-sm leading-6 text-pretty text-muted-foreground">
              Copy a prompt into Claude Code, Cursor, Codex or any agent. Each one lists prerequisites, the exact commands, and how to verify the result.
            </p>
            <Button asChild variant="link" className="px-0">
              <Link href="/docs/agent-setup">
                All agent guides <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <div>
            <CopyPrompt id="newApp" className="mt-0" />
            <CopyPrompt id="existingChat" />
            <CopyPrompt id="customBlock" />
          </div>
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container px-6 py-16">
          <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight">The catalog</h2>
          <ul className="flex flex-wrap gap-2">
            {[...Object.keys(CONTENT_BLOCKS), "columns", "section", "tabs"].map((name) => (
              <li key={name}>
                <Link
                  href={`/docs/blocks#${name}`}
                  className="inline-flex rounded-full px-3 py-1.5 font-mono text-xs ring-1 ring-border transition-colors hover:bg-muted"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
