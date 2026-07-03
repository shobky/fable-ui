import { DocsSidebar } from "@/components/docs-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { source } from "@/lib/source"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container-wrapper flex min-h-0 flex-1 flex-col px-2">
      <SidebarProvider
        className="min-h-0 flex-1 px-0 [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--top-spacing:calc(var(--spacing)*4)] 3xl:fixed:container 3xl:fixed:px-3"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 47)",
          } as React.CSSProperties
        }
      >
        <DocsSidebar tree={source.pageTree} />

        <div className="flex min-h-0 w-full flex-col overflow-hidden">
          {children}
        </div>
      </SidebarProvider>
    </div>
  )
}