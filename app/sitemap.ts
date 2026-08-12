import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/config"
import { source } from "@/lib/source"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
    },
    ...source.getPages().map((page) => ({
      url: new URL(page.url, siteConfig.url).toString(),
    })),
  ]
}
