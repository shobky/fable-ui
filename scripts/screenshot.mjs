// Captures playground screenshots with headless Chrome or Edge.
// Usage: node scripts/screenshot.mjs <base-url> <out-dir> [scenario...]
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"

const [base = "http://localhost:3002", out = "screenshots", ...ids] = process.argv.slice(2)
const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean)
const browser = browsers.find((path) => existsSync(path))
if (!browser) throw new Error("No Chrome or Edge found. Set CHROME_PATH.")

mkdirSync(out, { recursive: true })
const shots = ids.length ? ids : ["dashboard"]
for (const entry of shots) {
  const [id, width = "1280", height = "2200", query = ""] = entry.split(":")
  const name = id.startsWith("/") ? `page${id.replace(/[^a-z0-9]+/gi, "-")}` : id
  const file = resolve(join(out, `${name}-${width}${query ? "-" + query.replace(/[^a-z0-9]+/gi, "-") : ""}.png`))
  const url = id.startsWith("/") ? `${base}${id}` : `${base}/playground?run=${id}&speed=8${query ? "&" + query : ""}`
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=20000",
    `--screenshot=${file}`,
    url,
  ], { stdio: "ignore", timeout: 90_000 })
  console.log(file)
}
