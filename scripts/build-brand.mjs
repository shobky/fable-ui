// Exact vector geometry from the supplied Fable UI Logo Direction document.
// Run with `node scripts/build-brand.mjs`; sharp ships with Next.js.
import { createRequire } from "node:module"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve("next/package.json"))
const sharp = nextRequire("sharp")
const ink = "#17151C", paper = "#F4F1EA", ember = "#E8552E", stone = "#8A8590"
const mark = (color = ink, chip = ember) => `<rect x="10" y="6" width="8" height="52" rx="4" fill="${color}"/><rect x="23" y="6" width="31" height="7" rx="3.5" fill="${color}"/><rect x="23" y="20" width="21" height="15" rx="5.5" fill="${chip}"/>`
const svg = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`
async function save(path, data) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, data) }
async function png(path, source, size) { await save(path, await sharp(Buffer.from(source)).resize(size).png().toBuffer()) }
for (const [name, color] of [["mark", ink], ["mark-reversed", paper], ["mark-mono", ink]]) {
  await save(`public/brand/${name}.svg`, svg(64, 64, mark(color, name === "mark-mono" ? ink : ember)))
}
for (const [name, color] of [["logo", ink], ["logo-reversed", paper]]) {
  await save(`public/brand/${name}.svg`, svg(320, 80, `<g transform="translate(0 8)">${mark(color)}</g><text x="82" y="57" font-family="Geist,Arial,sans-serif" font-size="54" font-weight="600" letter-spacing="-3" fill="${color}">fable<tspan dx="9" font-weight="400" fill="${stone}">ui</tspan></text>`))
}
const icon = svg(512, 512, `<rect width="512" height="512" rx="112" fill="${ink}"/><g transform="translate(64 64) scale(6)">${mark(paper)}</g>`)
await save("public/brand/app-icon.svg", icon)
await save("app/icon.svg", svg(64, 64, `<rect width="64" height="64" rx="14" fill="${ink}"/><g transform="translate(8 8) scale(.75)">${mark(paper)}</g>`))
for (const size of [16, 32, 48, 180, 192, 512]) await png(`public/brand/icon-${size}.png`, icon, size)
await png("app/apple-icon.png", icon, 180)
const favicon = await sharp(Buffer.from(icon)).resize(32).png().toBuffer()
const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico[6] = 32; ico[7] = 32; ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(favicon.length, 14); ico.writeUInt32LE(22, 18)
await save("app/favicon.ico", Buffer.concat([ico, favicon]))
const social = (subtitle, square = false) => {
  const w = square ? 1080 : 1200, h = square ? 1080 : 630
  return svg(w, h, `<rect width="${w}" height="${h}" fill="${paper}"/><rect x="${w - 280}" width="280" height="${h}" fill="${ink}"/><g transform="translate(65 58) scale(.8)">${mark()}</g><text x="130" y="101" font-family="Geist,Arial,sans-serif" font-size="42" font-weight="600" letter-spacing="-2" fill="${ink}">fable<tspan dx="8" font-weight="400" fill="${stone}">ui</tspan></text><text x="68" y="${square ? 420 : 285}" font-family="Geist,Arial,sans-serif" font-size="${square ? 76 : 82}" font-weight="600" letter-spacing="-4" fill="${ink}">Your agent’s</text><text x="68" y="${square ? 510 : 380}" font-family="Geist,Arial,sans-serif" font-size="${square ? 76 : 82}" font-weight="600" letter-spacing="-4" fill="${ink}">answers, designed.</text><text x="72" y="${h - 75}" font-family="Geist Mono,Consolas,monospace" font-size="20" fill="#6B6670">${subtitle}</text><g transform="translate(${w - 230} ${h / 2 - 110}) scale(3.2)">${mark(paper)}</g>`)
}
for (const [name, subtitle, square] of [["og", "Generative UI for AI agents", false], ["thumbnail", "24 blocks / 3 layouts / 6 themes", false], ["social-square", "fable-ui.shobky.com", true], ["playground", "The playground / prompt. stream. interact.", false]]) {
  const source = social(subtitle, square)
  await save(`public/brand/${name}.svg`, source)
  await png(`public/brand/${name}.png`, source)
}
await save("public/manifest.webmanifest", JSON.stringify({ name: "Fable UI", short_name: "fable ui", description: "Generative UI for AI agents", start_url: "/", display: "standalone", background_color: paper, theme_color: ink, icons: [192, 512].map(size => ({ src: `/brand/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any" })) }, null, 2) + "\n")
console.log("Built Fable UI logos, icons, thumbnails, and social images.")
