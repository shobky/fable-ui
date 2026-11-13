// Installs the built registry into a fresh Next.js app and type-checks it.
// Needs network access (npm and ui.shadcn.com). Usage: node scripts/smoke-install.mjs [--keep]
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, resolve, sep } from "node:path"

const keep = process.argv.includes("--keep")
const win = process.platform === "win32"
const pnpm = win ? "pnpm.cmd" : "pnpm"
const run = (command, args, cwd) => {
  console.log(`\n$ ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: win && /\.(cmd|bat)$/i.test(command) })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`)
}

if (!existsSync("public/r/fable-chat.json")) run(pnpm, ["registry:build"], ".")

const app = mkdtempSync(join(tmpdir(), "fable-smoke-"))
const ready = join(app, ".registry-ready")
const server = spawn(process.execPath, [resolve("scripts/serve-registry.mjs"), resolve("public"), ready, "--rewrite-hosted-dependencies"], {
  stdio: "inherit",
})

try {
  for (let i = 0; i < 100 && !existsSync(ready); i++) await new Promise((r) => setTimeout(r, 100))
  const origin = JSON.parse(readFileSync(ready, "utf8")).baseUrl

  run(pnpm, ["dlx", "create-next-app@latest", "app", "--ts", "--tailwind", "--app", "--eslint", "--no-src-dir", "--import-alias", "@/*", "--use-pnpm", "--yes"], app)
  const root = join(app, "app")
  run(pnpm, ["dlx", "shadcn@latest", "init", "--yes", "--base", "radix", "--preset", "nova"], root)
  run(pnpm, ["dlx", "shadcn@latest", "add", `${origin}/r/fable-chat.json`, `${origin}/r/fable-themes.json`, "--yes"], root)

  writeFileSync(join(root, ".env.local"), "OPENAI_API_KEY=sk-smoke-test\n")
  const cssPath = join(root, "app", "globals.css")
  writeFileSync(cssPath, '@import "../styles/fable-themes.css";\n' + readFileSync(cssPath, "utf8") + '\n@theme inline { --font-heading: var(--fable-font-heading, var(--font-sans)); }\n')
  run(pnpm, ["exec", "tsc", "--noEmit"], root)
  run(process.execPath, [resolve(".agents/skills/fable-ui/scripts/doctor.mjs"), root], ".")
  run(pnpm, ["build"], root)
  console.log(`\nSmoke install passed in ${root}`)
} finally {
  server.kill()
  const fromTemp = relative(resolve(tmpdir()), resolve(app))
  if (!fromTemp || fromTemp.startsWith(`..${sep}`) || fromTemp === ".." || resolve(app) === resolve(tmpdir())) {
    throw new Error(`Refusing cleanup outside the consumer workspace: ${app}`)
  }
  if (!keep) rmSync(app, { recursive: true, force: true })
}
