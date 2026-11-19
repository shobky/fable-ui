"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "./ui/button"

/** The site-wide call to action is hidden while the playground is active. */
export function PlaygroundButton() {
  const pathname = usePathname()
  if (pathname === "/playground" || pathname.startsWith("/playground/")) {
    return <div id="playground-header-slot" className="min-w-0 flex-1" />
  }

  return (
    <div className="ms-0 flex items-center gap-2 group-has-data-[slot=designer]/layout:hidden sm:ms-1">
      <Button
        asChild
        size="sm"
        className="h-8 rounded-lg px-3 transition-[scale] active:scale-[0.96]"
      >
        <Link href="/playground">
          <span className="hidden sm:inline">Open playground</span>
          <span className="sm:hidden">Play</span>
        </Link>
      </Button>
    </div>
  )
}
