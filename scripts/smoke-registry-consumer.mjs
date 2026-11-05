import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const root = path.resolve(process.cwd())
const systemTempRoot = fs.realpathSync(os.tmpdir())
const tempRoot = fs.mkdtempSync(
  path.join(systemTempRoot, "fable-ui-registry-consumer-")
)
const consumerSmokeStoreDir = process.env.FABLE_REGISTRY_SMOKE_STORE_DIR
const consumerDir = path.join(tempRoot, "consumer")
const v2OnlyConsumerDir = path.join(tempRoot, "consumer-v2-only")
const builtRegistryDir = path.join(tempRoot, "built-registry")
const servedRegistryDir = path.join(tempRoot, "served-registry")
const registryServerReadyPath = path.join(tempRoot, "registry-server.json")
const registryPath = path.join(root, "registry.json")
const rootPackagePath = path.join(root, "package.json")
const rootLockfilePath = path.join(root, "pnpm-lock.yaml")
const rootComponentsPath = path.join(root, "components.json")
const shadcnCli = path.join(root, "node_modules", "shadcn", "dist", "index.js")
const registryServerCli = path.join(root, "scripts", "serve-registry.mjs")
const productionRegistryBaseUrl = "https://fable-ui.shobky.com"
const requiredV1RegistryItems = [
  "core",
  "metric-card",
  "suggested-actions",
  "confirmation-card",
  "form-card",
  "data-browser",
  "charts",
  "text-editor-card",
  "email-composer-card",
  "code-block-card",
  "rest-driver",
  "firebase-driver",
  "quickstart",
]
const requiredV2RegistryItems = ["v2-primitives", "v2-renderer"]

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

function run(label, executable, args, cwd, { shell = false } = {}) {
  try {
    const commandArgs =
      consumerSmokeStoreDir && executable === "pnpm"
        ? [...args, "--store-dir", consumerSmokeStoreDir]
        : args

    return execFileSync(executable, commandArgs, {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      shell,
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

function runIsolated(
  label,
  executable,
  args,
  cwd,
  workspaceSnapshot,
  options = {}
) {
  try {
    return run(label, executable, args, cwd, options)
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

function canonicalRegistryUrl(itemName) {
  return `${productionRegistryBaseUrl}/r/${itemName}.json`
}

function sameRepoDependencyName(dependency) {
  if (!dependency.startsWith(`${productionRegistryBaseUrl}/r/`)) {
    return null
  }

  const match = dependency.match(
    /^https:\/\/fable-ui\.shobky\.com\/r\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/
  )

  return match?.[1] ?? null
}

function assertCanonicalHostedDependencies(items) {
  const knownItems = new Set(items.map((item) => item.name))

  for (const item of items) {
    for (const dependency of item.registryDependencies ?? []) {
      if (dependency.startsWith("shobky/fable-ui/")) {
        throw new Error(
          `${item.name} uses a legacy same-repository dependency: ${dependency}.`
        )
      }

      const dependencyName = sameRepoDependencyName(dependency)

      if (!dependencyName) {
        continue
      }

      if (!knownItems.has(dependencyName)) {
        throw new Error(
          `${item.name} depends on unknown hosted registry item: ${dependency}.`
        )
      }

      if (dependency !== canonicalRegistryUrl(dependencyName)) {
        throw new Error(
          `${item.name} has a non-canonical hosted registry dependency: ${dependency}.`
        )
      }
    }
  }
}

function itemInstallOrder(items) {
  const byName = new Map(items.map((item) => [item.name, item]))
  const unresolved = new Map(
    items.map((item) => [
      item.name,
      new Set(
        (item.registryDependencies ?? [])
          .map(sameRepoDependencyName)
          .filter(Boolean)
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

function createConsumerConfig(
  rootPackage,
  rootComponents,
  targetDir = consumerDir,
  { v2Only = false } = {}
) {
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

  writeJson(path.join(targetDir, "package.json"), {
    name: "fable-ui-registry-consumer-smoke",
    version: "0.0.0",
    private: true,
    scripts: {
      build: "next build",
      lint: "eslint .",
      typecheck: "tsc --noEmit",
    },
    dependencies: pickPackages(
      rootPackage,
      "dependencies",
      v2Only
        ? [
            "next",
            "react",
            "react-dom",
            "clsx",
            "tailwind-merge",
            "tw-animate-css",
            "shadcn",
          ]
        : [
            "next",
            "radix-ui",
            "react",
            "react-dom",
            "clsx",
            "tailwind-merge",
            "tw-animate-css",
            "shadcn",
          ]
    ),
    devDependencies: pickPackages(rootPackage, "devDependencies", [
      "@tailwindcss/postcss",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "tailwindcss",
      "typescript",
      "eslint",
      "eslint-config-next",
    ]),
  })
  writeFile(
    path.join(targetDir, "pnpm-workspace.yaml"),
    `packages:\n  - "."\n\nallowBuilds:\n  sharp: true\n  unrs-resolver: true\n  msw: false\n  esbuild: true\n`
  )

  writeJson(path.join(targetDir, "components.json"), {
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

  writeJson(path.join(targetDir, "tsconfig.json"), {
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
    path.join(targetDir, "next-env.d.ts"),
    `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// This file is generated for the temporary consumer smoke app.\n`
  )
  writeFile(
    path.join(targetDir, "next.config.ts"),
    `import type { NextConfig } from "next"\n\nconst nextConfig: NextConfig = {}\n\nexport default nextConfig\n`
  )
  writeFile(
    path.join(targetDir, "eslint.config.mjs"),
    `import { defineConfig, globalIgnores } from "eslint/config"\nimport nextVitals from "eslint-config-next/core-web-vitals"\n\nexport default defineConfig([\n  ...nextVitals,\n  globalIgnores([".next/**", "next-env.d.ts"]),\n])\n`
  )
  writeFile(
    path.join(targetDir, "postcss.config.mjs"),
    `const config = {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n}\n\nexport default config\n`
  )
  writeFile(
    path.join(targetDir, "app", "layout.tsx"),
    `import type { ReactNode } from "react"\n\nimport "./globals.css"\n\nexport default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {\n  return (\n    <html lang="ar" dir="rtl">\n      <body>{children}</body>\n    </html>\n  )\n}\n`
  )
  writeFile(
    path.join(targetDir, "app", "page.tsx"),
    `import { RegistrySmoke } from "@/components/registry-smoke"\nimport * as chartTools from "@/lib/fable-ui/tools/show-chart-tool"\nimport * as codeBlockTools from "@/lib/fable-ui/tools/show-code-block-tool"\nimport * as confirmationTools from "@/lib/fable-ui/tools/request-confirmation-tool"\nimport * as dataBrowserTools from "@/lib/fable-ui/tools/show-data-browser-tool"\nimport * as emailComposerTools from "@/lib/fable-ui/tools/show-email-composer-tool"\nimport * as formTools from "@/lib/fable-ui/tools/collect-input-tool"\nimport * as metricTools from "@/lib/fable-ui/tools/show-metric-tool"\nimport * as renderedDataTools from "@/lib/fable-ui/tools/get-rendered-data-tool"\nimport * as suggestedActionTools from "@/lib/fable-ui/tools/show-next-actions-tool"\nimport * as tableTools from "@/lib/fable-ui/tools/show-table-tool"\nimport * as textEditorTools from "@/lib/fable-ui/tools/show-text-editor-tool"\n\nconst installedToolModules = [chartTools, codeBlockTools, confirmationTools, dataBrowserTools, emailComposerTools, formTools, metricTools, renderedDataTools, suggestedActionTools, tableTools, textEditorTools]\n\nexport default function Page() {\n  void installedToolModules\n  return <RegistrySmoke />\n}\n`
  )
  writeFile(
    path.join(targetDir, "components", "registry-smoke.tsx"),
    `"use client"\n\nimport { Charts } from "@/components/fable-ui/charts"\nimport { CodeBlockCard } from "@/components/fable-ui/code-block-card"\nimport { ConfirmationCard } from "@/components/fable-ui/confirmation-card"\nimport { DataBrowser } from "@/components/fable-ui/data-browser"\nimport { EmailComposerCard } from "@/components/fable-ui/email-composer-card"\nimport { FormCard } from "@/components/fable-ui/form-card"\nimport { MetricCard } from "@/components/fable-ui/metric-card"\nimport { SuggestedActions } from "@/components/fable-ui/suggested-actions"\nimport { TextEditorCard } from "@/components/fable-ui/text-editor-card"\nimport { DataSourceRegistry } from "@/lib/fable-ui/core"\nimport { createFirebaseDriver } from "@/lib/fable-ui/drivers/firebase"\nimport { createRestDriver } from "@/lib/fable-ui/drivers/rest"\n\nconst registry = new DataSourceRegistry()\nconst restDriver = createRestDriver()\n\nexport function RegistrySmoke() {\n  void registry\n  void restDriver\n  void createFirebaseDriver\n\n  return (\n    <main>\n      <MetricCard label="Revenue" value="$1" />\n      <SuggestedActions title="Next" actions={[]} onAction={() => undefined} />\n      <ConfirmationCard id="confirm" title="Confirm" description="Smoke" />\n      <FormCard title="Input" fields={[]} onSubmit={() => undefined} />\n      <DataBrowser title="Rows" entityLabel="row" columns={[{ key: "name", label: "Name" }]} rows={[{ id: "1", name: "Smoke" }]} />\n      <Charts title="Chart" data={[{ label: "Smoke", value: 1 }]} categoryKey="label" valueKey="value" defaultChartType="bar" />\n      <TextEditorCard label="ملاحظة" content="Smoke" />\n      <EmailComposerCard subject="Smoke" body="Email smoke" to={["smoke@example.com"]} />\n      <CodeBlockCard language="ts" code="const smoke = true\\n" />\n    </main>\n  )\n}\n`
  )
  writeFile(
    path.join(targetDir, "app", "globals.css"),
    `@import "tailwindcss";\n@import "tw-animate-css";\n@import "shadcn/tailwind.css";\n\n@custom-variant dark (&:is(.dark *));\n\n:root {\n  --radius: 0.625rem;\n  --background: oklch(1 0 0);\n  --foreground: oklch(0.145 0 0);\n  --card: oklch(1 0 0);\n  --card-foreground: oklch(0.145 0 0);\n  --popover: oklch(1 0 0);\n  --popover-foreground: oklch(0.145 0 0);\n  --primary: oklch(0.205 0 0);\n  --primary-foreground: oklch(0.985 0 0);\n  --secondary: oklch(0.97 0 0);\n  --secondary-foreground: oklch(0.205 0 0);\n  --muted: oklch(0.97 0 0);\n  --muted-foreground: oklch(0.556 0 0);\n  --accent: oklch(0.97 0 0);\n  --accent-foreground: oklch(0.205 0 0);\n  --destructive: oklch(0.577 0.245 27.325);\n  --border: oklch(0.922 0 0);\n  --input: oklch(0.922 0 0);\n  --ring: oklch(0.708 0 0);\n  --chart-1: oklch(0.646 0.222 41.116);\n  --chart-2: oklch(0.6 0.118 184.704);\n  --chart-3: oklch(0.398 0.07 227.392);\n  --chart-4: oklch(0.828 0.189 84.429);\n  --chart-5: oklch(0.769 0.188 70.08);\n  --sidebar: oklch(0.985 0 0);\n  --sidebar-foreground: oklch(0.145 0 0);\n  --sidebar-primary: oklch(0.205 0 0);\n  --sidebar-primary-foreground: oklch(0.985 0 0);\n  --sidebar-accent: oklch(0.97 0 0);\n  --sidebar-accent-foreground: oklch(0.205 0 0);\n  --sidebar-border: oklch(0.922 0 0);\n  --sidebar-ring: oklch(0.708 0 0);\n}\n\n.dark {\n  --background: oklch(0.145 0 0);\n  --foreground: oklch(0.985 0 0);\n  --card: oklch(0.205 0 0);\n  --card-foreground: oklch(0.985 0 0);\n  --popover: oklch(0.205 0 0);\n  --popover-foreground: oklch(0.985 0 0);\n  --primary: oklch(0.922 0 0);\n  --primary-foreground: oklch(0.205 0 0);\n  --secondary: oklch(0.269 0 0);\n  --secondary-foreground: oklch(0.985 0 0);\n  --muted: oklch(0.269 0 0);\n  --muted-foreground: oklch(0.708 0 0);\n  --accent: oklch(0.269 0 0);\n  --accent-foreground: oklch(0.985 0 0);\n  --destructive: oklch(0.704 0.191 22.216);\n  --border: oklch(1 0 0 / 10%);\n  --input: oklch(1 0 0 / 15%);\n  --ring: oklch(0.556 0 0);\n  --sidebar: oklch(0.205 0 0);\n  --sidebar-foreground: oklch(0.985 0 0);\n  --sidebar-primary: oklch(0.488 0.243 264.376);\n  --sidebar-primary-foreground: oklch(0.985 0 0);\n  --sidebar-accent: oklch(0.269 0 0);\n  --sidebar-accent-foreground: oklch(0.985 0 0);\n  --sidebar-border: oklch(1 0 0 / 10%);\n  --sidebar-ring: oklch(0.439 0 0);\n}\n\n@theme inline {\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n  --color-card: var(--card);\n  --color-card-foreground: var(--card-foreground);\n  --color-popover: var(--popover);\n  --color-popover-foreground: var(--popover-foreground);\n  --color-primary: var(--primary);\n  --color-primary-foreground: var(--primary-foreground);\n  --color-secondary: var(--secondary);\n  --color-secondary-foreground: var(--secondary-foreground);\n  --color-muted: var(--muted);\n  --color-muted-foreground: var(--muted-foreground);\n  --color-accent: var(--accent);\n  --color-accent-foreground: var(--accent-foreground);\n  --color-destructive: var(--destructive);\n  --color-border: var(--border);\n  --color-input: var(--input);\n  --color-ring: var(--ring);\n  --color-chart-1: var(--chart-1);\n  --color-chart-2: var(--chart-2);\n  --color-chart-3: var(--chart-3);\n  --color-chart-4: var(--chart-4);\n  --color-chart-5: var(--chart-5);\n  --color-sidebar: var(--sidebar);\n  --color-sidebar-foreground: var(--sidebar-foreground);\n  --color-sidebar-primary: var(--sidebar-primary);\n  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);\n  --color-sidebar-accent: var(--sidebar-accent);\n  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);\n  --color-sidebar-border: var(--sidebar-border);\n  --color-sidebar-ring: var(--sidebar-ring);\n  --radius-sm: calc(var(--radius) - 4px);\n  --radius-md: calc(var(--radius) - 2px);\n  --radius-lg: var(--radius);\n  --radius-xl: calc(var(--radius) + 4px);\n}\n\n@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n`
  )
  writeFile(
    path.join(targetDir, "lib", "utils.ts"),
    `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`
  )
}

function writeConsumerSmokeSurface(installedNames, targetDir = consumerDir) {
  const installed = new Set(installedNames)
  const imports = []
  const surfaces = []
  const addSurface = (itemName, statement, surface) => {
    if (installed.has(itemName)) {
      imports.push(statement)
      surfaces.push(surface)
    }
  }

  addSurface(
    "metric-card",
    'import { MetricCard } from "@/components/fable-ui/metric-card"',
    '<MetricCard label="Revenue" value="$1" />'
  )
  addSurface(
    "suggested-actions",
    'import { SuggestedActions } from "@/components/fable-ui/suggested-actions"',
    '<SuggestedActions title="Next" actions={[]} onAction={() => undefined} />'
  )
  addSurface(
    "confirmation-card",
    'import { ConfirmationCard } from "@/components/fable-ui/confirmation-card"',
    '<ConfirmationCard id="confirm" title="Confirm" description="Smoke" />'
  )
  addSurface(
    "form-card",
    'import { FormCard } from "@/components/fable-ui/form-card"',
    '<FormCard title="Input" fields={[]} onSubmit={() => undefined} />'
  )
  addSurface(
    "data-browser",
    'import { DataBrowser } from "@/components/fable-ui/data-browser"',
    '<DataBrowser title="Rows" entityLabel="row" columns={[{ key: "name", label: "Name" }]} rows={[{ id: "1", name: "Smoke" }]} />'
  )
  addSurface(
    "charts",
    'import { Charts } from "@/components/fable-ui/charts"',
    '<Charts title="Chart" data={[{ label: "Smoke", value: 1 }]} categoryKey="label" valueKey="value" defaultChartType="bar" />'
  )
  addSurface(
    "text-editor-card",
    'import { TextEditorCard } from "@/components/fable-ui/text-editor-card"',
    '<TextEditorCard label="ملاحظة" content="Smoke" />'
  )
  addSurface(
    "email-composer-card",
    'import { EmailComposerCard } from "@/components/fable-ui/email-composer-card"',
    '<EmailComposerCard subject="Smoke" body="Email smoke" to={["smoke@example.com"]} />'
  )
  addSurface(
    "code-block-card",
    'import { CodeBlockCard } from "@/components/fable-ui/code-block-card"',
    '<CodeBlockCard language="ts" code="const smoke = true\\n" />'
  )
  addSurface(
    "v2-primitives",
    'import { FableGrid, FableMetricCard, FableRichContent, FableRichText } from "@/components/fable-ui/v2"',
    '<FableGrid columns={1}><FableMetricCard label="Bookings" value={12} format="number" /><FableRichText spans={[{ text: "Host-owned value", mark: "strong" }]} /><FableRichContent blocks={[{ type: "paragraph", spans: [{ type: "text", text: "Consumer rich content", mark: "plain" }] }]} /></FableGrid>'
  )
  addSurface(
    "v2-renderer",
    'import { FableSpecRenderer } from "@/components/fable-ui/v2/renderer"',
    '<FableSpecRenderer spec={{ root: "title", elements: { title: { type: "RichContent", props: { blocks: [{ type: "paragraph", spans: [{ type: "text", text: "Consumer", mark: "plain" }] }] }, children: [] } } }} data={{}} links={{}} />'
  )

  writeFile(
    path.join(targetDir, "app", "page.tsx"),
    `import { RegistrySmoke } from "@/components/registry-smoke"\n\nexport default function Page() {\n  return <RegistrySmoke />\n}\n`
  )
  writeFile(
    path.join(targetDir, "components", "registry-smoke.tsx"),
    `"use client"\n\n${imports.join("\n")}\n\nexport function RegistrySmoke() {\n  return <main>${surfaces.join("\n      ") || "Smoke"}</main>\n}\n`
  )
}

function makeServedRegistryCopies(items, localRegistryBaseUrl) {
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

    const servedItem = JSON.parse(JSON.stringify(builtItem))

    if (Array.isArray(servedItem.registryDependencies)) {
      servedItem.registryDependencies = servedItem.registryDependencies.map(
        (dependency) => {
          const dependencyName = sameRepoDependencyName(dependency)

          return dependencyName
            ? `${localRegistryBaseUrl}/r/${dependencyName}.json`
            : dependency
        }
      )
    }

    writeJson(
      path.join(servedRegistryDir, "r", `${item.name}.json`),
      servedItem
    )
  }
}

function waitForLoopbackRegistryServer(child) {
  const timeoutAt = Date.now() + 10_000

  while (Date.now() < timeoutAt) {
    if (fs.existsSync(registryServerReadyPath)) {
      const { baseUrl } = readJson(registryServerReadyPath)

      if (
        typeof baseUrl === "string" &&
        /^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl)
      ) {
        return baseUrl
      }

      throw new Error("Loopback registry server wrote an invalid ready file.")
    }

    if (child.exitCode !== null) {
      throw new Error(
        `Loopback registry server exited before becoming ready (exit ${child.exitCode}).`
      )
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25)
  }

  throw new Error("Timed out waiting for the loopback registry server.")
}

function startLoopbackRegistryServer() {
  const child = spawn(
    process.execPath,
    [registryServerCli, servedRegistryDir, registryServerReadyPath],
    {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    }
  )
  let stderr = ""

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk)
  })

  try {
    return { child, baseUrl: waitForLoopbackRegistryServer(child) }
  } catch (error) {
    child.kill("SIGTERM")
    throw new Error(
      `${error instanceof Error ? error.message : error}${stderr ? `\n${stderr}` : ""}`
    )
  }
}

function stopLoopbackRegistryServer(child) {
  if (child && child.exitCode === null) {
    child.kill("SIGTERM")
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
    { pattern: /IconPlaceHolder?/i, reason: "raw shadcn icon placeholder" },
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

function assertInstalledSourceContracts() {
  const required = [
    [
      "components/fable-ui/text-editor-card/text-editor-card.tsx",
      /export function TextEditorCard/,
      "TextEditorCard export",
    ],
    [
      "components/fable-ui/email-composer-card/email-composer-card.tsx",
      /from "@\/components\/fable-ui\/text-editor-card(?:\/text-editor-card)?"/,
      "email-to-text-editor registry wiring",
    ],
    [
      "lib/fable-ui/tools/show-email-composer-tool.ts",
      /defineFableComponent\(/,
      "email server tool registry wiring",
    ],
    [
      "components/fable-ui/code-block-card/code-block-card.tsx",
      /<TooltipProvider>/,
      "self-contained code-block tooltip provider",
    ],
    [
      "lib/fable-ui/tools/collect-input-tool.ts",
      /collectInputSchema = z[\s\S]*?\.strict\(\)/,
      "strict collect_input schema",
    ],
    [
      "components/fable-ui/chat/fable-chat.tsx",
      /DefaultChatTransport\(\{ api: "\/api\/fable-chat" \}\)/,
      "quickstart client route wiring",
    ],
    [
      "app/api/fable-chat/route.ts",
      /export async function POST\(req: Request\)/,
      "quickstart server route",
    ],
    [
      "components/fable-ui/v2/catalog.ts",
      /export const FableViewSpecSchema/,
      "strict v2 view schema",
    ],
    [
      "components/fable-ui/v2/stream.ts",
      /createSpecStreamCompiler/,
      "v2 bounded stream compiler",
    ],
    [
      "components/fable-ui/v2/renderer.tsx",
      /data-fable-ui="v2-renderer"/,
      "v2 React renderer",
    ],
  ]

  for (const [relativeFile, pattern, description] of required) {
    const filePath = path.join(consumerDir, relativeFile)

    if (
      !fs.existsSync(filePath) ||
      !pattern.test(fs.readFileSync(filePath, "utf8"))
    ) {
      throw new Error(
        `Installed source is missing ${description}: ${relativeFile}.`
      )
    }
  }
}

function assertFirebasePnpmPolicy() {
  const packageManagerUserAgent = process.env.npm_config_user_agent ?? ""
  const pnpmVersion = /(?:^|\s)pnpm\/(\d+\.\d+\.\d+)/.exec(
    packageManagerUserAgent
  )?.[1]

  if (!pnpmVersion || !/^11\./.test(pnpmVersion)) {
    throw new Error(
      `Firebase registry installation requires pnpm 11.x; detected ${packageManagerUserAgent || "no package-manager user agent"}.`
    )
  }

  const consumerPackage = readJson(path.join(consumerDir, "package.json"))

  if (!consumerPackage.dependencies?.firebase) {
    throw new Error(
      "Firebase registry installation did not add firebase to the consumer dependencies under pnpm 11."
    )
  }

  console.log(
    `Firebase pnpm policy passed: pnpm ${pnpmVersion}, firebase resolved in the isolated consumer.`
  )
}

function assertProviderFreeV2Consumer() {
  const packageJson = readJson(path.join(v2OnlyConsumerDir, "package.json"))
  const dependencyNames = Object.keys(packageJson.dependencies ?? {})
  const providerDependencies = dependencyNames.filter(
    (name) =>
      name === "ai" ||
      name.startsWith("@ai-sdk/") ||
      name === "firebase" ||
      name.startsWith("firebase-") ||
      name === "@openrouter/ai-sdk-provider"
  )

  if (providerDependencies.length > 0) {
    throw new Error(
      `The v2-only consumer unexpectedly depends on provider packages: ${providerDependencies.join(", ")}.`
    )
  }

  if (packageJson.dependencies?.["@json-render/core"] !== "0.21.3") {
    throw new Error(
      `The v2-only consumer must pin @json-render/core@0.21.3; received ${packageJson.dependencies?.["@json-render/core"] ?? "no dependency"}.`
    )
  }
}

function runV2OnlyConsumerSmoke(
  items,
  rootPackage,
  rootComponents,
  registryBaseUrl,
  workspaceSnapshot
) {
  createConsumerConfig(rootPackage, rootComponents, v2OnlyConsumerDir, {
    v2Only: true,
  })
  writeConsumerSmokeSurface([], v2OnlyConsumerDir)
  runIsolated(
    "Install baseline dependencies for clean v2-only consumer",
    "pnpm",
    ["install"],
    v2OnlyConsumerDir,
    workspaceSnapshot,
    { shell: process.platform === "win32" }
  )

  const v2InstallOrder = items.filter((item) =>
    requiredV2RegistryItems.includes(item.name)
  )
  const installedNames = []

  for (const item of v2InstallOrder) {
    const itemUrl = `${registryBaseUrl}/r/${item.name}.json`

    console.log(
      `Installing ${item.name} into a clean v2-only consumer from ${itemUrl}...`
    )
    runIsolated(
      `Install ${item.name} into clean v2-only consumer`,
      process.execPath,
      [shadcnCli, "add", itemUrl, "--yes"],
      v2OnlyConsumerDir,
      workspaceSnapshot
    )
    installedNames.push(item.name)
    writeConsumerSmokeSurface(installedNames, v2OnlyConsumerDir)

    const consumerTscCli = path.join(
      v2OnlyConsumerDir,
      "node_modules",
      "typescript",
      "bin",
      "tsc"
    )

    if (!fs.existsSync(consumerTscCli)) {
      throw new Error(
        `The v2-only install is missing TypeScript after ${item.name}: ${consumerTscCli}`
      )
    }
    runIsolated(
      `Type-check v2-only consumer after ${item.name}`,
      process.execPath,
      [consumerTscCli, "--noEmit", "--pretty", "false"],
      v2OnlyConsumerDir,
      workspaceSnapshot
    )
  }

  assertProviderFreeV2Consumer()

  const consumerEslintCli = path.join(
    v2OnlyConsumerDir,
    "node_modules",
    "eslint",
    "bin",
    "eslint.js"
  )
  const consumerNextCli = path.join(
    v2OnlyConsumerDir,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  )

  for (const executable of [consumerEslintCli, consumerNextCli]) {
    if (!fs.existsSync(executable)) {
      throw new Error(
        `The v2-only consumer is missing required executable: ${executable}`
      )
    }
  }
  runIsolated(
    "Lint clean v2-only consumer sources",
    process.execPath,
    [consumerEslintCli, "."],
    v2OnlyConsumerDir,
    workspaceSnapshot
  )
  runIsolated(
    "Build clean v2-only consumer",
    process.execPath,
    [
      consumerNextCli,
      "build",
      ...(process.platform === "win32" ? ["--webpack"] : []),
    ],
    v2OnlyConsumerDir,
    workspaceSnapshot
  )

  console.log(
    "Clean v2-only consumer smoke passed without v1 AI SDK or Firebase dependencies."
  )
}

async function main() {
  for (const filePath of [
    registryPath,
    rootPackagePath,
    rootLockfilePath,
    rootComponentsPath,
    shadcnCli,
    registryServerCli,
  ]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required local file: ${filePath}`)
    }
  }

  const rootRegistry = readJson(registryPath)
  const items = rootRegistry.items ?? []

  const currentNames = new Set(items.map((item) => item.name))
  const missingV1Items = requiredV1RegistryItems.filter((name) => !currentNames.has(name))
  const missingV2Items = requiredV2RegistryItems.filter((name) => !currentNames.has(name))
  if (missingV1Items.length > 0) {
    throw new Error(`Registry removed v1 items: ${missingV1Items.join(", ")}.`)
  }
  if (missingV2Items.length > 0) {
    throw new Error(`Registry is missing experimental v2 items: ${missingV2Items.join(", ")}.`)
  }

  if (new Set(items.map((item) => item.name)).size !== items.length) {
    throw new Error(
      "Registry item names must be unique for consumer installation."
    )
  }
  assertSafeItemNames(items)
  assertCanonicalHostedDependencies(items)

  const rootPackage = readJson(rootPackagePath)
  const rootComponents = readJson(rootComponentsPath)
  const installOrder = itemInstallOrder(items)
  const workspaceSnapshot = snapshotWorkspaceFiles()

  let registryServer

  try {
    createConsumerConfig(rootPackage, rootComponents)
    writeConsumerSmokeSurface([])
    runIsolated(
      "Build current registry into consumer smoke artifacts",
      process.execPath,
      [shadcnCli, "build", registryPath, "--output", builtRegistryDir],
      root,
      workspaceSnapshot
    )
    assertSafeBuiltTargets(installOrder, rootComponents.aliases)
    fs.mkdirSync(path.join(servedRegistryDir, "r"), { recursive: true })
    registryServer = startLoopbackRegistryServer()
    makeServedRegistryCopies(installOrder, registryServer.baseUrl)

    runV2OnlyConsumerSmoke(
      installOrder,
      rootPackage,
      rootComponents,
      registryServer.baseUrl,
      workspaceSnapshot
    )

    const installedNames = []

    for (const item of installOrder) {
      const itemUrl = `${registryServer.baseUrl}/r/${item.name}.json`

      console.log(
        `Installing ${item.name} from ${itemUrl} into temporary consumer...`
      )
      runIsolated(
        `Install ${item.name} into temporary consumer from loopback registry`,
        process.execPath,
        [shadcnCli, "add", itemUrl, "--yes"],
        consumerDir,
        workspaceSnapshot
      )
      installedNames.push(item.name)
      writeConsumerSmokeSurface(installedNames)

      const consumerTscCli = path.join(
        consumerDir,
        "node_modules",
        "typescript",
        "bin",
        "tsc"
      )

      if (!fs.existsSync(consumerTscCli)) {
        throw new Error(
          `Consumer install is missing TypeScript after installing ${item.name}: ${consumerTscCli}`
        )
      }
      runIsolated(
        `Type-check temporary consumer after ${item.name}`,
        process.execPath,
        [consumerTscCli, "--noEmit", "--pretty", "false"],
        consumerDir,
        workspaceSnapshot
      )
    }

    assertInstalledTargets(installOrder, rootComponents.aliases)
    assertNoSourcePathLeakage()
    assertInstalledSourceContracts()
    assertFirebasePnpmPolicy()
    const consumerEslintCli = path.join(
      consumerDir,
      "node_modules",
      "eslint",
      "bin",
      "eslint.js"
    )
    const consumerNextCli = path.join(
      consumerDir,
      "node_modules",
      "next",
      "dist",
      "bin",
      "next"
    )

    for (const executable of [consumerEslintCli, consumerNextCli]) {
      if (!fs.existsSync(executable)) {
        throw new Error(
          `Consumer install is missing required executable: ${executable}`
        )
      }
    }
    runIsolated(
      "Lint installed temporary consumer sources",
      process.execPath,
      [consumerEslintCli, "."],
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
  } finally {
    stopLoopbackRegistryServer(registryServer?.child)
  }
  cleanupTempRoot()

  console.log(
    `Consumer registry smoke passed: installed ${installOrder.length} items, type-checked, and production-built the isolated fixture.`
  )
}

try {
  await main()
} catch (error) {
  console.error(
    `Consumer registry smoke failed: ${error instanceof Error ? error.message : error}`
  )
  console.error(`Temporary fixture retained for inspection: ${tempRoot}`)
  process.exitCode = 1
}
