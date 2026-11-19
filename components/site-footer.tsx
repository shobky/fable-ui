import { FableLogo } from "@/components/fable-logo"
import { siteConfig } from "@/lib/config"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Link href="/" aria-label="Fable UI home"><FableLogo /></Link>
        <p className="text-center text-sm text-muted-foreground sm:text-start">
          Built by{" "}
          <Link
            className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
            href="https://shobky.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            @shobky
          </Link>
          . Source code available on{" "}
          <Link
            className="font-medium underline underline-offset-4 transition-colors hover:text-foreground"
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </Link>
          .
        </p>
        <p className="text-center text-xs text-muted-foreground sm:text-end">
          Generative UI for AI agents · shadcn/ui compatible
        </p>
      </div>
    </footer>
  )
}
