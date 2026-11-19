import Link from "next/link"

import { FableLogo } from "@/components/fable-logo"
import { GitHubLink } from "@/components/github-link"
import { ModeSwitcher } from "@/components/mode-switcher"
import { PlaygroundButton } from "@/components/playground-button"
import { siteConfig } from "@/lib/config"
import { source } from "@/lib/source"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"

export function SiteHeader() {
  const navItems = siteConfig.navItems.filter(
    (item) => item.href !== "/playground"
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="3xl:fixed:px-0 container-wrapper px-4 group-has-data-[slot=designer]/layout:max-w-none sm:px-6">
        <div className="group-has-data-[slot=designer]/layout:fixed:max-w-none 3xl:fixed:container flex h-(--header-height) min-w-0 items-center gap-3">
          <MobileNav
            tree={source.pageTree}
            items={navItems}
            className="flex lg:hidden"
          />
          <Link
            href="/"
            aria-label="Fable UI home"
            className="flex shrink-0 items-center rounded-md text-foreground transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FableLogo className="h-8 w-auto" />
          </Link>
          <MainNav items={navItems} className="hidden min-w-0 lg:flex" />

          <div className="ms-auto flex min-w-0 items-center justify-end gap-1.5 md:gap-2">
            <PlaygroundButton />
            <GitHubLink />
            <ModeSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
