import { type Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, ShieldCheckIcon, SwatchBookIcon, WavesIcon } from "lucide-react"

import { CopyPrompt } from "@/components/docs/copy-prompt"
import { FableMark } from "@/components/fable-logo"
import { HomeDemo } from "@/components/home/home-demo"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"
import { CONTENT_BLOCKS } from "@/components/fable-ui/schema"

const title = "Your agent's answers, designed."
const description =
  "Fable UI gives your AI agent a design system it can speak. It streams articles, tables, charts, forms, editable drafts and galleries — rendered with shadcn/ui components you own."

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: { absolute: "Fable UI — generative UI for AI agents" },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title, description, images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
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
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-16 pb-12 text-center sm:pt-24">
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:0ms] [animation-fill-mode:both]">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
              <FableMark className="size-3.5" />
              24 blocks · 3 layouts · 6 themes
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:100ms] [animation-fill-mode:both]">
            <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              {title}
            </h1>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:200ms] [animation-fill-mode:both]">
            <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:300ms] [animation-fill-mode:both] flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl shadow-xs transition-[transform,box-shadow] active:scale-[0.96]">
              <Link href="/playground">
                Open the playground <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl shadow-2xs transition-[transform,background-color] active:scale-[0.96]">
              <Link href="/docs/installation">Install</Link>
            </Button>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:400ms] [animation-fill-mode:both] relative mt-1 flex max-w-full items-center">
            <div className="flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 py-1.5 ps-3 pe-2 shadow-2xs backdrop-blur-xs transition-[border-color,background-color] hover:border-border">
              <span className="select-none font-mono text-xs text-muted-foreground/60">$</span>
              <code className="overflow-x-auto font-mono text-xs text-foreground/90 sm:text-sm">
                npx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json
              </code>
              <CopyButton
                value="npx shadcn@latest add https://fable-ui.shobky.com/r/fable-chat.json"
                className="static size-7 shrink-0 rounded-lg bg-background shadow-2xs hover:bg-muted active:scale-[0.96] transition-[scale]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-wrapper">
        <div className="container mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <HomeDemo />
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-2xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-xs"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <pillar.icon className="size-5" aria-hidden />
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-tight">{pillar.title}</h2>
              <p className="text-sm leading-6 text-pretty text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col justify-center gap-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Let your coding agent install it</h2>
            <p className="text-sm leading-6 text-pretty text-muted-foreground">
              Copy a prompt into Claude Code, Cursor, Codex or any agent. Each one lists prerequisites, the exact commands, and how to verify the result.
            </p>
            <div className="pt-1">
              <Button asChild variant="link" className="px-0 font-medium active:scale-[0.96] transition-[scale]">
                <Link href="/docs/agent-setup">
                  All agent guides <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <CopyPrompt id="newApp" className="mt-0" />
            <CopyPrompt id="existingChat" />
            <CopyPrompt id="customBlock" />
          </div>
        </div>
      </section>

      <section className="container-wrapper border-t border-border/60">
        <div className="container mx-auto max-w-5xl px-6 py-16">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">The catalog</h2>
            <p className="text-sm text-muted-foreground">Explore all copy-and-own blocks streaming directly into your AI chat.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {[...Object.keys(CONTENT_BLOCKS), "columns", "section", "tabs"].map((name) => (
              <li key={name}>
                <Link
                  href={`/docs/blocks#${name}`}
                  className="inline-flex rounded-lg border border-border/70 bg-card px-3 py-1.5 font-mono text-xs text-foreground/90 shadow-2xs transition-[background-color,border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border hover:bg-accent hover:text-foreground hover:shadow-xs active:scale-[0.96]"
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
