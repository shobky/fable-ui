export function isSafeLocalAssetPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    !/[?#:]/.test(value) &&
    /^\/[A-Za-z0-9_./-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value)
  )
}
