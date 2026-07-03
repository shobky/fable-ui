import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"

const nextConfig: NextConfig = {
    devIndicators: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
        ],
        qualities: [100, 75, 90]
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
