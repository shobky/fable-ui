// Runs the live model eval. Usage:
//   pnpm eval                       (uses FABLE_UI_EVAL_PROVIDER / FABLE_UI_EVAL_MODEL from .env)
//   pnpm eval openai gpt-6.1-sol    (override provider and model)
import { spawnSync } from "node:child_process"

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {}
}

const [provider, model] = process.argv.slice(2)
const env = { ...process.env, FABLE_EVAL: "1" }
if (provider) env.FABLE_UI_EVAL_PROVIDER = provider
if (model) env.FABLE_UI_EVAL_MODEL = model

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "vitest", "run", "evals", "--reporter=verbose", "--pool=threads", "--maxWorkers=4"],
  { stdio: "inherit", env, shell: process.platform === "win32" }
)
process.exit(result.status ?? 1)
