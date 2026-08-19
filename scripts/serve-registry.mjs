import http from "node:http"
import fs from "node:fs"
import path from "node:path"

const [registryDirectory, readyFile, mode] = process.argv.slice(2)
const rewriteHostedDependencies = mode === "--rewrite-hosted-dependencies"

if (!registryDirectory || !readyFile) {
  throw new Error(
    "Usage: serve-registry.mjs <registry-directory> <ready-file> [--rewrite-hosted-dependencies]"
  )
}

if (mode && !rewriteHostedDependencies) {
  throw new Error(`Unknown option: ${mode}`)
}

const registryRoot = fs.realpathSync(registryDirectory)
const readyPath = path.resolve(readyFile)

if (!fs.statSync(registryRoot).isDirectory()) {
  throw new Error(`Registry directory is not a directory: ${registryRoot}`)
}

const server = http.createServer((request, response) => {
  const match = new URL(request.url ?? "/", "http://127.0.0.1").pathname.match(
    /^\/r\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/
  )

  if (!match || request.method !== "GET") {
    response.writeHead(404)
    response.end()
    return
  }

  const artifactPath = path.join(registryRoot, "r", `${match[1]}.json`)

  if (!fs.existsSync(artifactPath) || !fs.statSync(artifactPath).isFile()) {
    response.writeHead(404)
    response.end()
    return
  }

  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  }

  if (!rewriteHostedDependencies) {
    response.writeHead(200, headers)
    fs.createReadStream(artifactPath).pipe(response)
    return
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
  const address = server.address()

  if (!address || typeof address === "string") {
    response.writeHead(503)
    response.end()
    return
  }

  if (Array.isArray(artifact.registryDependencies)) {
    artifact.registryDependencies = artifact.registryDependencies.map(
      (dependency) => {
        const dependencyMatch = dependency.match(
          /^https:\/\/fable-ui\.shobky\.com\/r\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/
        )

        return dependencyMatch
          ? `http://127.0.0.1:${address.port}/r/${dependencyMatch[1]}.json`
          : dependency
      }
    )
  }

  response.writeHead(200, headers)
  response.end(`${JSON.stringify(artifact)}\n`)
})

server.listen(0, "127.0.0.1", () => {
  const address = server.address()

  if (!address || typeof address === "string") {
    throw new Error("Loopback registry server did not provide a TCP address.")
  }

  fs.mkdirSync(path.dirname(readyPath), { recursive: true })
  fs.writeFileSync(
    readyPath,
    `${JSON.stringify({ baseUrl: `http://127.0.0.1:${address.port}` })}\n`
  )
})

function stop() {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1_000).unref()
}

process.once("SIGINT", stop)
process.once("SIGTERM", stop)
