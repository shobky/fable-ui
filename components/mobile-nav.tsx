"use client"

import * as React from "react"
import Link, { type LinkProps } from "next/link"
import { usePathname } from "next/navigation"

import { PAGES_NEW } from "@/lib/docs"
import { getPagesFromFolder } from "@/lib/page-tree"
import { type source } from "@/lib/source"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const TOP_LEVEL_SECTIONS = [
  { name: "Introduction", href: "/docs/introduction" },
  {
    name: "Installation",
    href: "/docs/installation",
  },
  {
    name: "Registry",
    href: "/docs/registry",
  },
  {
    name: "Manifests",
    href: "/docs/manifests",
  },
  {
    name: "AI SDK Integration",
    href: "/docs/ai-sdk-integration",
  },
]

export function MobileNav({
  tree,
  items,
  className,
}: {
  tree: typeof source.pageTree
  items: { href: string; label: string }[]
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "extend-touch-target h-8 touch-manipulation flex items-center justify-start gap-2.5 p-0! ",
            className
          )}
        >
          <div className="relative flex h-8 w-4 items-center justify-center">
            <div className="relative size-4">
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100",
                  open ? "top-[0.4rem] -rotate-45" : "top-1"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100",
                  open ? "top-[0.4rem] rotate-45" : "top-2.5"
                )}
              />
            </div>
            <span className="sr-only">Toggle Menu</span>
          </div>
          <span className="flex h-8 items-center text-lg leading-none font-medium">
            Menu
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="no-scrollbar h-(--radix-popper-available-height) w-(--radix-popper-available-width) overflow-y-auto rounded-none border-none bg-background/90 p-0 shadow-none backdrop-blur duration-100 data-open:animate-none!"
        align="start"
        side="bottom"
        alignOffset={-16}
        sideOffset={14}
      >
        <div className="flex flex-col gap-12 overflow-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Menu
            </div>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  onOpenChange={setOpen}
                >
                  {item.label}
                </MobileLink>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Sections
            </div>
            <div className="flex flex-col gap-3">
              {TOP_LEVEL_SECTIONS.map(({ name, href }) => (
                <MobileLink key={name} href={href} onOpenChange={setOpen}>
                  {name}
                  {PAGES_NEW.includes(href) && (
                    <span
                      className="flex size-2 rounded-full bg-blue-500"
                      title="New"
                    />
                  )}
                </MobileLink>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {tree.children.map((group) => {
              if (group.type !== "folder") {
                return null
              }

              return (
                <div key={group.$id} className="flex flex-col gap-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    {group.name}
                  </div>
                  <div className="flex flex-col gap-3">
                    {getPagesFromFolder(group).map((item) => (
                      <MobileLink
                        key={item.url}
                        href={item.url}
                        onOpenChange={setOpen}
                        className="flex items-center gap-2"
                      >
                        {item.name}
                        {PAGES_NEW.includes(item.url) && (
                          <span
                            className="flex size-2 rounded-full bg-blue-500"
                            title="New"
                          />
                        )}
                      </MobileLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: LinkProps & {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const isActive = typeof href === "string" && pathname === href

  return (
    <Link
      href={href}
      onClick={() => onOpenChange?.(false)}
      data-active={isActive}
      className={cn(
        "flex items-center gap-2 text-2xl font-medium data-[active=true]:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
