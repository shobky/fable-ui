import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ITEMS = new Set([
  "core",
  "metric-card",
  "suggested-actions",
  "confirmation-card",
  "form-card",
  "charts",
  "text-editor-card",
  "email-composer-card",
  "code-block-card",
  "data-browser",
  "rest-driver",
  "firebase-driver",
  "quickstart",
])
const ITEM_TARGETS = {
  core: ["@lib/fable-ui/core"],
  "metric-card": [
    "@components/fable-ui/metric-card",
    "@lib/fable-ui/tools/show-metric-tool.ts",
    "@lib/fable-ui/manifests/show-metric.md",
  ],
  "suggested-actions": [
    "@components/fable-ui/suggested-actions",
    "@lib/fable-ui/tools/show-next-actions-tool.ts",
    "@lib/fable-ui/manifests/show-next-actions.md",
  ],
  "confirmation-card": [
    "@components/fable-ui/confirmation-card",
    "@lib/fable-ui/tools/request-confirmation-tool.ts",
    "@lib/fable-ui/manifests/request-confirmation.md",
  ],
  "form-card": [
    "@components/fable-ui/form-card",
    "@lib/fable-ui/tools/collect-input-tool.ts",
    "@lib/fable-ui/manifests/collect-input.md",
  ],
  charts: [
    "@components/fable-ui/charts",
    "@lib/fable-ui/tools/show-chart-tool.ts",
    "@lib/fable-ui/manifests/show-chart.md",
  ],
  "text-editor-card": [
    "@components/fable-ui/text-editor-card",
    "@hooks/use-copy-to-clipboard.ts",
    "@lib/fable-ui/tools/show-text-editor-tool.ts",
    "@lib/fable-ui/manifests/show-text-editor.md",
  ],
  "email-composer-card": [
    "@components/fable-ui/email-composer-card",
    "@hooks/use-copy-to-clipboard.ts",
    "@lib/fable-ui/tools/show-email-composer-tool.ts",
    "@lib/fable-ui/manifests/show-email-composer.md",
  ],
  "code-block-card": [
    "@components/fable-ui/code-block-card",
    "@hooks/use-copy-to-clipboard.ts",
    "@lib/fable-ui/tools/show-code-block-tool.ts",
    "@lib/fable-ui/manifests/show-code-block.md",
  ],
  "data-browser": [
    "@components/fable-ui/data-browser",
    "@lib/fable-ui/tools/show-data-browser-tool.ts",
    "@lib/fable-ui/tools/get-rendered-data-tool.ts",
    "@lib/fable-ui/tools/show-table-tool.ts",
    "@lib/fable-ui/manifests/show-data-browser.md",
    "@lib/fable-ui/manifests/get-rendered-data.md",
    "@lib/fable-ui/manifests/show-table.md",
  ],
  "rest-driver": ["@lib/fable-ui/drivers/rest"],
  "firebase-driver": ["@lib/fable-ui/drivers/firebase"],
  quickstart: [
    "app/fable-chat",
    "app/api/fable-chat",
    "@components/fable-ui/chat",
    "@lib/fable-ui/quickstart",
    "~/docs/fable-ui/quickstart.md",
  ],
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function exists(root, relative) {
  return fs.existsSync(path.join(root, relative))
}

function resolveAliasRoot(root, value) {
  if (typeof value !== "string") return null
  if (value.startsWith("@/") || value.startsWith("~/"))
    return path.resolve(root, value.slice(2))
  return path.resolve(root, value)
}

function resolveTarget(root, aliases, target) {
  const aliasPrefixes = [
    ["@components/", "components"],
    ["@lib/", "lib"],
    ["@hooks/", "hooks"],
  ]
  for (const [prefix, aliasName] of aliasPrefixes) {
    if (!target.startsWith(prefix)) continue
    const aliasRoot = resolveAliasRoot(root, aliases[aliasName])
    return aliasRoot ? path.join(aliasRoot, target.slice(prefix.length)) : null
  }
  if (target.startsWith("~/")) return path.resolve(root, target.slice(2))
  return path.resolve(root, target)
}

function packageManager(root) {
  const locks = [
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
    ["npm", "package-lock.json"],
    ["bun", "bun.lockb"],
  ]
  const matches = locks
    .filter(([, lock]) => exists(root, lock))
    .map(([name]) => name)
  return { detected: matches[0] ?? null, matches }
}

function findSourceCheckout(start) {
  let current = start

  while (true) {
    const candidatePackage = exists(current, "package.json")
      ? readJson(path.join(current, "package.json"))
      : null

    if (
      candidatePackage?.name === "fable-ui" &&
      exists(current, "registry.json")
    ) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function parseArgs(argv) {
  const values = { root: null, items: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--items")
      values.items = (argv[++index] ?? "").split(",").filter(Boolean)
    else if (!value.startsWith("--") && !values.root) values.root = value
    else throw new Error(`Unknown or misplaced argument: ${value}`)
  }
  if (!values.root)
    throw new Error(
      "Usage: node scripts/preflight.mjs <project-root> [--items item,item]"
    )
  const invalid = values.items.filter((item) => !ITEMS.has(item))
  if (invalid.length)
    throw new Error(`Unknown Fable UI item(s): ${invalid.join(", ")}`)
  return values
}

export function inspectProject(projectRoot, items = []) {
  const invalidItems = items.filter((item) => !ITEMS.has(item))
  if (invalidItems.length)
    throw new Error(`Unknown Fable UI item(s): ${invalidItems.join(", ")}`)
  const root = path.resolve(projectRoot)
  const errors = []
  const warnings = []
  const packageFile = path.join(root, "package.json")
  const packageJson = exists(root, "package.json")
    ? readJson(packageFile)
    : null
  if (!packageJson) errors.push("missing package.json")
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  }
  const componentsFile = path.join(root, "components.json")
  const componentsJson = exists(root, "components.json")
    ? readJson(componentsFile)
    : null
  if (!componentsJson)
    errors.push("missing components.json (initialize shadcn/ui first)")
  const nextInstalled = Boolean(dependencies.next)
  const nextLayout = exists(root, "app") || exists(root, "pages")
  if (!nextInstalled || !nextLayout)
    errors.push("Next.js dependency or app/pages directory missing")
  const aliases = componentsJson?.aliases ?? {}
  const missingAliases = ["components", "utils"].filter(
    (key) => typeof aliases[key] !== "string"
  )
  if (missingAliases.length)
    errors.push(`components.json aliases missing: ${missingAliases.join(", ")}`)
  const pm = packageManager(root)
  if (!pm.detected)
    warnings.push(
      "no recognized lockfile; choose the package manager explicitly"
    )
  if (pm.matches.length > 1)
    warnings.push(`multiple lockfiles: ${pm.matches.join(", ")}`)
  const sourceCheckoutRoot = findSourceCheckout(root)
  const sourceRepository = Boolean(sourceCheckoutRoot)
  if (sourceRepository)
    errors.push(
      "Fable UI source checkout detected; install into a separate consumer app"
    )
  const installed = [
    "lib/fable-ui",
    "components/fable-ui",
    "app/fable-chat",
    "app/api/fable-chat",
  ].filter((entry) => exists(root, entry))
  const collisions = items.flatMap((item) =>
    ITEM_TARGETS[item].flatMap((target) => {
      const resolved = resolveTarget(root, aliases, target)
      if (!resolved || !fs.existsSync(resolved)) return []
      const relative = path.relative(root, resolved).replaceAll(path.sep, "/")
      return [`${item}: ${relative}`]
    })
  )
  return {
    root,
    sourceRepository,
    sourceCheckoutRoot,
    packageManager: pm.detected,
    lockfiles: pm.matches,
    next: { dependency: nextInstalled, layout: nextLayout },
    shadcn: {
      present: Boolean(componentsJson),
      aliases: {
        components: aliases.components ?? null,
        utils: aliases.utils ?? null,
      },
    },
    selectedItems: items,
    installedTargets: installed,
    collisions,
    errors,
    warnings,
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  try {
    const { root, items } = parseArgs(process.argv.slice(2))
    const result = inspectProject(root, items)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exitCode = result.errors.length ? 2 : 0
  } catch (error) {
    process.stderr.write(`preflight: ${error.message}\n`)
    process.exitCode = 2
  }
}
