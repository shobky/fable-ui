import type { NextConfig } from "next"
import path from "path"
import { createMDX } from "fumadocs-mdx/next"

const nextConfig: NextConfig = {
    devIndicators: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    outputFileTracingIncludes: {
        "/*": ["./registry/**/*", "./styles/**/*"],
    },
    images: {
        remotePatterns: [
        ],
    },
    turbopack: {
        root: path.resolve(import.meta.dirname, "../.."),
    },
    redirects() {
        return []
    },
    rewrites() {
        return [
        ]
    },
}
const withMDX = createMDX({})
export default withMDX(nextConfig)
