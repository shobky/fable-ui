import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body
        className={cn(
          "group/body overscroll-none antialiased [--footer-height:calc(var(--spacing)*14)] [--header-height:calc(var(--spacing)*14)] lg:[--header-height:calc(var(--spacing)*16)] xl:[--footer-height:calc(var(--spacing)*24)]"
        )}>
        <ThemeProvider>
          <div
            data-slot="layout"
            className="group/layout relative z-10 flex min-h-svh flex-col bg-background has-data-[slot=designer]:h-svh has-data-[slot=designer]:overflow-hidden"
          >
            <SiteHeader />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
            <p className="max-w-3xl mx-auto text-muted-foreground py-12">Built by <Link className="underline" href={"https://shobky.vercel.app"} target="blank">@shobky</Link>. The source code is available on <Link className="underline" href={siteConfig.links.github} target="blank">
              github</Link></p>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
