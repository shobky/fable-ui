"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PAGES_BETA, PAGES_NEW } from "@/lib/docs"
import { getPagesFromFolder } from "@/lib/page-tree"
import type { source } from "@/lib/source"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "./ui/badge"

const SECTIONS = [
  {
    label: "Get started",
    pages: [
      { name: "Introduction", href: "/docs/introduction" },
      { name: "Installation", href: "/docs/installation" },
      { name: "Agent setup", href: "/docs/agent-setup" },
    ],
  },
  {
    label: "Build",
    pages: [
      { name: "Blocks", href: "/docs/blocks" },
      { name: "Streaming", href: "/docs/streaming" },
      { name: "Actions", href: "/docs/actions" },
      { name: "Theming", href: "/docs/theming" },
      { name: "Custom blocks", href: "/docs/custom-blocks" },
    ],
  },
  {
    label: "Understand",
    pages: [
      { name: "Security", href: "/docs/security" },
      { name: "Architecture", href: "/docs/architecture" },
      { name: "Evaluation", href: "/docs/evaluation" },
    ],
  },
]

export function DocsSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: typeof source.pageTree }) {
  const pathname = usePathname()

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+0.6rem)] z-30 ml-2 hidden h-[calc(100svh-10rem)] overflow-hidden overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="w-(--sidebar-menu-width) scroll-fade scrollbar-none overflow-x-hidden pl-2.5">
        {SECTIONS.map((section, index) => (
        <SidebarGroup key={section.label} className={index === 0 ? "pt-12" : undefined}>
          <SidebarGroupLabel className="font-medium text-muted-foreground">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.pages.map(
                ({ name, href }: { name: string; href: string }) => {
                  return (
                    <SidebarMenuItem key={name}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        className="3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md data-[active=true]:border-accent data-[active=true]:bg-accent"
                      >
                        <Link href={href}>
                          <span className="absolute inset-0 flex w-(--sidebar-menu-width) bg-transparent" />
                          {name}
                          {PAGES_NEW.includes(href) && (
                            <span
                              className="flex size-2 rounded-full bg-blue-500"
                              title="New"
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ))}
        {tree.children.map((item) => {
          if (item.type !== "folder") {
            return null
          }

          return (
            <SidebarGroup key={item.$id}>
              <SidebarGroupLabel className="font-medium text-muted-foreground">
                {item.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {item.type === "folder" && (
                  <SidebarMenu className="gap-0.5">
                    {getPagesFromFolder(item)
                      .filter((page) => page.url !== "/docs/components")
                      .map((page) => {
                        return (
                          <SidebarMenuItem key={page.url}>
                            <SidebarMenuButton
                              asChild
                              isActive={page.url === pathname}
                              className="3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md data-[active=true]:cursor-default data-[active=true]:bg-transparent data-[active=true]:text-muted-foreground"
                            >
                              <Link href={page.url}>
                                <span className="absolute inset-0 flex w-(--sidebar-menu-width) bg-transparent" />
                                {page.name}
                                {PAGES_NEW.includes(page.url) && (
                                  <span
                                    className="flex size-2 rounded-full bg-blue-500"
                                    title="New"
                                  />
                                )}
                                {PAGES_BETA.includes(page.url) && (
                                  <Badge className="scale-90 bg-yellow-500/15 text-yellow-500">
                                    Beta
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
