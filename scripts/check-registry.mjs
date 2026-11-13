// Checks registry.json against the source: files exist, every import inside an
// item resolves to a file in the item (or a dependency item), a declared shadcn
// component, or a declared npm dependency. Run after editing registry files.
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, normalize } from "node:path"

const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const builtIn = new Set(["react", "react-dom", "next"])
const errors = []

const items = new Map(registry.items.map((item) => [item.name, item]))
const ownName = (url) => url.match(/\/r\/([\w-]+)\.json$/)?.[1]

const renderer = items.get("fable-renderer")
if (renderer) {
  const rendererFiles = renderer.files.map((file) => file.path)
  const rendererDeps = renderer.dependencies ?? []
  if (rendererDeps.some((dep) => /^(?:ai|@ai-sdk\/)/.test(dep))) {
    errors.push("fable-renderer: renderer-only item must not depend on the AI SDK")
  }
  if (rendererFiles.some((file) => /(?:tool\.ts|tool-part|prompt\.ts|\/chat\/)/.test(file))) {
    errors.push("fable-renderer: renderer-only item includes an AI adapter or chat file")
  }
}

const aiAdapter = items.get("fable-ai")
if (aiAdapter && !aiAdapter.registryDependencies?.includes("https://fable-ui.shobky.com/r/fable-renderer.json")) {
  errors.push("fable-ai: adapter must depend on the renderer registry item")
}

function itemFiles(item, seen = new Set()) {
  if (seen.has(item.name)) return []
  seen.add(item.name)
  const own = item.files.map((file) => normalize(file.path).replace(/\\/g, "/"))
  const inherited = (item.registryDependencies ?? [])
    .map(ownName)
    .filter((name) => name && items.has(name))
    .flatMap((name) => itemFiles(items.get(name), seen))
  return [...own, ...inherited]
}

function itemDeps(item, seen = new Set()) {
  if (seen.has(item.name)) return []
  seen.add(item.name)
  const own = (item.dependencies ?? []).map((dep) => dep.replace(/@[^@/]*$/, "").replace(/^(@[^/]+\/[^@]+).*$/, "$1"))
  const inherited = (item.registryDependencies ?? [])
    .map(ownName)
    .filter((name) => name && items.has(name))
    .flatMap((name) => itemDeps(items.get(name), seen))
  return [...own, ...inherited]
}

function uiDeps(item, seen = new Set()) {
  if (seen.has(item.name)) return []
  seen.add(item.name)
  const own = (item.registryDependencies ?? []).filter((dep) => !dep.includes("/"))
  const inherited = (item.registryDependencies ?? [])
    .map(ownName)
    .filter((name) => name && items.has(name))
    .flatMap((name) => uiDeps(items.get(name), seen))
  return [...own, ...inherited]
}

const resolveSource = (spec) => {
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
    if (existsSync(spec + ext)) return normalize(spec + ext).replace(/\\/g, "/")
  }
  return null
}

for (const item of registry.items) {
  const files = new Set(itemFiles(item))
  const deps = new Set(itemDeps(item))
  const ui = new Set(uiDeps(item))

  for (const file of item.files) {
    if (!existsSync(file.path)) {
      errors.push(`${item.name}: missing file ${file.path}`)
      continue
    }
    if (!/\.(tsx?|mjs)$/.test(file.path)) continue
    const source = readFileSync(file.path, "utf8")
    const imports = /^(?:import|export)\b[^;'"]*?from\s+["']([^"']+)["']|^import\s+["']([^"']+)["']/gm
    for (const match of source.matchAll(imports)) {
      const spec = match[1] ?? match[2]
      if (spec.startsWith(".")) {
        const target = resolveSource(join(dirname(file.path), spec))
        if (!target || !files.has(target)) errors.push(`${item.name}: ${file.path} imports ${spec}, which is not in the item`)
      } else if (spec === "@/lib/utils") {
        continue
      } else if (spec.startsWith("@/components/ui/")) {
        const name = spec.split("/").pop()
        if (!ui.has(name)) errors.push(`${item.name}: ${file.path} uses ui/${name} without registryDependencies "${name}"`)
      } else if (spec.startsWith("@/")) {
        const target = resolveSource(spec.replace(/^@\//, ""))
        if (!target || !files.has(target)) errors.push(`${item.name}: ${file.path} imports ${spec}, which is not in the item`)
      } else {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
        if (!builtIn.has(pkg) && !deps.has(pkg)) errors.push(`${item.name}: ${file.path} imports ${pkg}, missing from dependencies`)
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
console.log(`registry.json OK — ${registry.items.length} items, ${registry.items.reduce((n, item) => n + item.files.length, 0)} files.`)
