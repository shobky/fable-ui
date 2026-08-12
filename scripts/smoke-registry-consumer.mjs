import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const root = path.resolve(process.cwd())
const systemTempRoot = fs.realpathSync(os.tmpdir())
const tempRoot = fs.mkdtempSync(
  path.join(systemTempRoot, "fable-ui-registry-consumer-")
)
const consumerDir = path.join(tempRoot, "consumer")
const builtRegistryDir = path.join(tempRoot, "built-registry")
const installItemsDir = path.join(tempRoot, "install-items")
const registryPath = path.join(root, "registry.json")
const rootPackagePath = path.join(root, "package.json")
const rootLockfilePath = path.join(root, "pnpm-lock.yaml")
const rootComponentsPath = path.join(root, "components.json")
const shadcnCli = path.join(root, "node_modules", "shadcn", "dist", "index.js")

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, contents)
}

function relativePath(from, to) {
  const value = path.relative(from, to).replaceAll(path.sep, "/")

  return value.startsWith(".") ? value : `./${value}`
}

function run(label, executable, args, cwd) {
  try {
    return execFileSync(executable, args, {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    })
  } catch (error) {
    const stdout = error.stdout ? `\nstdout:\n${error.stdout}` : ""
    const stderr = error.stderr ? `\nstderr:\n${error.stderr}` : ""
    const status = error.status ?? error.code ?? "unknown"

    throw new Error(
      [
        `${label} failed (exit ${status}).`,
        `cwd: ${cwd}`,
        `command: ${[executable, ...args].join(" ")}`,
        stdout,
        stderr,
      ]
        .filter(Boolean)
        .join("\n")
    )
  }
}

function snapshotWorkspaceFiles() {
  return new Map(
    [rootPackagePath, rootLockfilePath].map((filePath) => [
      filePath,
      fs.readFileSync(filePath),
    ])
  )
}

function assertWorkspaceFilesUnchanged(snapshot) {
  const changed = []

  for (const [filePath, contents] of snapshot) {
    if (!fs.readFileSync(filePath).equals(contents)) {
      changed.push(path.relative(root, filePath))
    }
  }

  if (changed.length > 0) {
    throw new Error(
      `Consumer smoke mutated workspace files: ${changed.join(", ")}.`
    )
  }
}

function runIsolated(label, executable, args, cwd, workspaceSnapshot) {
  try {
    return run(label, executable, args, cwd)
  } finally {
    assertWorkspaceFilesUnchanged(workspaceSnapshot)
  }
}

function cleanupTempRoot() {
  const physicalTempRoot = fs.realpathSync(tempRoot)

  if (
    path.dirname(physicalTempRoot) !== systemTempRoot ||
    !path
      .basename(physicalTempRoot)
      .startsWith("fable-ui-registry-consumer-") ||
    fs.lstatSync(tempRoot).isSymbolicLink()
  ) {
    throw new Error(`Refusing to remove unexpected temporary path: ${tempRoot}`)
  }

  fs.rmSync(tempRoot, { recursive: true, force: true })
}

function sameRepoDependencies(item) {
  return (item.registryDependencies ?? []).filter((dependency) =>
    dependency.startsWith("shobky/fable-ui/")
  )
}

function sameRepoDependencyName(dependency) {
  return dependency.slice("shobky/fable-ui/".length).split("#", 1)[0]
}

function itemInstallOrder(items) {
  const byName = new Map(items.map((item) => [item.name, item]))
  const unresolved = new Map(
    items.map((item) => [
      item.name,
      new Set(
        sameRepoDependencies(item).map((dependency) =>
          sameRepoDependencyName(dependency)
        )
      ),
    ])
  )
  const order = []

  for (const [itemName, dependencies] of unresolved) {
    for (const dependency of dependencies) {
      if (!byName.has(dependency)) {
        throw new Error(
          `${itemName} depends on unknown local registry item shobky/fable-ui/${dependency}.`
        )
      }
    }
  }

  while (unresolved.size > 0) {
    const next = items.find(
      (item) =>
        unresolved.has(item.name) && unresolved.get(item.name).size === 0
    )

    if (!next) {
      throw new Error(
        `Local registry dependencies are cyclic: ${[...unresolved.keys()].join(", ")}.`
      )
    }

    order.push(next)
    unresolved.delete(next.name)

    for (const dependencies of unresolved.values()) {
      dependencies.delete(next.name)
    }
  }

  return order
}

function assertSafeItemNames(items) {
  for (const item of items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name)) {
      throw new Error(`Unsafe registry item name: ${item.name}`)
    }
  }
}

function pickPackages(rootPackage, section, names) {
  const available = rootPackage[section] ?? {}
  const selected = {}

  for (const name of names) {
    if (!available[name]) {
      throw new Error(`Root package.json is missing ${section}.${name}.`)
    }

    selected[name] = available[name]
  }

  return selected
}

function createConsumerConfig(rootPackage, rootComponents) {
  const requiredAliases = ["components", "utils", "ui", "lib", "hooks"]

  for (const alias of requiredAliases) {
    if (!rootComponents.aliases?.[alias]) {
      throw new Error(`Root components.json is missing aliases.${alias}.`)
    }
  }

  if (rootComponents.rtl !== true) {
    throw new Error(
      "Root components.json must enable rtl for the consumer smoke app."
    )
  }

  writeJson(path.join(consumerDir, "package.json"), {
    name: "fable-ui-registry-consumer-smoke",
    version: "0.0.0",
    private: true,
    scripts: {
      build: "next build",
      typecheck: "tsc --noEmit",
    },
    dependencies: pickPackages(rootPackage, "dependencies", [
      "next",
      "radix-ui",
      "react",
      "react-dom",
      "clsx",
      "tailwind-merge",
      "tw-animate-css",
      "shadcn",
    ]),
    devDependencies: pickPackages(rootPackage, "devDependencies", [
      "@tailwindcss/postcss",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "tailwindcss",
      "typescript",
    ]),
  })
  writeFile(
    path.join(consumerDir, "pnpm-workspace.yaml"),
    `packages:\n  - "."\n`
  )

  writeJson(path.join(consumerDir, "components.json"), {
    $schema: rootComponents.$schema,
    style: rootComponents.style,
    rsc: rootComponents.rsc,
    tsx: rootComponents.tsx,
    tailwind: rootComponents.tailwind,
    iconLibrary: rootComponents.iconLibrary,
    rtl: rootComponents.rtl,
    aliases: rootComponents.aliases,
    menuColor: rootComponents.menuColor,
    menuAccent: rootComponents.menuAccent,
    registries: {},
  })

  writeJson(path.join(consumerDir, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"],
      },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  })

  writeFile(
    path.join(consumerDir, "next-env.d.ts"),
    `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// This file is generated for the temporary consumer smoke app.\n`
  )
  writeFile(
    path.join(consumerDir, "next.config.ts"),
    `import type { NextConfig } from "next"\n\nconst nextConfig: NextConfig = {}\n\nexport default nextConfig\n`
  )
  writeFile(
    path.join(consumerDir, "postcss.config.mjs"),
    `const config = {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n}\n\nexport default config\n`
  )
  writeFile(
    path.join(consumerDir, "app", "layout.tsx"),
    `import type { ReactNode } from "react"\n\nimport "./globals.css"\n\nexport default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {\n  return (\n    <html lang="ar" dir="rtl">\n      <body>{children}</body>\n    </html>\n  )\n}\n`
  )
  writeFile(
    path.join(consumerDir, "app", "page.tsx"),
    `import { RegistrySmoke } from "@/components/registry-smoke"\nimport * as chartTools from "@/lib/fable-ui/tools/show-chart-tool"\nimport * as codeBlockTools from "@/lib/fable-ui/tools/show-code-block-tool"\nimport * as confirmationTools from "@/lib/fable-ui/tools/request-confirmation-tool"\nimport * as dataBrowserTools from "@/lib/fable-ui/tools/show-data-browser-tool"\nimport * as emailComposerTools from "@/lib/fable-ui/tools/show-email-composer-tool"\nimport * as formTools from "@/lib/fable-ui/tools/collect-input-tool"\nimport * as metricTools from "@/lib/fable-ui/tools/show-metric-tool"\nimport * as renderedDataTools from "@/lib/fable-ui/tools/get-rendered-data-tool"\nimport * as suggestedActionTools from "@/lib/fable-ui/tools/show-next-actions-tool"\nimport * as tableTools from "@/lib/fable-ui/tools/show-table-tool"\nimport * as textEditorTools from "@/lib/fable-ui/tools/show-text-editor-tool"\n\nconst installedToolModules = [chartTools, codeBlockTools, confirmationTools, dataBrowserTools, emailComposerTools, formTools, metricTools, renderedDataTools, suggestedActionTools, tableTools, textEditorTools]\n\nexport default function Page() {\n  void installedToolModules\n  return <RegistrySmoke />\n}\n`
  )
  writeFile(
    path.join(consumerDir, "components", "registry-smoke.tsx"),
    `"use client"\n\nimport { Charts } from "@/components/fable-ui/charts"\nimport { CodeBlockCard } from "@/components/fable-ui/code-block-card"\nimport { ConfirmationCard } from "@/components/fable-ui/confirmation-card"\nimport { DataBrowser } from "@/components/fable-ui/data-browser"\nimport { EmailComposerCard } from "@/components/fable-ui/email-composer-card"\nimport { FormCard } from "@/components/fable-ui/form-card"\nimport { MetricCard } from "@/components/fable-ui/metric-card"\nimport { SuggestedActions } from "@/components/fable-ui/suggested-actions"\nimport { TextEditorCard } from "@/components/fable-ui/text-editor-card"\nimport { DataSourceRegistry } from "@/lib/fable-ui/core"\nimport { createFirebaseDriver } from "@/lib/fable-ui/drivers/firebase"\nimport { createRestDriver } from "@/lib/fable-ui/drivers/rest"\n\nconst registry = new DataSourceRegistry()\nconst restDriver = createRestDriver()\n\nexport function RegistrySmoke() {\n  void registry\n  void restDriver\n  void createFirebaseDriver\n\n  return (\n    <main>\n      <MetricCard label="Revenue" value="$1" />\n      <SuggestedActions title="Next" actions={[]} onAction={() => undefined} />\n      <ConfirmationCard id="confirm" title="Confirm" description="Smoke" />\n      <FormCard title="Input" fields={[]} onSubmit={() => undefined} />\n      <DataBrowser title="Rows" entityLabel="row" columns={[{ key: "name", label: "Name" }]} rows={[{ id: "1", name: "Smoke" }]} />\n      <Charts title="Chart" data={[{ label: "Smoke", value: 1 }]} categoryKey="label" valueKey="value" defaultChartType="bar" />\n      <TextEditorCard label="ملاحظة" content="Smoke" />\n      <EmailComposerCard subject="Smoke" body="Email smoke" to={["smoke@example.com"]} />\n      <CodeBlockCard language="ts" code="const smoke = true\\n" />\n    </main>\n  )\n}\n`
  )
  writeFile(
    path.join(consumerDir, "app", "globals.css"),
    `@import "tailwindcss";\n@import "tw-animate-css";\n@import "shadcn/tailwind.css";\n\n@custom-variant dark (&:is(.dark *));\n\n:root {\n  --radius: 0.625rem;\n  --background: oklch(1 0 0);\n  --foreground: oklch(0.145 0 0);\n  --card: oklch(1 0 0);\n  --card-foreground: oklch(0.145 0 0);\n  --popover: oklch(1 0 0);\n  --popover-foreground: oklch(0.145 0 0);\n  --primary: oklch(0.205 0 0);\n  --primary-foreground: oklch(0.985 0 0);\n  --secondary: oklch(0.97 0 0);\n  --secondary-foreground: oklch(0.205 0 0);\n  --muted: oklch(0.97 0 0);\n  --muted-foreground: oklch(0.556 0 0);\n  --accent: oklch(0.97 0 0);\n  --accent-foreground: oklch(0.205 0 0);\n  --destructive: oklch(0.577 0.245 27.325);\n  --border: oklch(0.922 0 0);\n  --input: oklch(0.922 0 0);\n  --ring: oklch(0.708 0 0);\n  --chart-1: oklch(0.646 0.222 41.116);\n  --chart-2: oklch(0.6 0.118 184.704);\n  --chart-3: oklch(0.398 0.07 227.392);\n  --chart-4: oklch(0.828 0.189 84.429);\n  --chart-5: oklch(0.769 0.188 70.08);\n  --sidebar: oklch(0.985 0 0);\n  --sidebar-foreground: oklch(0.145 0 0);\n  --sidebar-primary: oklch(0.205 0 0);\n  --sidebar-primary-foreground: oklch(0.985 0 0);\n  --sidebar-accent: oklch(0.97 0 0);\n  --sidebar-accent-foreground: oklch(0.205 0 0);\n  --sidebar-border: oklch(0.922 0 0);\n  --sidebar-ring: oklch(0.708 0 0);\n}\n\n.dark {\n  --background: oklch(0.145 0 0);\n  --foreground: oklch(0.985 0 0);\n  --card: oklch(0.205 0 0);\n  --card-foreground: oklch(0.985 0 0);\n  --popover: oklch(0.205 0 0);\n  --popover-foreground: oklch(0.985 0 0);\n  --primary: oklch(0.922 0 0);\n  --primary-foreground: oklch(0.205 0 0);\n  --secondary: oklch(0.269 0 0);\n  --secondary-foreground: oklch(0.985 0 0);\n  --muted: oklch(0.269 0 0);\n  --muted-foreground: oklch(0.708 0 0);\n  --accent: oklch(0.269 0 0);\n  --accent-foreground: oklch(0.985 0 0);\n  --destructive: oklch(0.704 0.191 22.216);\n  --border: oklch(1 0 0 / 10%);\n  --input: oklch(1 0 0 / 15%);\n  --ring: oklch(0.556 0 0);\n  --sidebar: oklch(0.205 0 0);\n  --sidebar-foreground: oklch(0.985 0 0);\n  --sidebar-primary: oklch(0.488 0.243 264.376);\n  --sidebar-primary-foreground: oklch(0.985 0 0);\n  --sidebar-accent: oklch(0.269 0 0);\n  --sidebar-accent-foreground: oklch(0.985 0 0);\n  --sidebar-border: oklch(1 0 0 / 10%);\n  --sidebar-ring: oklch(0.439 0 0);\n}\n\n@theme inline {\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n  --color-card: var(--card);\n  --color-card-foreground: var(--card-foreground);\n  --color-popover: var(--popover);\n  --color-popover-foreground: var(--popover-foreground);\n  --color-primary: var(--primary);\n  --color-primary-foreground: var(--primary-foreground);\n  --color-secondary: var(--secondary);\n  --color-secondary-foreground: var(--secondary-foreground);\n  --color-muted: var(--muted);\n  --color-muted-foreground: var(--muted-foreground);\n  --color-accent: var(--accent);\n  --color-accent-foreground: var(--accent-foreground);\n  --color-destructive: var(--destructive);\n  --color-border: var(--border);\n  --color-input: var(--input);\n  --color-ring: var(--ring);\n  --color-chart-1: var(--chart-1);\n  --color-chart-2: var(--chart-2);\n  --color-chart-3: var(--chart-3);\n  --color-chart-4: var(--chart-4);\n  --color-chart-5: var(--chart-5);\n  --color-sidebar: var(--sidebar);\n  --color-sidebar-foreground: var(--sidebar-foreground);\n  --color-sidebar-primary: var(--sidebar-primary);\n  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);\n  --color-sidebar-accent: var(--sidebar-accent);\n  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);\n  --color-sidebar-border: var(--sidebar-border);\n  --color-sidebar-ring: var(--sidebar-ring);\n  --radius-sm: calc(var(--radius) - 4px);\n  --radius-md: calc(var(--radius) - 2px);\n  --radius-lg: var(--radius);\n  --radius-xl: calc(var(--radius) + 4px);\n}\n\n@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n`
  )
  writeFile(
    path.join(consumerDir, "lib", "utils.ts"),
    `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`
  )
}

function makeInstallCopies(items) {
  for (const item of items) {
    const builtItemPath = path.join(builtRegistryDir, `${item.name}.json`)

    if (!fs.existsSync(builtItemPath)) {
      throw new Error(
        `Missing built registry artifact for ${item.name}: ${builtItemPath}`
      )
    }

    const builtItem = readJson(builtItemPath)

    if (builtItem.name !== item.name) {
      throw new Error(
        `Built registry artifact ${builtItemPath} is named ${builtItem.name}, expected ${item.name}.`
      )
    }

    const installItem = JSON.parse(JSON.stringify(builtItem))

    if (Array.isArray(installItem.registryDependencies)) {
      installItem.registryDependencies =
        installItem.registryDependencies.filter(
          (dependency) => !dependency.startsWith("shobky/fable-ui/")
        )
    }

    writeJson(path.join(installItemsDir, `${item.name}.json`), installItem)
  }
}

function targetPath(target, aliases) {
  const targetAliases = Object.entries(aliases).map(([name, alias]) => [
    `@${name}/`,
    alias,
  ])
  let destination

  for (const [prefix, alias] of targetAliases) {
    if (!target.startsWith(prefix)) {
      continue
    }

    if (!alias.startsWith("@/")) {
      throw new Error(`Cannot resolve target ${target} through alias ${alias}.`)
    }

    destination = path.resolve(
      consumerDir,
      alias.slice(2),
      target.slice(prefix.length)
    )
    break
  }

  if (!destination && target.startsWith("~/")) {
    destination = path.resolve(consumerDir, target.slice(2))
  }

  if (!destination && target.startsWith("app/")) {
    destination = path.resolve(consumerDir, target)
  }

  if (!destination) {
    throw new Error(`Unsupported registry file target: ${target}`)
  }

  const relative = path.relative(consumerDir, destination)

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Registry file target escapes the consumer: ${target}`)
  }

  return destination
}

function assertSafeBuiltTargets(items, aliases) {
  for (const item of items) {
    const builtItem = readJson(path.join(builtRegistryDir, `${item.name}.json`))

    for (const file of builtItem.files ?? []) {
      if (typeof file.target !== "string" || file.target.length === 0) {
        throw new Error(
          `${item.name} contains a registry file without a target.`
        )
      }

      targetPath(file.target, aliases)
    }
  }
}

function assertInstalledTargets(items, aliases) {
  const missing = []

  for (const item of items) {
    const builtItem = readJson(path.join(builtRegistryDir, `${item.name}.json`))

    for (const file of builtItem.files ?? []) {
      const destination = targetPath(file.target, aliases)

      if (!fs.existsSync(destination)) {
        missing.push(`${item.name}: ${file.target}`)
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `shadcn add did not create expected consumer files:\n${missing.join("\n")}`
    )
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function installedSourceFiles() {
  const roots = ["app", "components", "lib", "hooks", "docs"]
    .map((directory) => path.join(consumerDir, directory))
    .filter((directory) => fs.existsSync(directory))
  const files = []

  while (roots.length > 0) {
    const directory = roots.pop()

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        roots.push(entryPath)
      } else if (
        entry.isFile() &&
        /\.(?:ts|tsx|js|jsx|mdx?)$/.test(entry.name)
      ) {
        files.push(entryPath)
      }
    }
  }

  return files
}

function assertNoSourcePathLeakage() {
  const rootPathPatterns = [root, root.replaceAll(path.sep, "/")]
    .filter(Boolean)
    .map((value) => new RegExp(escapeRegExp(value), "i"))
  const forbidden = [
    { pattern: /@\/app\/\(create\)/, reason: "raw shadcn create-app import" },
    { pattern: /@\/app\//, reason: "app route import" },
    { pattern: /@\/registry\//, reason: "registry-internal import/path" },
    {
      pattern: /(?:^|["'`])(?:\.\/)?registry[\\/]/m,
      reason: "registry source path",
    },
    {
      pattern: /(?:^|["'`])(?:\.\.\/)?examples[\\/]quickstart[\\/]/m,
      reason: "quickstart source path",
    },
    ...rootPathPatterns.map((pattern) => ({
      pattern,
      reason: "workspace source path",
    })),
  ]
  const violations = []

  for (const filePath of installedSourceFiles()) {
    const contents = fs.readFileSync(filePath, "utf8")
    const reasons = forbidden
      .filter(({ pattern }) => pattern.test(contents))
      .map(({ reason }) => reason)

    if (reasons.length > 0) {
      violations.push(
        `${path.relative(consumerDir, filePath)}: ${reasons.join(", ")}`
      )
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Installed consumer files leak registry source paths:\n${violations.join("\n")}`
    )
  }
}

function main() {
  for (const filePath of [
    registryPath,
    rootPackagePath,
    rootLockfilePath,
    rootComponentsPath,
    shadcnCli,
  ]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required local file: ${filePath}`)
    }
  }

  const rootRegistry = readJson(registryPath)
  const items = rootRegistry.items ?? []

  if (items.length !== 13) {
    throw new Error(`Expected 13 registry items, found ${items.length}.`)
  }

  if (new Set(items.map((item) => item.name)).size !== items.length) {
    throw new Error(
      "Registry item names must be unique for consumer installation."
    )
  }
  assertSafeItemNames(items)

  const rootPackage = readJson(rootPackagePath)
  const rootComponents = readJson(rootComponentsPath)
  const installOrder = itemInstallOrder(items)
  const workspaceSnapshot = snapshotWorkspaceFiles()

  createConsumerConfig(rootPackage, rootComponents)
  runIsolated(
    "Build current registry into consumer smoke artifacts",
    process.execPath,
    [shadcnCli, "build", registryPath, "--output", builtRegistryDir],
    root,
    workspaceSnapshot
  )
  assertSafeBuiltTargets(installOrder, rootComponents.aliases)
  makeInstallCopies(installOrder)

  for (const item of installOrder) {
    const installItemPath = path.join(installItemsDir, `${item.name}.json`)

    console.log(`Installing ${item.name} into temporary consumer...`)
    runIsolated(
      `Install ${item.name} into temporary consumer`,
      process.execPath,
      [shadcnCli, "add", relativePath(consumerDir, installItemPath), "--yes"],
      consumerDir,
      workspaceSnapshot
    )
  }

  assertInstalledTargets(installOrder, rootComponents.aliases)
  assertNoSourcePathLeakage()
  const consumerTscCli = path.join(
    consumerDir,
    "node_modules",
    "typescript",
    "bin",
    "tsc"
  )
  const consumerNextCli = path.join(
    consumerDir,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  )

  for (const executable of [consumerTscCli, consumerNextCli]) {
    if (!fs.existsSync(executable)) {
      throw new Error(
        `Consumer install is missing required executable: ${executable}`
      )
    }
  }
  runIsolated(
    "Type-check temporary consumer",
    process.execPath,
    [consumerTscCli, "--noEmit", "--pretty", "false"],
    consumerDir,
    workspaceSnapshot
  )
  runIsolated(
    "Build temporary consumer",
    process.execPath,
    [
      consumerNextCli,
      "build",
      ...(process.platform === "win32" ? ["--webpack"] : []),
    ],
    consumerDir,
    workspaceSnapshot
  )
  cleanupTempRoot()

  console.log(
    `Consumer registry smoke passed: installed ${installOrder.length} items, type-checked, and production-built the isolated fixture.`
  )
}

try {
  main()
} catch (error) {
  console.error(
    `Consumer registry smoke failed: ${error instanceof Error ? error.message : error}`
  )
  console.error(`Temporary fixture retained for inspection: ${tempRoot}`)
  process.exitCode = 1
}
