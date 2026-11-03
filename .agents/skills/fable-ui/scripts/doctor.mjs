#!/usr/bin/env node
// Checks a Next.js app for what Fable UI needs. Read-only; prints a report.
// Usage: node doctor.mjs [app-root]
import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(process.argv[2] ?? ".")
const results = []
const check = (ok, label, fix) => results.push({ ok, label, fix })

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"))
  } catch {
    return null
  }
}
const major = (range) => Number(String(range ?? "").replace(/^[^\d]*/, "").split(".")[0]) || 0

const pkg = readJson("package.json")
if (!pkg) {
  console.error(`No package.json in ${root}`)
  process.exit(1)
}
const deps = { ...pkg.dependencies, ...pkg.devDependencies }

check(major(deps.next) >= 15, `Next.js ${deps.next ?? "missing"}`, "Fable needs Next.js 15+ with the App Router.")
check(major(deps.react) >= 19, `React ${deps.react ?? "missing"}`, "Upgrade to React 19.")
check(major(deps.tailwindcss) >= 4, `Tailwind CSS ${deps.tailwindcss ?? "missing"}`, "Fable uses Tailwind v4 container queries.")
check(major(deps.ai) >= 7, `AI SDK ${deps.ai ?? "missing"}`, "Install ai@^7 (the registry item does this).")
check(Boolean(deps.zod) && major(deps.zod) >= 4, `zod ${deps.zod ?? "missing"}`, "Install zod@^4.")

const appDir = ["app", "src/app"].find((dir) => existsSync(join(root, dir)))
check(Boolean(appDir), `App Router directory: ${appDir ?? "not found"}`, "Fable's route and page target the App Router.")

const components = readJson("components.json")
check(Boolean(components), "shadcn components.json", "Run `npx shadcn@latest init`.")
if (components) {
  check(components.tailwind?.cssVariables !== false, "shadcn CSS variables enabled", "Set tailwind.cssVariables to true; Fable reads theme variables.")
  check(Boolean(components.aliases?.components && components.aliases?.utils), "components/utils aliases", "Add aliases.components and aliases.utils to components.json.")
}

const tsconfig = readJson("tsconfig.json")
const paths = tsconfig?.compilerOptions?.paths ?? {}
check(Boolean(paths["@/*"]), "tsconfig path alias @/*", "Fable files import from @/components and @/lib.")

const cssPath = components?.tailwind?.css
const css = cssPath && existsSync(join(root, cssPath)) ? readFileSync(join(root, cssPath), "utf8") : ""
check(Boolean(css), `Global CSS: ${cssPath ?? "unknown"}`, "Set tailwind.css in components.json.")
if (css) {
  check(/--font-heading\s*:/.test(css), "font-heading token", "Add `--font-heading: var(--fable-font-heading, var(--font-sans));` to @theme inline.")
  check(/--chart-1\s*:/.test(css), "chart colors --chart-1…5", "Add chart variables (any shadcn theme includes them).")
  const usesPresets = existsSync(join(root, "styles/fable-themes.css"))
  if (usesPresets) check(/fable-themes\.css/.test(css), "fable-themes.css imported", "@import the presets file after tailwind.")
}

const installed = ["components/fable-ui/renderer.tsx", "src/components/fable-ui/renderer.tsx"].find((file) => existsSync(join(root, file)))
check(Boolean(installed), `Fable UI installed: ${installed ?? "no"}`, "npx shadcn@latest add https://fable-ui.shobky.com/r/fable-ui.json")

const route = ["app/api/fable-chat/route.ts", "src/app/api/fable-chat/route.ts"].find((file) => existsSync(join(root, file)))
if (route) {
  const envFile = [".env.local", ".env"].find((file) => existsSync(join(root, file)))
  const env = envFile ? readFileSync(join(root, envFile), "utf8") : ""
  const source = readFileSync(join(root, route), "utf8")
  const provider = source.match(/@ai-sdk\/(\w+)/)?.[1] ?? "openai"
  const keyName = { openai: "OPENAI_API_KEY", anthropic: "ANTHROPIC_API_KEY", google: "GOOGLE_GENERATIVE_AI_API_KEY", mistral: "MISTRAL_API_KEY" }[provider]
  if (keyName) check(new RegExp(`^${keyName}=.+`, "m").test(env), `${keyName} set in ${envFile ?? ".env.local"}`, `Add ${keyName} to .env.local (never commit it).`)
}

const width = Math.max(...results.map((result) => result.label.length))
for (const result of results) {
  console.log(`${result.ok ? "✓" : "✗"} ${result.label.padEnd(width)}${result.ok ? "" : `  → ${result.fix}`}`)
}
const failed = results.filter((result) => !result.ok).length
console.log(failed ? `\n${failed} issue(s) to fix.` : "\nReady for Fable UI.")
process.exit(failed ? 1 : 0)
