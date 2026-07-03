export const siteConfig = {
  name: "fable-ui",
  url: "https://fable-ui.vercel.app",
  ogImage: "https://fable-ui.vercel.app/og.jpg",
  description:
    "Copy-and-own AI-intent-aware UI components and blocks for Next.js, shadcn/ui, and the Vercel AI SDK.",
  links: {
    twitter: "",
    github: "https://github.com/shobky/fable-ui",
  },
  registry: {
    github: "shobky/fable-ui",
    namespace: "@fable-ui",
    itemUrl: "https://github.com/shobky/fable-ui",
    hostedBaseUrl:
      process.env.NEXT_PUBLIC_FABLE_REGISTRY_URL ?? "https://fable-ui.dev/r",
  },
  navItems: [
    {
      href: "/",
      label: "Home",
    },
    {
      href: "/docs/introduction",
      label: "Docs",
    },
    {
      href: "/docs/components/metric-card",
      label: "Components",
    },
  ],
}
