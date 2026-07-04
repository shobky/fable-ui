import { promises as fs } from "fs"
import path from "path"

const allowedSourceRoots = new Set([
  "app",
  "components",
  "content",
  "examples",
  "hooks",
  "lib",
  "public",
])

export async function readFileFromRoot(relativePath: string) {
  const normalizedPath = relativePath.replaceAll("\\", "/")
  const pathParts = normalizedPath.split("/").filter(Boolean)
  const [sourceRoot, ...sourcePath] = pathParts

  if (
    !sourceRoot ||
    !allowedSourceRoots.has(sourceRoot) ||
    path.isAbsolute(relativePath) ||
    pathParts.includes("..")
  ) {
    throw new Error(`Unsupported source path: ${relativePath}`)
  }

  let absolutePath: string

  switch (sourceRoot) {
    case "app":
      absolutePath = path.join(process.cwd(), "app", ...sourcePath)
      break
    case "components":
      absolutePath = path.join(process.cwd(), "components", ...sourcePath)
      break
    case "content":
      absolutePath = path.join(process.cwd(), "content", ...sourcePath)
      break
    case "examples":
      absolutePath = path.join(process.cwd(), "examples", ...sourcePath)
      break
    case "hooks":
      absolutePath = path.join(process.cwd(), "hooks", ...sourcePath)
      break
    case "lib":
      absolutePath = path.join(process.cwd(), "lib", ...sourcePath)
      break
    case "public":
      absolutePath = path.join(process.cwd(), "public", ...sourcePath)
      break
    default:
      throw new Error(`Unsupported source path: ${relativePath}`)
  }

  return fs.readFile(absolutePath, "utf-8")
}
