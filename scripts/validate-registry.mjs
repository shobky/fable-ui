import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sameRepoItems = new Set()
const registries = []
const errors = []

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function resolveRegistry(filePath) {
  const registry = readJson(filePath)
  registries.push({ filePath, registry })

  for (const item of registry.items ?? []) {
    sameRepoItems.add(item.name)
  }

  for (const includePath of registry.include ?? []) {
    if (path.isAbsolute(includePath) || includePath.includes("..")) {
      errors.push(`${filePath}: invalid include path ${includePath}`)
      continue
    }

    resolveRegistry(path.resolve(path.dirname(filePath), includePath))
  }
}

function assertFileExists(registryPath, item, file) {
  const sourcePath = path.resolve(path.dirname(registryPath), file.path)

  if (!fs.existsSync(sourcePath)) {
    errors.push(`${item.name}: missing file ${file.path}`)
    return
  }

  if ((file.type === "registry:file" || file.type === "registry:page") && !file.target) {
    errors.push(`${item.name}: ${file.path} requires files[].target`)
  }

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
    { pattern: /from\s+["']@\/components\/chat\//, reason: "playground chat import" },
    { pattern: /from\s+["']@\/lib\/ai\//, reason: "playground AI import" },
    { pattern: /from\s+["']@\/lib\/source/, reason: "docs source import" },
  ]

  for (const { pattern, reason } of forbidden) {
    if (pattern.test(contents)) {
      errors.push(`${item.name}: forbidden ${reason} in ${file.path}`)
    }
  }
}

function validateDependencies(item) {
  for (const dependency of item.registryDependencies ?? []) {
    if (sameRepoItems.has(dependency)) {
      errors.push(
        `${item.name}: same-repo dependency "${dependency}" must use shobky/fable-ui/${dependency}`,
      )
    }
  }

  if (item.name === "data-browser") {
    const registryDependencies = item.registryDependencies ?? []
    const dependencies = item.dependencies ?? []
    const files = (item.files ?? []).map((file) => file.path)

    for (const value of [...registryDependencies, ...dependencies, ...files]) {
      if (/firebase|rest-driver|firebase-driver|drivers\/rest|drivers\/firebase/i.test(value)) {
        errors.push(`data-browser must not depend on or install driver code: ${value}`)
      }
    }
  }

  const hostResolvedPackages = new Set(["radix-ui", "vaul", "@shadcn/react"])

  for (const dependency of item.dependencies ?? []) {
    if (hostResolvedPackages.has(dependency) || dependency.startsWith("@radix-ui/")) {
      errors.push(
        `${item.name}: do not declare host-resolved shadcn primitive package "${dependency}"`,
      )
    }
  }

  if (item.name !== "firebase-driver") {
    for (const dependency of item.dependencies ?? []) {
      if (dependency === "firebase") {
        errors.push(`${item.name}: only firebase-driver may declare the firebase npm dependency`)
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

if (errors.length > 0) {
  console.error(errors.join("\n"))
  process.exit(1)
}

console.log(`Validated ${sameRepoItems.size} registry items.`)
