import { type Metadata } from "next"
import Link from "next/link"
import { IconArrowRight } from "@tabler/icons-react"

import { Announcement } from "@/components/announcement"
import { LandingPlaygroundDemo } from "@/components/interactive-demo/landing-playground-demo"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config"
import { SiteFooter } from "@/components/site-footer"


const title = "a copy-and-own registry of AI-intent-aware product experiences."
const description =
  "Fable-UI pairs React components with Vercel AI SDK tool definitions, model-facing manifests, examples, and docs so product engineers can render trusted UI from AI tool calls"

export const dynamic = "force-static"
export const revalidate = false

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
}

export default function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader className="md:**:[.container]:pb-8 lg:**:[.container]:pb-12">
        <Announcement />
        <PageHeaderHeading className="max-w-4xl">{title}</PageHeaderHeading>
        <PageHeaderDescription>{description}</PageHeaderDescription>
        <PageActions>
          <Button asChild className="h-[31px] rounded-lg">
            <Link href="/docs/introduction">
              Read the docs <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </PageActions>
      </PageHeader>
      <div className="container-wrapper flex-1 p-0">
        <div className="container overflow-hidden px-0 lg:max-w-none">
          <LandingPlaygroundDemo />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
