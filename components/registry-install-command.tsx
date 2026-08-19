import { CodeBlockCommand } from "@/components/code-block-command"
import { getHostedRegistryItemCommand } from "@/lib/registry-commands"

export function RegistryInstallCommand({ itemName }: { itemName: string }) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border bg-code">
      <CodeBlockCommand
        __pnpm__={getHostedRegistryItemCommand(itemName, "pnpm")}
        __npm__={getHostedRegistryItemCommand(itemName, "npm")}
        __yarn__={getHostedRegistryItemCommand(itemName, "yarn")}
        __bun__={getHostedRegistryItemCommand(itemName, "bun")}
      />
    </div>
  )
}
