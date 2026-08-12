import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const outputDir = path.join(root, ".next", "registry-smoke")
const committedOutputDir = path.join(root, "public", "r")
const shadcnCli = path.join(root, "node_modules", "shadcn", "dist", "index.js")
const items = ["quickstart", "data-browser"]
const forbiddenOutput = [
  { pattern: /IconPlaceHolder?/i, reason: "raw shadcn icon placeholder" },
  { pattern: /@\/app\/\(create\)/, reason: "raw shadcn create-app import" },
  { pattern: /@\/app\//, reason: "app route import" },
  { pattern: /@\/registry\//, reason: "registry-internal import/path" },
  { pattern: /registry[\\/][^"'`\s]+/, reason: "registry source path" },
  { pattern: /examples[\\/]quickstart[\\/]/, reason: "quickstart source path" },
]

function runShadcn(args, { capture = false } = {}) {
  try {
    return execFileSync(process.execPath, [shadcnCli, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    })
  } catch (error) {
    const stdout = error.stdout ? `\n${error.stdout}` : ""
    const stderr = error.stderr ? `\n${error.stderr}` : ""

    throw new Error(`shadcn ${args.join(" ")} failed.${stdout}${stderr}`)
  }
}

function getJsonArtifacts(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Missing registry artifact directory: ${directory}`)
  }

  const artifacts = new Map()
  const pendingDirectories = [directory]

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop()

    for (const entry of fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    })) {
      const entryPath = path.join(currentDirectory, entry.name)

      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        artifacts.set(
          path.relative(directory, entryPath).replaceAll(path.sep, "/"),
          entryPath,
        )
      }
    }
  }

  return artifacts
}

function normalizeArtifactContent(content) {
  return JSON.stringify(
    JSON.parse(content),
    (_key, value) =>
      typeof value === "string" ? value.replaceAll("\r\n", "\n") : value,
  )
}

function assertCommittedArtifactsAreFresh() {
  const freshlyBuiltArtifacts = getJsonArtifacts(outputDir)
  const committedArtifacts = getJsonArtifacts(committedOutputDir)
  const missing = [...freshlyBuiltArtifacts.keys()]
    .filter((artifact) => !committedArtifacts.has(artifact))
    .sort()
  const extra = [...committedArtifacts.keys()]
    .filter((artifact) => !freshlyBuiltArtifacts.has(artifact))
    .sort()
  const stale = [...freshlyBuiltArtifacts.keys()]
    .filter((artifact) => {
      const committedArtifact = committedArtifacts.get(artifact)

      if (!committedArtifact) return false

      return (
        normalizeArtifactContent(fs.readFileSync(freshlyBuiltArtifacts.get(artifact), "utf8")) !==
        normalizeArtifactContent(fs.readFileSync(committedArtifact, "utf8"))
      )
    })
    .sort()

  if (missing.length === 0 && extra.length === 0 && stale.length === 0) {
    return
  }

  const details = [
    missing.length > 0 && `Missing from public/r: ${missing.join(", ")}`,
    extra.length > 0 && `Extra in public/r: ${extra.join(", ")}`,
    stale.length > 0 && `Stale content in public/r: ${stale.join(", ")}`,
  ].filter(Boolean)

  throw new Error(
    [
      "Committed registry artifacts are stale.",
      ...details,
      "Run pnpm registry:build and commit the resulting public/r JSON before smoke installs.",
    ].join("\n"),
  )
}

if (!fs.existsSync(shadcnCli)) {
  throw new Error(`Missing local shadcn CLI at ${shadcnCli}`)
}

fs.rmSync(outputDir, { recursive: true, force: true })
runShadcn(["build", "registry.json", "--output", outputDir])
assertCommittedArtifactsAreFresh()

for (const item of items) {
  const itemPath = path.join(outputDir, `${item}.json`)
  const itemAddress = `./${path.relative(root, itemPath).replaceAll(path.sep, "/")}`

  if (!fs.existsSync(itemPath)) {
    throw new Error(`Missing built registry item for ${item}: ${itemPath}`)
  }

  const output = runShadcn(["add", itemAddress, "--dry-run", "--view"], {
    capture: true,
  })
  const violations = forbiddenOutput
    .filter(({ pattern }) => pattern.test(output))
    .map(({ reason }) => reason)

  if (violations.length > 0) {
    throw new Error(
      `${item}: shadcn dry-run output contains ${violations.join(", ")}.`,
    )
  }

  console.log(`Smoke checked ${item}.`)
}
