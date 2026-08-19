import fs from "node:fs"
import path from "node:path"

import { ESLint } from "eslint"

const root = path.resolve(process.cwd())
const lintableExtensions = new Set([
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function resolveRegistryItems(filePath, visited = new Set()) {
  const resolvedPath = path.resolve(filePath)

  if (visited.has(resolvedPath)) {
    throw new Error(`Registry include cycle: ${resolvedPath}`)
  }

  visited.add(resolvedPath)
  const registry = readJson(resolvedPath)
  const items = (registry.items ?? []).map((item) => ({
    item,
    registryPath: resolvedPath,
  }))

  for (const includePath of registry.include ?? []) {
    items.push(
      ...resolveRegistryItems(
        path.resolve(path.dirname(resolvedPath), includePath),
        visited
      )
    )
  }

  return items
}

const items = resolveRegistryItems(path.join(root, "registry.json"))
const quickstart = items.find(({ item }) => item.name === "quickstart")

if (!quickstart) {
  throw new Error("Published registry is missing the quickstart item.")
}

function sourceFilesFor({ item, registryPath }) {
  return (item.files ?? [])
    .map((file) => path.resolve(path.dirname(registryPath), file.path))
    .filter((filePath) => lintableExtensions.has(path.extname(filePath)))
}

const lintFiles = [...new Set(items.flatMap(sourceFilesFor))]
const quickstartFiles = sourceFilesFor(quickstart)

if (lintFiles.length === 0) {
  throw new Error(
    "Published registry does not declare any lintable source files."
  )
}

if (quickstartFiles.length === 0) {
  throw new Error("Quickstart does not declare any lintable source files.")
}

const eslint = new ESLint({ cwd: root, errorOnUnmatchedPattern: true })
const results = await eslint.lintFiles(lintFiles)
const formatter = await eslint.loadFormatter()
const output = formatter.format(results)

if (output) {
  console.log(output)
}

const errorCount = results.reduce(
  (count, result) => count + result.errorCount,
  0
)
const warningCount = results.reduce(
  (count, result) => count + result.warningCount,
  0
)

console.log(
  `Linted ${lintFiles.length} published registry source files, including ${quickstartFiles.length} quickstart files.`
)

if (errorCount > 0 || warningCount > 0) {
  process.exitCode = 1
}
