import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const outputDir = path.join(root, ".next", "registry-smoke")
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

if (!fs.existsSync(shadcnCli)) {
  throw new Error(`Missing local shadcn CLI at ${shadcnCli}`)
}

fs.rmSync(outputDir, { recursive: true, force: true })
runShadcn(["build", "registry.json", "--output", outputDir])

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
