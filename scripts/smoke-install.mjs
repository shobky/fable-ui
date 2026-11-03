// Installs the built registry into a fresh Next.js app and type-checks it.
// Needs network access (npm and ui.shadcn.com). Usage: node scripts/smoke-install.mjs [--keep]
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const keep = process.argv.includes("--keep")
const win = process.platform === "win32"
const pnpm = win ? "pnpm.cmd" : "pnpm"
const run = (command, args, cwd) => {
  console.log(`\n$ ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: win })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`)
}

if (!existsSync("public/r/fable-chat.json")) run(pnpm, ["registry:build"], ".")

const app = mkdtempSync(join(tmpdir(), "fable-smoke-"))
const ready = join(app, ".registry-ready")
const server = spawn(process.execPath, [resolve("scripts/serve-registry.mjs"), resolve("public/r"), ready, "--rewrite-hosted-dependencies"], {
  stdio: "inherit",
})

try {
  for (let i = 0; i < 100 && !existsSync(ready); i++) await new Promise((r) => setTimeout(r, 100))
  const origin = JSON.parse(readFileSync(ready, "utf8")).baseUrl

  run(pnpm, ["dlx", "create-next-app@latest", "app", "--ts", "--tailwind", "--app", "--eslint", "--no-src-dir", "--import-alias", "@/*", "--use-pnpm", "--yes"], app)
  const root = join(app, "app")
  run(pnpm, ["dlx", "shadcn@latest", "init", "--yes", "--defaults"], root)
  run(pnpm, ["dlx", "shadcn@latest", "add", `${origin}/r/fable-chat.json`, `${origin}/r/fable-themes.json`, "--yes"], root)

  writeFileSync(join(root, ".env.local"), "OPENAI_API_KEY=sk-smoke-test\n")
  run(pnpm, ["exec", "tsc", "--noEmit"], root)
  run(process.execPath, [resolve(".agents/skills/fable-ui/scripts/doctor.mjs"), root], ".")
  run(pnpm, ["build"], root)
  console.log(`\nSmoke install passed in ${root}`)
} finally {
  server.kill()
  if (!keep) rmSync(app, { recursive: true, force: true })
}
