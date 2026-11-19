// Installs the renderer-only registry item into clean Next.js and Vite React
// apps, then type-checks/builds both consumers. Needs network access.
// Usage: node scripts/smoke-renderer.mjs [--keep]
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, resolve, sep } from "node:path"

const keep = process.argv.includes("--keep")
const viteOnly = process.argv.includes("--vite-only")
const win = process.platform === "win32"
const pnpm = win ? "pnpm.cmd" : "pnpm"

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: win && /\.(cmd|bat)$/i.test(command) })
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`)
}

function packageJson(root) {
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
}

function assertRendererOnly(root, framework) {
  const packageData = packageJson(root)
  const dependencies = { ...packageData.dependencies, ...packageData.devDependencies }
  if (dependencies.ai || dependencies["@ai-sdk/react"]) {
    throw new Error(`${framework} renderer install unexpectedly includes an AI SDK dependency`)
  }
  const forbidden = framework === "next" ? [join(root, "app", "api"), join(root, "app", "fable-chat")] : []
  for (const path of forbidden) {
    if (existsSync(path)) throw new Error(`${framework} renderer install unexpectedly created ${path}`)
  }
}

function startRegistry(root) {
  const ready = join(root, ".registry-ready")
  const server = spawn(
    process.execPath,
    // serve-registry expects the directory that contains the /r folder.
    [resolve("scripts/serve-registry.mjs"), resolve("public"), ready, "--rewrite-hosted-dependencies"],
    { stdio: "inherit" }
  )
  return { ready, server }
}

function rendererPage() {
  return `import { FableRenderer } from "@/components/fable-ui/renderer-only"\n\nexport default function Page() {\n  return <main><FableRenderer spec={{ blocks: [{ type: "heading", text: "Renderer smoke test" }] }} /></main>\n}\n`
}

const root = mkdtempSync(join(tmpdir(), "fable-renderer-smoke-"))
const { ready, server } = startRegistry(root)

try {
  for (let i = 0; i < 100 && !existsSync(ready); i++) await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  if (!existsSync(ready)) throw new Error("Registry server did not become ready.")
  const origin = JSON.parse(readFileSync(ready, "utf8")).baseUrl
  const item = `${origin}/r/fable-renderer.json`

  // Next App Router consumer.
  if (!viteOnly) {
  run(
    pnpm,
    ["dlx", "create-next-app@latest", "next-app", "--ts", "--tailwind", "--app", "--eslint", "--no-src-dir", "--import-alias", "@/*", "--use-pnpm", "--yes"],
    root
  )
  const nextRoot = join(root, "next-app")
  run(pnpm, ["dlx", "shadcn@latest", "init", "--yes", "--base", "radix", "--preset", "nova"], nextRoot)
  run(pnpm, ["dlx", "shadcn@latest", "add", item, "--yes"], nextRoot)
  writeFileSync(join(nextRoot, "app", "page.tsx"), rendererPage())
  assertRendererOnly(nextRoot, "next")
  run(pnpm, ["exec", "tsc", "--noEmit"], nextRoot)
  run(pnpm, ["build"], nextRoot)
  }

  // Configure an existing Vite host before installing the registry item.
  run(pnpm, ["dlx", "create-vite@latest", "vite-app", "--template", "react-ts"], root)
  const viteRoot = join(root, "vite-app")
  run(pnpm, ["install"], viteRoot)
  run(pnpm, ["add", "-D", "tailwindcss@^4", "@tailwindcss/vite@^4", "@types/node"], viteRoot)
  for (const file of ["tsconfig.json", "tsconfig.app.json"]) {
    // Vite templates contain JSON comments. Insert the alias object without
    // parsing or replacing the template's other compiler options.
    const path = join(viteRoot, file)
    let source = readFileSync(path, "utf8")
    const aliases = '"paths": { "@/*": ["./src/*"] },'
    source = source.includes('"compilerOptions"')
      ? source.replace(/"compilerOptions"\s*:\s*\{/, `"compilerOptions": { ${aliases}`)
      : source.replace("{", `{ "compilerOptions": { ${aliases.slice(0, -1)} },`)
    writeFileSync(path, source)
  }
  writeFileSync(join(viteRoot, "src", "index.css"), '@import "tailwindcss";\n')
  writeFileSync(join(viteRoot, "vite.config.ts"), `import { fileURLToPath, URL } from "node:url"\nimport tailwindcss from "@tailwindcss/vite"\nimport react from "@vitejs/plugin-react"\nimport { defineConfig } from "vite"\nexport default defineConfig({ plugins: [react(), tailwindcss()], resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } })\n`)
  run(pnpm, ["dlx", "shadcn@latest", "init", "--yes", "--base", "radix", "--preset", "nova"], viteRoot)
  run(pnpm, ["dlx", "shadcn@latest", "add", item, "--yes"], viteRoot)
  writeFileSync(join(viteRoot, "src", "App.tsx"), rendererPage().replace("export default function Page", "export default function App"))
  assertRendererOnly(viteRoot, "vite")
  run(pnpm, ["exec", "tsc", "-b"], viteRoot)
  run(pnpm, ["build"], viteRoot)

  console.log(`\nRenderer-only smoke install passed${viteOnly ? " (Vite only)" : " (Next and Vite)"} in ${root}`)
} finally {
  server.kill()
  const fromTemp = relative(resolve(tmpdir()), resolve(root))
  if (!fromTemp || fromTemp.startsWith(`..${sep}`) || fromTemp === ".." || resolve(root) === resolve(tmpdir())) {
    throw new Error(`Refusing cleanup outside the consumer workspace: ${root}`)
  }
  if (!keep) rmSync(root, { recursive: true, force: true })
  else console.log(`Kept consumer workspace: ${root}`)
}
