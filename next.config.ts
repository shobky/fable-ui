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
        qualities: [100, 75, 90]
    },
    turbopack: {
        root: path.resolve(import.meta.dirname, "../.."),
    },
    redirects() {
        return [
            {
                source: "/components",
                destination: "/docs/components/metric-card",
                permanent: true,
            },
            {
                source: "/docs",
                destination: "/docs/introduction",
                permanent: true,
            },
        ]
    },
    rewrites() {
        return [
        ]
    },
}
const withMDX = createMDX({})
export default withMDX(nextConfig)
