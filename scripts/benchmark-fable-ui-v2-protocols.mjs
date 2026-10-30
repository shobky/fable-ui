import { createRequire } from "node:module"
import path from "node:path"
import { performance } from "node:perf_hooks"

const benchmarkRoot = process.env.FABLE_PROTOCOL_BENCH_ROOT

if (!benchmarkRoot) {
  throw new Error(
    "Set FABLE_PROTOCOL_BENCH_ROOT to the isolated package install. See docs/rfcs/fable-ui-v2-decisions.md."
  )
}

const externalRequire = createRequire(path.join(benchmarkRoot, "package.json"))
const { z } = externalRequire("zod/v4")
const {
  createLibrary,
  createParser,
  createStreamingParser,
  defineComponent,
} = externalRequire("@openuidev/react-lang")
const {
  createSpecStreamCompiler,
  defineCatalog,
  validateSpec,
} = externalRequire("@json-render/core")
const { schema: jsonRenderSchema } = externalRequire("@json-render/react/schema")

const textProps = z
  .object({
    content: z.string().max(2000),
    level: z.enum(["body", "heading", "caption"]),
  })
  .strict()

const richTextProps = z
  .object({
    spans: z
      .array(
        z
          .object({
            text: z.string().max(240),
            mark: z.enum(["plain", "strong", "emphasis", "code"]),
          })
          .strict()
      )
      .max(16),
  })
  .strict()

const metricProps = z
  .object({
    label: z.string().max(120),
    resultId: z.string().max(80),
    format: z.enum(["number", "currency", "percent"]),
  })
  .strict()

const entityProps = z
  .object({
    name: z.string().max(120),
    detail: z.string().max(240),
    kind: z.enum(["person", "place", "plan"]),
  })
  .strict()

const tableProps = z
  .object({
    headers: z.array(z.string().max(80)).min(1).max(4),
    rows: z.array(z.array(z.string().max(120)).min(1).max(4)).max(8),
  })
  .strict()

const chartProps = z
  .object({
    label: z.string().max(120),
    values: z.array(z.number().finite()).min(1).max(12),
  })
  .strict()

const mediaProps = z
  .object({
    assetId: z.enum(["reef", "compass"]),
    alt: z.string().max(200),
  })
  .strict()

const filterProps = z
  .object({
    label: z.string().max(80),
    options: z.array(z.string().max(80)).min(1).max(8),
  })
  .strict()

const leafDefinitions = [
  ["Text", textProps, "Plain text with a constrained typographic level."],
  ["RichText", richTextProps, "Inline text with structured, safe marks."],
  ["Metric", metricProps, "A metric resolved from host-owned result data."],
  ["Entity", entityProps, "A compact person, place, or plan summary."],
  ["Table", tableProps, "A small, bounded table."],
  ["Chart", chartProps, "A small chart backed by bounded numeric points."],
  ["Media", mediaProps, "A host-selected local media asset."],
  ["Filter", filterProps, "A local filter control."],
].map(([name, props, description]) =>
  defineComponent({
    name,
    props,
    description,
    component: () => null,
  })
)

const leafReferences = leafDefinitions.map((component) => component.ref)
const directionSchema = z.enum(["vertical", "horizontal"])
let Group
const groupProps = z
  .object({
    children: z.array(z.union(leafReferences)).max(12),
    direction: directionSchema,
  })
  .strict()
const stackProps = z
  .object({
    children: z
      .array(z.union([...leafReferences, z.lazy(() => Group.ref)]))
      .max(24),
    direction: directionSchema,
  })
  .strict()

Group = defineComponent({
  name: "Group",
  props: groupProps,
  description: "A row or column containing bounded response components.",
  component: () => null,
})

const Stack = defineComponent({
  name: "Stack",
  props: stackProps,
  description: "The root response layout.",
  component: () => null,
})

const openUiLibrary = createLibrary({
  root: "Stack",
  components: [Stack, Group, ...leafDefinitions],
})

const componentProps = {
  Stack: z.object({ direction: directionSchema }).strict(),
  Group: z.object({ direction: directionSchema }).strict(),
  Text: textProps,
  RichText: richTextProps,
  Metric: metricProps,
  Entity: entityProps,
  Table: tableProps,
  Chart: chartProps,
  Media: mediaProps,
  Filter: filterProps,
}

const catalog = defineCatalog(jsonRenderSchema, {
  components: Object.fromEntries(
    Object.entries(componentProps).map(([name, props]) => [
      name,
      {
        props,
        ...(name === "Stack" || name === "Group" ? { slots: ["default"] } : {}),
        description: "Fable UI " + name + " with a strict prop schema.",
      },
    ])
  ),
  actions: {},
})

const leaf = (id, type, props) => ({ id, type, props, children: [] })
const group = (id, direction, children) => ({
  id,
  type: "Group",
  props: { direction },
  children,
})
const layout = (children, direction = "vertical") => ({
  root: { id: "root", type: "Stack", props: { direction }, children },
})

const fixtures = [
  {
    name: "prose-only",
    tree: layout([
      leaf("answer", "Text", {
        content: "The studio opens at nine and closes at six.",
        level: "body",
      }),
    ]),
  },
  {
    name: "rich-typography",
    tree: layout([
      leaf("summary", "RichText", {
        spans: [
          { text: "A ", mark: "plain" },
          { text: "clear summary", mark: "strong" },
          { text: " with a code label. ", mark: "plain" },
          { text: "DEPLOY", mark: "code" },
        ],
      }),
    ]),
  },
  {
    name: "metric-answer",
    tree: layout([
      leaf("metric", "Metric", {
        label: "Active workspaces",
        resultId: "workspaces.active",
        format: "number",
      }),
      leaf("context", "Text", {
        content: "Resolved from host-owned response data.",
        level: "caption",
      }),
    ]),
  },
  {
    name: "side-by-side-comparison",
    tree: layout([
      group("plans", "horizontal", [
        leaf("plan-a", "Entity", {
          name: "Essential",
          detail: "Flexible monthly billing.",
          kind: "plan",
        }),
        leaf("plan-b", "Entity", {
          name: "Annual",
          detail: "A lower rate for a year.",
          kind: "plan",
        }),
      ]),
    ]),
  },
  {
    name: "compact-table",
    tree: layout([
      leaf("table", "Table", {
        headers: ["Month", "Orders"],
        rows: [
          ["April", "148"],
          ["May", "173"],
          ["June", "189"],
        ],
      }),
    ]),
  },
  {
    name: "trend-chart",
    tree: layout([
      leaf("trend", "Chart", {
        label: "Orders by month",
        values: [148, 173, 189, 211],
      }),
    ]),
  },
  {
    name: "entity-list",
    tree: layout([
      group("people", "vertical", [
        leaf("person-1", "Entity", {
          name: "Mina",
          detail: "Support team.",
          kind: "person",
        }),
        leaf("person-2", "Entity", {
          name: "Omar",
          detail: "Operations team.",
          kind: "person",
        }),
      ]),
    ]),
  },
  {
    name: "local-media",
    tree: layout([
      leaf("image", "Media", {
        assetId: "reef",
        alt: "Aerial view of a reef.",
      }),
      leaf("caption", "Text", {
        content: "A host-selected image with a useful caption.",
        level: "caption",
      }),
    ]),
  },
  {
    name: "filter-control",
    tree: layout([
      leaf("filter", "Filter", {
        label: "Region",
        options: ["All regions", "North", "South"],
      }),
    ]),
  },
  {
    name: "nested-dashboard-layout",
    tree: layout([
      group("left-column", "vertical", [
        leaf("sales", "Metric", {
          label: "Sales",
          resultId: "sales.month",
          format: "currency",
        }),
        leaf("sales-note", "Text", {
          content: "Current month.",
          level: "caption",
        }),
      ]),
      group("right-column", "vertical", [
        leaf("growth", "Metric", {
          label: "Growth",
          resultId: "growth.month",
          format: "percent",
        }),
        leaf("growth-note", "Text", {
          content: "Compared with the prior month.",
          level: "caption",
        }),
      ]),
    ]),
  },
  {
    name: "host-result-references",
    tree: layout([
      leaf("q2", "Metric", {
        label: "Quarter two",
        resultId: "revenue.q2",
        format: "currency",
      }),
      leaf("q3", "Metric", {
        label: "Quarter three",
        resultId: "revenue.q3",
        format: "currency",
      }),
    ]),
  },
  {
    name: "markup-like-text",
    tree: layout([
      leaf("literal-text", "Text", {
        content: "A markup-like string <tag> remains ordinary text.",
        level: "body",
      }),
    ]),
  },
]

function flattenTree(tree) {
  const elements = {}
  function visit(node) {
    elements[node.id] = {
      type: node.type,
      props: node.props,
      children: node.children.map((child) => child.id),
    }
    node.children.forEach(visit)
  }
  visit(tree.root)
  return { root: tree.root.id, elements }
}

function jsonWire(spec) {
  const patches = [
    { op: "add", path: "/root", value: spec.root },
    {
      op: "add",
      path: "/elements/" + spec.root,
      value: spec.elements[spec.root],
    },
    ...Object.entries(spec.elements)
      .filter(([id]) => id !== spec.root)
      .map(([id, element]) => ({
        op: "add",
        path: "/elements/" + id,
        value: element,
      })),
  ]
  return patches.map((patch) => JSON.stringify(patch)).join("\n") + "\n"
}

function openUiValue(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(openUiValue).join(", ") + "]"
  }
  if (value && typeof value === "object") {
    return (
      "{" +
      Object.entries(value)
        .map(([key, child]) => key + ": " + openUiValue(child))
        .join(", ") +
      "}"
    )
  }
  return JSON.stringify(value)
}

const componentArgumentOrder = {
  Stack: ["children", "direction"],
  Group: ["children", "direction"],
  Text: ["content", "level"],
  RichText: ["spans"],
  Metric: ["label", "resultId", "format"],
  Entity: ["name", "detail", "kind"],
  Table: ["headers", "rows"],
  Chart: ["label", "values"],
  Media: ["assetId", "alt"],
  Filter: ["label", "options"],
}

function openUiWire(tree) {
  const statements = []
  function visit(node, statementId = node.id) {
    const values = {
      ...node.props,
      ...(node.children.length > 0
        ? { children: node.children.map((child) => child.id) }
        : {}),
    }
    const args = componentArgumentOrder[node.type]
      .filter((key) => Object.hasOwn(values, key))
      .map((key) =>
        key === "children"
          ? "[" + values.children.join(", ") + "]"
          : openUiValue(values[key])
      )
    statements.push(
      statementId + " = " + node.type + "(" + args.join(", ") + ")"
    )
    node.children.forEach((child) => visit(child))
  }
  visit(tree.root, "root")
  return statements.join("\n")
}

function validateFableSpec(spec) {
  const issues = []
  const structural = validateSpec(spec, { checkOrphans: true })
  issues.push(...structural.issues.map((issue) => issue.code))

  const ids = Object.keys(spec?.elements ?? {})
  if (ids.length > 32) issues.push("too_many_elements")

  for (const [id, element] of Object.entries(spec?.elements ?? {})) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || id === "__proto__") {
      issues.push("invalid_element_id")
    }
    if (!Object.hasOwn(componentProps, element?.type)) {
      issues.push("unknown_component")
      continue
    }
    const result = componentProps[element.type].safeParse(element.props ?? {})
    if (!result.success) issues.push("invalid_component_props")
    if (!Array.isArray(element.children) || element.children.length > 24) {
      issues.push("invalid_children")
    }
  }
  return { valid: issues.length === 0, issues }
}

function countOpenUiNodes(node) {
  if (!node || node.type !== "element") return 0
  const childNodes = Object.values(node.props ?? {}).flatMap((value) =>
    Array.isArray(value) ? value : []
  )
  return 1 + childNodes.reduce((count, child) => count + countOpenUiNodes(child), 0)
}

function streamOpenUi(wire, chunkSize = 32) {
  const parser = createStreamingParser(openUiLibrary.toJSONSchema(), "Stack")
  let rootVisible = false
  let visibleNodeCount = 0

  for (let index = 0; index < wire.length; index += chunkSize) {
    const result = parser.push(wire.slice(index, index + chunkSize))
    rootVisible ||= Boolean(result.root)
    visibleNodeCount = Math.max(
      visibleNodeCount,
      countOpenUiNodes(result.root)
    )
  }
  return {
    result: parser.getResult(true),
    rootVisible,
    visibleNodeCount,
  }
}

function streamJsonRender(wire, chunkSize = 32) {
  const compiler = createSpecStreamCompiler()
  let appliedPatches = 0

  for (let index = 0; index < wire.length; index += chunkSize) {
    const result = compiler.push(wire.slice(index, index + chunkSize))
    appliedPatches += result.newPatches.length
  }
  return { spec: compiler.getResult(), appliedPatches }
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[Math.floor(ordered.length / 2)]
}

function medianMilliseconds(run, count = 9) {
  run()
  const samples = []
  for (let index = 0; index < count; index += 1) {
    const started = performance.now()
    run()
    samples.push(performance.now() - started)
  }
  return Number(median(samples).toFixed(3))
}

function attackCases() {
  const base = flattenTree(
    layout([
      leaf("text", "Text", { content: "Plain response.", level: "body" }),
    ])
  )
  const unknownType = structuredClone(base)
  unknownType.elements.text.type = "UnknownComponent"
  const unknownProp = structuredClone(base)
  unknownProp.elements.text.props.style = { color: "red" }
  const openUiUnknown = createParser(
    openUiLibrary.toJSONSchema(),
    "Stack"
  ).parse(
    'root = Stack([text], "vertical")\ntext = UnknownComponent("Plain response.", "body")'
  )

  return {
    jsonUnknownTypeStructuralValid: validateSpec(unknownType).valid,
    jsonUnknownTypeStrictValid: validateFableSpec(unknownType).valid,
    jsonUnknownPropStructuralValid: validateSpec(unknownProp).valid,
    jsonUnknownPropStrictValid: validateFableSpec(unknownProp).valid,
    openUiUnknownTypeErrors: openUiUnknown.meta.errors.length,
  }
}

function main() {
  if (!catalog || !Array.isArray(catalog.componentNames)) {
    throw new Error("JSON-render catalog creation failed.")
  }

  const parser = createParser(openUiLibrary.toJSONSchema(), "Stack")
  const rows = fixtures.map(({ name, tree }) => {
    const spec = flattenTree(tree)
    const openWire = openUiWire(tree)
    const jsonlWire = jsonWire(spec)
    const openParsed = parser.parse(openWire)
    const openStreamed = streamOpenUi(openWire)
    const jsonStreamed = streamJsonRender(jsonlWire)
    const strictResult = validateFableSpec(jsonStreamed.spec)
    const structuralResult = validateSpec(jsonStreamed.spec, {
      checkOrphans: true,
    })

    if (openParsed.meta.errors.length > 0 || !openParsed.root) {
      throw new Error(
        name + ": OpenUI parse failed: " + JSON.stringify(openParsed.meta.errors)
      )
    }
    if (!strictResult.valid || !structuralResult.valid) {
      throw new Error(
        name + ": JSON-render validation failed: " + strictResult.issues.join(",")
      )
    }

    return {
      name,
      nodes: Object.keys(spec.elements).length,
      openUiBytes: Buffer.byteLength(openWire),
      jsonRenderBytes: Buffer.byteLength(jsonlWire),
      openUiMedianParseMs: medianMilliseconds(() => parser.parse(openWire)),
      jsonRenderMedianCompileMs: medianMilliseconds(() =>
        streamJsonRender(jsonlWire)
      ),
      openUiStreamingRootVisible: openStreamed.rootVisible,
      openUiStreamingVisibleNodes: openStreamed.visibleNodeCount,
      jsonRenderStreamingPatches: jsonStreamed.appliedPatches,
    }
  })

  const totals = rows.reduce(
    (total, row) => ({
      openUiBytes: total.openUiBytes + row.openUiBytes,
      jsonRenderBytes: total.jsonRenderBytes + row.jsonRenderBytes,
      nodes: total.nodes + row.nodes,
      jsonRenderPatches: total.jsonRenderPatches + row.jsonRenderStreamingPatches,
    }),
    { openUiBytes: 0, jsonRenderBytes: 0, nodes: 0, jsonRenderPatches: 0 }
  )

  console.log(
    JSON.stringify(
      {
        benchmark: "deterministic-protocol-fixtures",
        fixtureCount: rows.length,
        generatedByModel: false,
        catalogComponentCount: catalog.componentNames.length,
        totals,
        attacks: attackCases(),
        fixtures: rows,
      },
      null,
      2
    )
  )
}

main()
