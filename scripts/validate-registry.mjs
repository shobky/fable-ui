import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const fableRegistryBaseUrl = "https://fable-ui.shobky.com/r/"
const sameRepoItems = new Set()
const registries = []
const errors = []
const registryFileOwners = new Map()
const importedRegistryFiles = new Set()
const manifestNames = new Set()

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function resolveRegistry(filePath) {
  const registry = readJson(filePath)
  registries.push({ filePath, registry })

  for (const item of registry.items ?? []) {
    sameRepoItems.add(item.name)

    for (const file of item.files ?? []) {
      registryFileOwners.set(normalizePath(file.path), item.name)

      if (
        normalizePath(file.path).includes("/manifests/") &&
        file.path.endsWith(".md")
      ) {
        manifestNames.add(path.basename(file.path, ".md"))
      }
    }
  }

  for (const includePath of registry.include ?? []) {
    if (path.isAbsolute(includePath) || includePath.includes("..")) {
      errors.push(`${filePath}: invalid include path ${includePath}`)
      continue
    }

    resolveRegistry(path.resolve(path.dirname(filePath), includePath))
  }
}

function normalizePath(value) {
  return value.replaceAll(path.sep, "/")
}

function fableRegistryDependency(itemName) {
  return `${fableRegistryBaseUrl}${itemName}.json`
}

function sameRepoDependencyName(dependency) {
  if (
    !dependency.startsWith(fableRegistryBaseUrl) ||
    !dependency.endsWith(".json")
  ) {
    return null
  }

  const itemName = dependency.slice(
    fableRegistryBaseUrl.length,
    -".json".length
  )

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(itemName) ? itemName : null
}

function isNonRuntimeFile(file) {
  const normalized = normalizePath(file.path)

  return (
    normalized.endsWith(".md") ||
    normalized.includes("/manifests/") ||
    normalized.includes("/evals/") ||
    file.target?.startsWith("~/docs/")
  )
}

function sameRepoDependencyNames(item) {
  return new Set(
    (item.registryDependencies ?? [])
      .map(sameRepoDependencyName)
      .filter(Boolean)
  )
}

function assertHostAwareTarget(item, file) {
  if (!file.target) {
    return
  }

  const target = normalizePath(file.target)
  const source = normalizePath(file.path)

  if (source.includes("/evals/")) {
    errors.push(
      `${item.name}: eval files must not be installed by default: ${file.path}`
    )
  }

  if (target.startsWith("components/")) {
    errors.push(`${item.name}: use @components/... target for ${file.path}`)
  }

  if (target.startsWith("lib/")) {
    errors.push(`${item.name}: use @lib/... target for ${file.path}`)
  }

  if (target.startsWith("hooks/")) {
    errors.push(`${item.name}: use @hooks/... target for ${file.path}`)
  }

  const allowedPrefixes = [
    "@components/",
    "@lib/",
    "@hooks/",
    "app/",
    "~/docs/",
  ]
  const isShadcnPrimitive = file.type?.startsWith("registry:ui")

  if (
    !isShadcnPrimitive &&
    !allowedPrefixes.some((prefix) => target.startsWith(prefix))
  ) {
    errors.push(
      `${item.name}: target should use a host-aware alias or app/... path: ${file.target}`
    )
  }
}

function resolveInternalImport(sourcePath, specifier) {
  if (specifier.startsWith("@/components/fable-ui/")) {
    return resolveExistingSource(specifier.replace("@/", ""))
  }

  if (specifier.startsWith("@/lib/fable-ui/")) {
    return resolveExistingSource(specifier.replace("@/", ""))
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const basePath = path.join(path.dirname(sourcePath), specifier)
    const relativePath = normalizePath(path.relative(root, basePath))

    return resolveExistingSource(relativePath)
  }

  return undefined
}

function resolveExistingSource(relativePath) {
  const normalized = normalizePath(relativePath)
  const candidates = [
    normalized,
    `${normalized}.ts`,
    `${normalized}.tsx`,
    `${normalized}.md`,
    `${normalized}/index.ts`,
    `${normalized}/index.tsx`,
  ]

  return candidates.find((candidate) => registryFileOwners.has(candidate))
}

function validateInternalImports(registryPath, item, file, contents) {
  if (isNonRuntimeFile(file)) {
    return
  }

  const sourcePath = path.resolve(path.dirname(registryPath), file.path)
  const allowedItems = sameRepoDependencyNames(item)
  const importPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"'()]+?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g
  for (const match of contents.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2]
    const resolved = resolveInternalImport(sourcePath, specifier)

    if (!resolved) {
      continue
    }

    const owner = registryFileOwners.get(resolved)

    if (!owner) {
      continue
    }

    importedRegistryFiles.add(resolved)

    if (owner !== item.name && !allowedItems.has(owner)) {
      errors.push(
        `${item.name}: ${file.path} imports ${resolved} from ${owner} without registry dependency ${fableRegistryDependency(owner)}`
      )
    }
  }
}

function isRuntimeImplementationHelper(item, file) {
  const normalized = normalizePath(file.path)
  const extension = path.extname(normalized)
  const itemBase = `components/fable-ui/${item.name}/`

  if (![".ts", ".tsx"].includes(extension) || isNonRuntimeFile(file)) {
    return false
  }

  return (
    normalized.startsWith(`${itemBase}internal/`) ||
    normalized.startsWith(`${itemBase}hooks/`) ||
    normalized.startsWith(`${itemBase}lib/`)
  )
}

function assertFileExists(registryPath, item, file) {
  const sourcePath = path.resolve(path.dirname(registryPath), file.path)

  if (!fs.existsSync(sourcePath)) {
    errors.push(`${item.name}: missing file ${file.path}`)
    return
  }

  if (
    (file.type === "registry:file" || file.type === "registry:page") &&
    !file.target
  ) {
    errors.push(`${item.name}: ${file.path} requires files[].target`)
  }

  assertHostAwareTarget(item, file)

  const extension = path.extname(sourcePath)

  if (![".ts", ".tsx"].includes(extension)) {
    return
  }

  const contents = fs.readFileSync(sourcePath, "utf8")
  const forbidden = [
    { pattern: /IconPlaceHolder?/, reason: "raw shadcn icon placeholder" },
    { pattern: /@\/registry\//, reason: "registry-internal import/path" },
    { pattern: /@\/app\//, reason: "app route import/path" },
    { pattern: /from\s+["']@\/content\//, reason: "docs content import" },
    {
      pattern: /from\s+["']@\/components\/chat\//,
      reason: "playground chat import",
    },
    { pattern: /from\s+["']@\/lib\/ai\//, reason: "playground AI import" },
    { pattern: /from\s+["']@\/lib\/source/, reason: "docs source import" },
  ]

  for (const { pattern, reason } of forbidden) {
    if (pattern.test(contents)) {
      errors.push(`${item.name}: forbidden ${reason} in ${file.path}`)
    }
  }

  validateInternalImports(registryPath, item, file, contents)
}

function validateDependencies(item) {
  for (const dependency of item.registryDependencies ?? []) {
    if (sameRepoItems.has(dependency)) {
      errors.push(
        `${item.name}: same-repo dependency "${dependency}" must use ${fableRegistryDependency(dependency)}`
      )
    }

    if (dependency.startsWith("shobky/fable-ui/")) {
      errors.push(
        `${item.name}: same-repo dependency "${dependency}" must use a hosted fable-ui registry URL`
      )
    }

    if (dependency.startsWith(fableRegistryBaseUrl)) {
      const itemName = sameRepoDependencyName(dependency)

      if (!itemName || !sameRepoItems.has(itemName)) {
        errors.push(
          `${item.name}: invalid hosted fable-ui dependency "${dependency}"`
        )
      }
    }
  }

  if (item.name === "data-browser") {
    const registryDependencies = item.registryDependencies ?? []
    const dependencies = item.dependencies ?? []
    const files = (item.files ?? []).map((file) => file.path)

    for (const value of [...registryDependencies, ...dependencies, ...files]) {
      if (
        /firebase|rest-driver|firebase-driver|drivers\/rest|drivers\/firebase/i.test(
          value
        )
      ) {
        errors.push(
          `data-browser must not depend on or install driver code: ${value}`
        )
      }
    }
  }

  const hostResolvedPackages = new Set(["radix-ui", "vaul", "@shadcn/react"])

  for (const dependency of item.dependencies ?? []) {
    if (
      hostResolvedPackages.has(dependency) ||
      dependency.startsWith("@radix-ui/")
    ) {
      errors.push(
        `${item.name}: do not declare host-resolved shadcn primitive package "${dependency}"`
      )
    }
  }

  if (item.name !== "firebase-driver") {
    for (const dependency of item.dependencies ?? []) {
      if (dependency === "firebase") {
        errors.push(
          `${item.name}: only firebase-driver may declare the firebase npm dependency`
        )
      }
    }
  }
}

const rootRegistryPath = path.resolve(root, "registry.json")

if (!fs.existsSync(rootRegistryPath)) {
  errors.push("Missing root registry.json")
} else {
  resolveRegistry(rootRegistryPath)
}

for (const { filePath, registry } of registries) {
  for (const item of registry.items ?? []) {
    if (!item.name || !item.type) {
      errors.push(`${filePath}: item is missing name or type`)
      continue
    }

    validateDependencies(item)

    for (const file of item.files ?? []) {
      assertFileExists(filePath, item, file)
    }
  }
}

for (const { registry } of registries) {
  for (const item of registry.items ?? []) {
    for (const file of item.files ?? []) {
      const normalized = normalizePath(file.path)

      if (
        isRuntimeImplementationHelper(item, file) &&
        !importedRegistryFiles.has(normalized)
      ) {
        errors.push(
          `${item.name}: listed implementation helper is not imported by runtime files: ${file.path}`
        )
      }
    }
  }
}

function assertDocumentedCatalog() {
  const catalogFiles = ["README.md", "content/docs/installation.mdx"]

  for (const relativePath of catalogFiles) {
    const contents = fs.readFileSync(path.resolve(root, relativePath), "utf8")

    for (const itemName of sameRepoItems) {
      if (!contents.includes(itemName)) {
        errors.push(
          `${relativePath}: missing registry catalog item ${itemName}`
        )
      }
    }
  }

  const manifestDocsPath = path.resolve(root, "content/docs/manifests.mdx")
  const manifestDocs = fs.readFileSync(manifestDocsPath, "utf8")

  for (const manifestName of manifestNames) {
    if (!manifestDocs.includes(manifestName)) {
      errors.push(
        `content/docs/manifests.mdx: missing manifest ${manifestName}`
      )
    }
  }
}

assertDocumentedCatalog()

if (errors.length > 0) {
  console.error(errors.join("\n"))
  process.exit(1)
}

console.log(`Validated ${sameRepoItems.size} registry items.`)
