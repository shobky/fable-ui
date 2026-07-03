import { CodeBlockCommand } from "@/components/code-block-command"
import { getGithubRegistryItemCommand } from "@/lib/registry-commands"

export function RegistryInstallCommand({ itemName }: { itemName: string }) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border bg-code">
      <CodeBlockCommand
        __pnpm__={getGithubRegistryItemCommand(itemName, "pnpm")}
        __npm__={getGithubRegistryItemCommand(itemName, "npm")}
        __yarn__={getGithubRegistryItemCommand(itemName, "yarn")}
        __bun__={getGithubRegistryItemCommand(itemName, "bun")}
      />
    </div>
  )
}
