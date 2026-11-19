import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"
import path from "path"

const nextConfig: NextConfig = {
    devIndicators: false,
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
                destination: "/docs/blocks",
                permanent: true,
            },
            { source: "/chat", destination: "/playground", permanent: false },
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
