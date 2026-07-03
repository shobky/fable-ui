import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

type Config = {
  style: "radix-rhea"
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  installationType: "cli" | "manual"
}

const configAtom = atomWithStorage<Config>("config", {
  style: "radix-rhea",
  packageManager: "pnpm",
  installationType: "cli",
})

export function useConfig() {
  return useAtom(configAtom)
}
