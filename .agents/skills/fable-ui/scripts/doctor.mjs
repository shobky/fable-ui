import childProcess from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { inspectProject } from "./preflight.mjs"

const EXPECTED = {
  core: ["lib/fable-ui/core"],
  "metric-card": [
    "components/fable-ui/metric-card",
    "lib/fable-ui/tools/show-metric-tool.ts",
  ],
  "suggested-actions": [
    "components/fable-ui/suggested-actions",
    "lib/fable-ui/tools/show-next-actions-tool.ts",
  ],
  "confirmation-card": [
    "components/fable-ui/confirmation-card",
    "lib/fable-ui/tools/request-confirmation-tool.ts",
  ],
  "form-card": [
    "components/fable-ui/form-card",
    "lib/fable-ui/tools/collect-input-tool.ts",
  ],
  charts: [
    "components/fable-ui/charts",
    "lib/fable-ui/tools/show-chart-tool.ts",
  ],
  "text-editor-card": [
    "components/fable-ui/text-editor-card",
    "lib/fable-ui/tools/show-text-editor-tool.ts",
  ],
  "email-composer-card": [
    "components/fable-ui/email-composer-card",
    "lib/fable-ui/tools/show-email-composer-tool.ts",
  ],
  "code-block-card": [
    "components/fable-ui/code-block-card",
    "lib/fable-ui/tools/show-code-block-tool.ts",
  ],
  "data-browser": [
    "components/fable-ui/data-browser",
    "lib/fable-ui/tools/show-data-browser-tool.ts",
    "lib/fable-ui/tools/get-rendered-data-tool.ts",
  ],
  "rest-driver": ["lib/fable-ui/drivers/rest"],
  "firebase-driver": ["lib/fable-ui/drivers/firebase"],
  quickstart: ["app/fable-chat/page.tsx", "app/api/fable-chat/route.ts"],
}
const CHAT_TOOLS = {
  "metric-card": ["show_metric"],
  "suggested-actions": ["show_next_actions"],
  "confirmation-card": ["request_confirmation"],
  "form-card": ["collect_input"],
  "data-browser": ["show_data_browser", "show_table", "get_rendered_data"],
  charts: ["show_chart"],
  "text-editor-card": ["show_text_editor"],
  "email-composer-card": ["show_email_composer"],
  "code-block-card": ["show_code_block"],
}

function parseArgs(argv) {
  const result = { root: null, items: [], run: false }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--items")
      result.items = (argv[++index] ?? "").split(",").filter(Boolean)
    else if (value === "--run") result.run = true
    else if (!value.startsWith("--") && !result.root) result.root = value
    else throw new Error(`Unknown or misplaced argument: ${value}`)
  }
  if (!result.root)
    throw new Error(
      "Usage: node scripts/doctor.mjs <project-root> --items item,item [--run]"
    )
  if (result.items.includes("all")) result.items = Object.keys(EXPECTED)
  const invalidItems = result.items.filter((item) => !(item in EXPECTED))
  if (invalidItems.length)
    throw new Error(`Unknown Fable UI item(s): ${invalidItems.join(", ")}`)
  return result
}

function walk(root) {
  const files = []
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(file)
      else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) files.push(file)
    }
  }
  visit(root)
  return files
}

function contains(files, pattern) {
  return files.some((file) => pattern.test(fs.readFileSync(file, "utf8")))
}

function existingFiles(root, relativePaths) {
  return relativePaths
    .map((relativePath) => path.join(root, relativePath))
    .filter((filePath) => fs.existsSync(filePath))
}

function commandFor(manager, script) {
  if (manager === "pnpm")
    return [process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["run", script]]
  if (manager === "yarn") return ["yarn", [script]]
  if (manager === "npm")
    return [process.platform === "win32" ? "npm.cmd" : "npm", ["run", script]]
  if (manager === "bun") return ["bun", ["run", script]]
  return null
}

function runChecks(root, manager, packageJson) {
  const checks = []
  for (const script of ["typecheck", "lint", "build"]) {
    if (!packageJson.scripts?.[script]) {
      checks.push({ script, status: "skipped", reason: "script missing" })
      continue
    }
    const command = commandFor(manager, script)
    if (!command) {
      checks.push({
        script,
        status: "skipped",
        reason: "package manager unknown",
      })
      continue
    }
    const result = childProcess.spawnSync(command[0], command[1], {
      cwd: root,
      encoding: "utf8",
      shell: false,
    })
    checks.push({
      script,
      status: result.status === 0 ? "passed" : "failed",
      exitCode: result.status,
    })
  }
  return checks
}

try {
  const { root: givenRoot, items, run } = parseArgs(process.argv.slice(2))
  const preflight = inspectProject(givenRoot, items)
  const root = preflight.root
  const errors = [...preflight.errors]
  const warnings = [...preflight.warnings]
  const files = fs.existsSync(root) ? walk(root) : []
  const hostFiles = [
    ...files.filter((file) => {
      const relative = path.relative(root, file).replaceAll(path.sep, "/")
      return (
        !relative.startsWith("components/fable-ui/") &&
        !relative.startsWith("lib/fable-ui/")
      )
    }),
    ...existingFiles(root, [
      "components/fable-ui/chat/fable-chat.tsx",
      "components/fable-ui/chat/fable-message.tsx",
      "components/fable-ui/chat/fable-tool-part.tsx",
    ]),
  ]
  for (const item of items)
    for (const expected of EXPECTED[item] ?? [])
      if (!fs.existsSync(path.join(root, expected)))
        errors.push(`${item}: missing ${expected}`)
  if (
    items.some(
      (item) =>
        item !== "quickstart" &&
        item !== "core" &&
        !fs.existsSync(path.join(root, "lib/fable-ui/core"))
    )
  )
    errors.push("selected surface: missing lib/fable-ui/core")
  if (
    items.includes("suggested-actions") &&
    !contains(hostFiles, /onSuggestedAction/)
  )
    warnings.push("suggested-actions: no host onSuggestedAction callback found")
  if (items.includes("confirmation-card") && !contains(hostFiles, /onConfirm/))
    warnings.push("confirmation-card: no host onConfirm callback found")
  if (items.includes("form-card") && !contains(hostFiles, /onSubmit/))
    warnings.push("form-card: no host onSubmit callback found")
  if (items.includes("quickstart")) {
    const serverFiles = existingFiles(root, [
      "app/api/fable-chat/route.ts",
      "lib/fable-ui/quickstart/tools.ts",
    ])
    const clientFiles = existingFiles(root, [
      "components/fable-ui/chat/fable-chat.tsx",
      "components/fable-ui/chat/fable-message.tsx",
      "components/fable-ui/chat/fable-tool-part.tsx",
      "lib/fable-ui/quickstart/tools.ts",
    ])

    for (const item of items) {
      for (const toolName of CHAT_TOOLS[item] ?? []) {
        const pattern = new RegExp(`\\b${toolName}\\b`)
        if (!contains(serverFiles, pattern))
          errors.push(
            `${item}: ${toolName} is not registered in the quickstart server tool set`
          )
        if (!contains(clientFiles, pattern))
          errors.push(
            `${item}: ${toolName} is not registered in the quickstart client renderer set`
          )
      }
    }
  }
  if (items.includes("data-browser")) {
    if (!contains(hostFiles, /FableDataProvider/))
      errors.push("data-browser: missing FableDataProvider")
    if (!contains(hostFiles, /getRenderedData\s*\(/))
      errors.push(
        "data-browser: missing provider-cache getRenderedData handler"
      )
    if (contains(hostFiles, /getRenderedData[\s\S]{0,300}\bfetch\s*\(/))
      errors.push("data-browser: rendered-data handler appears to fetch")
  }
  if (contains(files, /(?:D:\\fable-ui|file:\/{2,}[^\s"']*fable-ui)/i))
    errors.push("source-checkout path leaked into consumer source")
  const packageJson = fs.existsSync(path.join(root, "package.json"))
    ? JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
    : {}
  const commandChecks = run
    ? runChecks(root, preflight.packageManager, packageJson)
    : []
  for (const check of commandChecks)
    if (check.status === "failed") errors.push(`${check.script} failed`)
  const report = {
    root,
    selectedItems: items,
    static: { errors, warnings },
    commands: commandChecks,
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  process.exitCode = errors.length ? 2 : 0
} catch (error) {
  process.stderr.write(`doctor: ${error.message}\n`)
  process.exitCode = 2
}
