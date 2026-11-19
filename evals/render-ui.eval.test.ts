// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { generateText, hasToolCall, stepCountIs } from "ai"
import { describe, expect, it } from "vitest"
import { z } from "zod"

import { listIssues, resolveSpec } from "@/components/fable-ui/resolve"
import { createFableToolSchema, FableSpecSchema } from "@/components/fable-ui/schema"
import { FABLE_TOOL_NAME } from "@/components/fable-ui/tool"
import { getProvider, isProviderId } from "@/lib/ai/models"
import { createModel, serverReadiness } from "@/lib/ai/provider-config"
import { PLAYGROUND_SYSTEM, playgroundTools } from "@/lib/playground/agent"

/**
 * Live model evaluation. Costs money, so it only runs through `pnpm eval`
 * (FABLE_EVAL=1) with a configured provider key. Each case checks:
 * - whether the model chose UI or plain text as expected
 * - spec validity (every block renders after Fable's bounded repair) and
 *   strict schema conformance before repair
 * - whether an expected block type was used
 * - that every image URL came from the search_images tool
 */

type Case = { id: string; prompt: string; ui: boolean; expect?: string[] }

const CASES: Case[] = [
  { id: "greeting", prompt: "hi there!", ui: false },
  { id: "fact", prompt: "What's the capital of Australia?", ui: false },
  { id: "compare", prompt: "Compare PostgreSQL, MySQL and SQLite for a small SaaS app.", ui: true, expect: ["table"] },
  {
    id: "trend",
    prompt: "Monthly signups: Jan 120, Feb 180, Mar 260, Apr 240, May 310, Jun 400. Show me the trend.",
    ui: true,
    expect: ["chart"],
  },
  { id: "kpis", prompt: "Our KPIs this month: revenue $82k (+12%), churn 2.1% (down 0.4 points), NPS 47 (+5). Summarize for the exec team.", ui: true, expect: ["metrics"] },
  { id: "article", prompt: "Write a short article on why engineering teams should write design docs.", ui: true, expect: ["article", "markdown"] },
  { id: "email", prompt: "Draft an email to my landlord asking them to fix the heating this week.", ui: true, expect: ["email"] },
  { id: "template", prompt: "Give me a reusable template for a weekly status update I can fill in.", ui: true, expect: ["template"] },
  { id: "clarify", prompt: "Help me plan a birthday party. Ask me what you need to know.", ui: true, expect: ["form"] },
  { id: "howto", prompt: "How do I set up SSH keys for GitHub on macOS?", ui: true, expect: ["list", "code"] },
  { id: "photos", prompt: "Show me a few photos of cozy, warm living rooms for inspiration.", ui: true, expect: ["gallery", "image", "cards"] },
  { id: "export", prompt: "Turn this into a CSV I can download: Ana Silva ana@example.com, Bo Chen bo@example.com, Cy Diaz cy@example.com", ui: true, expect: ["file", "table"] },
]

const enabled = process.env.FABLE_EVAL === "1"
const evalProvider = isProviderId(process.env.FABLE_UI_EVAL_PROVIDER) ? process.env.FABLE_UI_EVAL_PROVIDER : "openai"
const config = { provider: evalProvider, model: process.env.FABLE_UI_EVAL_MODEL || getProvider(evalProvider).defaultModel }
const configured = serverReadiness()[config.provider]
const limit = Math.min(Number(process.env.FABLE_UI_EVAL_MAX_PROMPTS) || CASES.length, CASES.length)

function blockTypes(spec: unknown): string[] {
  const parsed = FableSpecSchema.safeParse(spec)
  const blocks = parsed.success ? parsed.data.blocks : ((spec as { blocks?: { type?: string; blocks?: unknown[] }[] })?.blocks ?? [])
  return blocks.flatMap((block) => {
    const record = block as Record<string, unknown>
    const nested =
      record.type === "section"
        ? ((record.blocks as { type: string }[]) ?? [])
        : record.type === "columns"
          ? ((record.columns as { blocks: { type: string }[] }[]) ?? []).flatMap((column) => column.blocks ?? [])
          : record.type === "tabs"
            ? ((record.tabs as { blocks: { type: string }[] }[]) ?? []).flatMap((tab) => tab.blocks ?? [])
            : []
    return [String(record.type), ...nested.map((child) => String(child?.type))]
  })
}

function imageUrls(value: unknown): string[] {
  const found: string[] = []
  const walk = (node: unknown) => {
    if (Array.isArray(node)) node.forEach(walk)
    else if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) {
        if (key === "src" && typeof child === "string") found.push(child)
        else walk(child)
      }
    }
  }
  walk(value)
  return found
}

describe.runIf(enabled && configured)(`render_ui eval · ${config.provider}/${config.model}`, () => {
  const results: Record<string, unknown>[] = []

  it.each(CASES.slice(0, limit))("$id", async (testCase) => {
    const started = Date.now()
    const result = await generateText({
      model: createModel(config.provider, config.model),
      system: PLAYGROUND_SYSTEM,
      prompt: testCase.prompt,
      tools: playgroundTools,
      stopWhen: [hasToolCall(FABLE_TOOL_NAME), stepCountIs(4)],
      temperature: process.env.FABLE_UI_EVAL_TEMPERATURE ? Number(process.env.FABLE_UI_EVAL_TEMPERATURE) : undefined,
    })
    const calls = result.steps.flatMap((step) => step.toolCalls)
    const render = calls.find((call) => call.toolName === FABLE_TOOL_NAME)
    const searched = new Set(
      result.steps
        .flatMap((step) => step.toolResults)
        .filter((entry) => entry.toolName === "search_images")
        .flatMap((entry) => imageUrls(entry.output))
    )
    const spec = render?.input
    const issues = spec ? listIssues(resolveSpec(spec).items) : []
    const types = spec ? blockTypes(spec) : []
    const images = spec ? imageUrls(spec) : []

    const row = {
      id: testCase.id,
      usedUi: Boolean(render),
      uiChoiceCorrect: Boolean(render) === testCase.ui,
      valid: spec ? issues.length === 0 : null,
      strictSchema: spec ? FableSpecSchema.safeParse(spec).success : null,
      issues,
      expectedBlock: testCase.expect ? testCase.expect.some((type) => types.includes(type)) : null,
      blocks: types,
      imagesFromTool: images.every((url) => searched.has(url)),
      ms: Date.now() - started,
      inputTokens: result.totalUsage.inputTokens,
      outputTokens: result.totalUsage.outputTokens,
    }
    results.push(row)
    console.log(JSON.stringify(row))

    expect(row.uiChoiceCorrect).toBe(true)
    if (spec) {
      expect(row.valid, issues.join("; ")).toBe(true)
      expect(row.imagesFromTool).toBe(true)
    }
  }, 180_000)

  it("writes a report", () => {
    const score = (key: string) => {
      const relevant = results.filter((row) => row[key] !== null)
      return relevant.length ? relevant.filter((row) => row[key] === true).length / relevant.length : null
    }
    const report = {
      model: `${config.provider}/${config.model}`,
      date: new Date().toISOString(),
      cases: results.length,
      toolSchemaTokens: Math.round(JSON.stringify(z.toJSONSchema(createFableToolSchema())).length / 4),
      uiChoice: score("uiChoiceCorrect"),
      validity: score("valid"),
      strictSchema: score("strictSchema"),
      expectedBlock: score("expectedBlock"),
      imagesFromTool: score("imagesFromTool"),
      medianMs: results.map((row) => row.ms as number).sort((a, b) => a - b)[Math.floor(results.length / 2)],
      results,
    }
    mkdirSync("evals/results", { recursive: true })
    const file = join("evals/results", `${config.provider}-${config.model}-${report.date.slice(0, 10)}.json`)
    writeFileSync(file, JSON.stringify(report, null, 2))
    console.log(`\nReport: ${file}\n${JSON.stringify({ ...report, results: undefined }, null, 2)}`)
  })
})

describe.runIf(!enabled || !configured)("render_ui eval", () => {
  it.skip(`skipped — run \`pnpm eval\` with a key for ${config.provider}`, () => {})
})
