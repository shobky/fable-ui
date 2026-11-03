const siteUrl = "https://fable-ui.shobky.com"

export const siteConfig = {
  name: "fable-ui",
  url: siteUrl,
  description:
    "Generative UI for your AI agent: copy-and-own shadcn/ui blocks your model streams as articles, tables, charts, forms, drafts and galleries.",
  links: {
    twitter: "",
    github: "https://github.com/shobky/fable-ui",
  },
  registry: {
    github: "shobky/fable-ui",
    namespace: "@fable-ui",
    itemUrl: "https://github.com/shobky/fable-ui",
    hostedBaseUrl: process.env.NEXT_PUBLIC_FABLE_REGISTRY_URL ?? `${siteUrl}/r`,
  },
  navItems: [
    { href: "/", label: "Home" },
    { href: "/docs/introduction", label: "Docs" },
    { href: "/docs/blocks", label: "Blocks" },
    { href: "/playground", label: "Playground" },
  ],
}
