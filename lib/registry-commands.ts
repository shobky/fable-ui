import { siteConfig } from "@/lib/config"

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

export function getGithubRegistryItemAddress(itemName: string) {
  return `${siteConfig.registry.github}/${itemName}`
}

export function getGithubRegistryItemCommand(itemName: string, packageManager: PackageManager) {
  const address = getGithubRegistryItemAddress(itemName)

  switch (packageManager) {
    case "npm":
      return `npx shadcn@latest add ${address}`
    case "yarn":
      return `yarn dlx shadcn@latest add ${address}`
    case "bun":
      return `bunx --bun shadcn@latest add ${address}`
    case "pnpm":
    default:
      return `pnpm dlx shadcn@latest add ${address}`
  }
}

export function getRegistryNamespaceCommand(packageManager: PackageManager) {
  switch (packageManager) {
    case "npm":
      return `npx shadcn@latest registry add ${siteConfig.registry.namespace}`
    case "yarn":
      return `yarn dlx shadcn@latest registry add ${siteConfig.registry.namespace}`
    case "bun":
      return `bunx --bun shadcn@latest registry add ${siteConfig.registry.namespace}`
    case "pnpm":
    default:
      return `pnpm dlx shadcn@latest registry add ${siteConfig.registry.namespace}`
  }
}

export function getHostedRegistryItemUrl(itemName: string) {
  return `${siteConfig.registry.hostedBaseUrl}/${itemName}.json`
}
