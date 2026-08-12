import * as React from "react"
import Link from "next/link"

import { siteConfig } from "@/lib/config"
import { Icons } from "@/components/icons"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

export function GitHubLink() {
  return (
    <Button asChild size="sm" variant="ghost" className="h-8 shadow-none rounded-md">
      <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
        <span className="sr-only">GitHub repository</span>
        <Icons.gitHub />
        <React.Suspense fallback={<Skeleton className="h-4 w-10.5" />}>
          <StarsCount />
        </React.Suspense>
      </Link>
    </Button>
  )
}

export async function StarsCount() {
  const data = await fetch("https://api.github.com/repos/shobky/fable-ui", {
    next: { revalidate: 86400 },
  })
  const json = await data.json()

  const starCount = json.stargazers_count

  if (typeof starCount !== "number" || !Number.isFinite(starCount)) {
    return null
  }

  const formattedCount =
    starCount >= 1000
      ? `${Math.round(starCount / 1000)}k`
      : starCount.toLocaleString()

  return (
    <>
      <span
        aria-hidden="true"
        className="w-fit text-xs text-muted-foreground tabular-nums"
      >
        {formattedCount}
      </span>
      <span className="sr-only">, {formattedCount} stars</span>
    </>
  )
}
