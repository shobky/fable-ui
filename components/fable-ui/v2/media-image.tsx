import Image from "next/image"

import { isSafeLocalAssetPath } from "./asset-utils"

export interface FableMediaImageProps {
  src: string
  alt: string
  decorative?: boolean
  className?: string
}

export function FableMediaImage({
  src,
  alt,
  decorative = false,
  className,
}: FableMediaImageProps) {
  if (!isSafeLocalAssetPath(src)) {
    return (
      <div
        role="status"
        className={className ?? "grid aspect-[16/9] min-w-0 place-items-center rounded-xl bg-muted text-sm text-muted-foreground"}
      >
        Image unavailable
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={decorative ? "" : alt}
      width={1280}
      height={720}
      unoptimized
      className={className ?? "h-auto w-full rounded-xl object-cover"}
    />
  )
}
