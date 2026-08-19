import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const skillRoot = path.join(repositoryRoot, ".agents", "skills", "fable-ui")
const archivePath = path.join(
  repositoryRoot,
  "public",
  "skills",
  "fable-ui.skill"
)
const FIXED_DOS_DATE = 0x0021 // 1980-01-01

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1)
    value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
  return value >>> 0
})

function crc32(buffer) {
  let value = 0xffffffff
  for (const byte of buffer)
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

function u16(value) {
  const buffer = Buffer.allocUnsafe(2)
  buffer.writeUInt16LE(value, 0)
  return buffer
}

function u32(value) {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeUInt32LE(value >>> 0, 0)
  return buffer
}

function listFiles(root) {
  const files = []
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isSymbolicLink())
        throw new Error(`Refusing symlinked skill entry: ${absolute}`)
      if (entry.isDirectory()) visit(absolute)
      else if (entry.isFile()) files.push(absolute)
      else throw new Error(`Refusing non-file skill entry: ${absolute}`)
    }
  }
  visit(root)
  return files.sort((left, right) => left.localeCompare(right, "en"))
}

function localHeader(name, crc, size) {
  return Buffer.concat([
    u32(0x04034b50),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(FIXED_DOS_DATE),
    u32(crc),
    u32(size),
    u32(size),
    u16(name.length),
    u16(0),
    name,
  ])
}

function centralHeader(name, crc, size, offset) {
  return Buffer.concat([
    u32(0x02014b50),
    u16(0x0314),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(FIXED_DOS_DATE),
    u32(crc),
    u32(size),
    u32(size),
    u16(name.length),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(0),
    u32(offset),
    name,
  ])
}

function buildArchive() {
  if (!fs.existsSync(skillRoot))
    throw new Error(`Missing skill source: ${skillRoot}`)
  const entries = listFiles(skillRoot).map((absolute) => {
    const relative = path
      .relative(skillRoot, absolute)
      .split(path.sep)
      .join("/")
    const name = Buffer.from(`fable-ui/${relative}`, "utf8")
    const content = fs.readFileSync(absolute)
    if (content.length > 0xffffffff)
      throw new Error(`File is too large for ZIP32: ${relative}`)
    return { name, content, crc: crc32(content) }
  })
  if (
    !entries.some(
      (entry) => entry.name.toString("utf8") === "fable-ui/SKILL.md"
    )
  )
    throw new Error("Skill archive must include SKILL.md")
  const locals = []
  const central = []
  let offset = 0
  for (const entry of entries) {
    const local = localHeader(entry.name, entry.crc, entry.content.length)
    locals.push(local, entry.content)
    central.push(
      centralHeader(entry.name, entry.crc, entry.content.length, offset)
    )
    offset += local.length + entry.content.length
  }
  const centralDirectory = Buffer.concat(central)
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ])
  return {
    buffer: Buffer.concat([...locals, centralDirectory, end]),
    entries: entries.map((entry) => entry.name.toString("utf8")),
  }
}

function parseArgs(argv) {
  const flags = new Set(argv)
  for (const flag of flags)
    if (!["--replace", "--check", "--dry-run"].includes(flag))
      throw new Error(`Unknown argument: ${flag}`)
  if (flags.has("--replace") && flags.has("--check"))
    throw new Error("Use either --replace or --check, not both")
  if (flags.has("--replace") && flags.has("--dry-run"))
    throw new Error("--replace cannot be combined with --dry-run")
  return {
    replace: flags.has("--replace"),
    check: flags.has("--check"),
    dryRun: flags.has("--dry-run"),
  }
}

try {
  const options = parseArgs(process.argv.slice(2))
  const archive = buildArchive()
  const digest = crypto
    .createHash("sha256")
    .update(archive.buffer)
    .digest("hex")
  if (options.check) {
    if (!fs.existsSync(archivePath))
      throw new Error(`Archive is missing: ${archivePath}`)
    if (!fs.readFileSync(archivePath).equals(archive.buffer))
      throw new Error("Archive is stale; rebuild with --replace")
    process.stdout.write(`fable-ui.skill is fresh (${digest})\n`)
  } else if (options.dryRun) {
    process.stdout.write(
      `Would write ${archive.entries.length} deterministic entries (${archive.buffer.length} bytes, ${digest})\n`
    )
  } else {
    if (fs.existsSync(archivePath) && !options.replace)
      throw new Error(
        "Refusing to overwrite fable-ui.skill; pass --replace after reviewing the change"
      )
    fs.mkdirSync(path.dirname(archivePath), { recursive: true })
    fs.writeFileSync(archivePath, archive.buffer, { flag: "w" })
    process.stdout.write(
      `Wrote ${archivePath} (${archive.entries.length} entries, ${digest})\n`
    )
  }
} catch (error) {
  process.stderr.write(`build-agent-skill: ${error.message}\n`)
  process.exitCode = 1
}
