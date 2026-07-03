import { GitHubLink } from "@/components/github-link"
import { ModeSwitcher } from "@/components/mode-switcher"
import { Button } from "./ui/button"
import Link from "next/link"
import { Sparkle } from "lucide-react"
import { siteConfig } from "@/lib/config"
import { source } from "@/lib/source"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-[2px]">
      <div className="container-wrapper px-6 group-has-data-[slot=designer]/layout:max-w-none 3xl:fixed:px-0">
        <div className="flex h-(--header-height) items-center **:data-[slot=separator]:h-4! group-has-data-[slot=designer]/layout:fixed:max-w-none 3xl:fixed:container">
          <MobileNav
            tree={source.pageTree}
            items={siteConfig.navItems}
            className="flex lg:hidden"
          />
          <MainNav items={siteConfig.navItems} className="hidden lg:flex" />

          <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <GitHubLink />
            <ModeSwitcher />

            <div className="flex items-center gap-2 ml-2 group-has-data-[slot=designer]/layout:hidden">
              <Button asChild size="sm" className="h-[31px] rounded-lg">
                <Link href="/chat">
                  Playground
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
