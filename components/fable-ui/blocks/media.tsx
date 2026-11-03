"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, ImageOffIcon, ShieldAlertIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { useFable } from "../provider"
import { decideImage } from "../safety"
import type { BlockOf, FableImage } from "../schema"
import { BlockHeader, imageOutline } from "./shared"

const aspects = {
  auto: "",
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/9]",
} as const

type Aspect = keyof typeof aspects

const approvedHosts = new Set<string>()

/**
 * Every model-provided image goes through here. Allowed hosts load lazily
 * with no referrer; other https hosts wait for the user; anything else
 * never loads.
 */
export function FableImg({
  image,
  aspect = "landscape",
  className,
  rounded = "rounded-lg",
  priority,
}: {
  image: FableImage
  aspect?: Aspect
  className?: string
  rounded?: string
  priority?: boolean
}) {
  const { images } = useFable()
  const decision = decideImage(image.src, images)
  const [approved, setApproved] = React.useState(() => decision.status === "ask" && approvedHosts.has(decision.host))
  const [state, setState] = React.useState<"loading" | "loaded" | "error">("loading")

  const frame = cn("relative overflow-hidden bg-muted", rounded, aspects[aspect], aspect === "auto" && "min-h-40", className)

  if (decision.status === "blocked" || state === "error") {
    return (
      <div className={cn(frame, "grid place-items-center")} role="img" aria-label={image.alt || "Image unavailable"}>
        <div className="flex flex-col items-center gap-1.5 px-4 text-center text-xs text-muted-foreground">
          <ImageOffIcon className="size-5 opacity-60" aria-hidden />
          <span className="line-clamp-2">{image.alt || "Image unavailable"}</span>
        </div>
      </div>
    )
  }

  if (decision.status === "ask" && !approved) {
    return (
      <div className={cn(frame, "grid place-items-center")}>
        <div className="flex max-w-60 flex-col items-center gap-2 px-4 text-center">
          <ShieldAlertIcon className="size-5 text-muted-foreground" aria-hidden />
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {image.alt ? `“${image.alt}” from ` : "Image from "}
            <span className="font-medium text-foreground">{decision.host}</span>
          </p>
          <Button
            size="xs"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              approvedHosts.add(decision.host)
              setApproved(true)
            }}
          >
            Load image
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={frame}>
      {state === "loading" ? <div className="absolute inset-0 animate-pulse bg-muted motion-reduce:animate-none" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- remote, policy-checked, model-provided URL */}
      <img
        src={decision.src}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          aspect === "auto" && "h-auto",
          state === "loaded" ? "opacity-100" : "opacity-0"
        )}
      />
      <span aria-hidden className={cn("pointer-events-none absolute inset-0", rounded, imageOutline)} />
    </div>
  )
}

function Caption({ image }: { image: FableImage }) {
  if (!image.caption && !image.credit) return null
  return (
    <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {image.caption ? <span className="text-pretty">{image.caption}</span> : null}
      {image.credit ? <span className="opacity-80">{image.credit}</span> : null}
    </figcaption>
  )
}

export function ImageBlock({ block }: { block: BlockOf<"image"> }) {
  return (
    <figure>
      <FableImg image={block.image} aspect={block.aspect ?? "wide"} rounded="rounded-xl" />
      <Caption image={block.image} />
    </figure>
  )
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: FableImage[]
  index: number | null
  onIndex: (index: number) => void
  onClose: () => void
}) {
  const image = index === null ? null : images[index]
  const go = (step: number) => index !== null && onIndex((index + step + images.length) % images.length)
  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(64rem,calc(100vw-2rem))] gap-0 overflow-hidden bg-background p-0 @lg:max-w-[min(64rem,calc(100vw-2rem))]"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") go(1)
          if (event.key === "ArrowLeft") go(-1)
        }}
      >
        {image ? (
          <>
            <div className="relative bg-muted">
              <FableImg image={image} aspect="auto" rounded="rounded-none" className="max-h-[75vh] [&_img]:max-h-[75vh] [&_img]:object-contain" priority />
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute end-3 top-3 bg-background/80 backdrop-blur"
                onClick={onClose}
                aria-label="Close"
              >
                <XIcon />
              </Button>
              {images.length > 1 ? (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute start-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rtl:rotate-180"
                    onClick={() => go(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute end-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rtl:rotate-180"
                    onClick={() => go(1)}
                    aria-label="Next image"
                  >
                    <ChevronRightIcon />
                  </Button>
                </>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <DialogTitle className="text-sm font-medium">{image.caption ?? image.alt ?? "Image"}</DialogTitle>
                <DialogDescription className="text-xs">{image.credit ?? image.alt}</DialogDescription>
              </div>
              {images.length > 1 ? (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {(index ?? 0) + 1} / {images.length}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Tile({
  image,
  aspect,
  onOpen,
  className,
}: {
  image: FableImage
  aspect: Aspect
  onOpen: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${image.alt || "image"}`}
      className={cn(
        "group/tile relative block w-full overflow-hidden rounded-lg text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <FableImg
        image={image}
        aspect={aspect}
        className="h-full [&_img]:transition-[opacity,scale] [&_img]:duration-500 group-hover/tile:[&_img]:scale-[1.03]"
      />
      {image.caption ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-2.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100">
          {image.caption}
        </span>
      ) : null}
    </button>
  )
}

export function GalleryBlock({ block }: { block: BlockOf<"gallery"> }) {
  const [open, setOpen] = React.useState<number | null>(null)
  const images = block.images
  const scroller = React.useRef<HTMLDivElement>(null)

  let body: React.ReactNode
  if (block.layout === "featured" && images.length >= 3) {
    const [first, ...rest] = images
    const side = rest.slice(0, 4)
    const grid = side.length === 4
    body = (
      <div className="grid gap-2 @lg:grid-cols-[1.5fr_1fr]">
        <Tile image={first} aspect="landscape" onOpen={() => setOpen(0)} className="@lg:h-full @lg:[&>div]:aspect-auto @lg:[&>div]:h-full" />
        <div className={cn("grid gap-2", grid ? "grid-cols-2" : "grid-cols-2 @lg:grid-cols-1")}>
          {side.map((image, index) => (
            <Tile
              key={index}
              image={image}
              aspect={grid ? "square" : "landscape"}
              onOpen={() => setOpen(index + 1)}
              className={cn(!grid && side.length === 3 && index === 2 && "col-span-2 @lg:col-span-1")}
            />
          ))}
        </div>
      </div>
    )
  } else if (block.layout === "masonry") {
    const pattern: Aspect[] = ["portrait", "square", "landscape", "square", "portrait", "landscape"]
    body = (
      <div className="columns-2 gap-2 @lg:columns-3 [&>*]:mb-2">
        {images.map((image, index) => (
          <Tile key={index} image={image} aspect={pattern[index % pattern.length]} onOpen={() => setOpen(index)} className="break-inside-avoid" />
        ))}
      </div>
    )
  } else if (block.layout === "carousel") {
    const scrollBy = (direction: number) => {
      const node = scroller.current
      if (!node) return
      const rtl = getComputedStyle(node).direction === "rtl"
      node.scrollBy({ left: node.clientWidth * 0.8 * direction * (rtl ? -1 : 1), behavior: "smooth" })
    }
    body = (
      <div className="relative">
        <div
          ref={scroller}
          className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <Tile key={index} image={image} aspect="portrait" onOpen={() => setOpen(index)} className="w-[62%] shrink-0 snap-start @lg:w-[38%]" />
          ))}
        </div>
        {images.length > 2 ? (
          <div className="mt-2 flex justify-end gap-1">
            <Button size="icon-sm" variant="outline" onClick={() => scrollBy(-1)} aria-label="Scroll back" className="rtl:rotate-180">
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" onClick={() => scrollBy(1)} aria-label="Scroll forward" className="rtl:rotate-180">
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </div>
    )
  } else {
    const columns = images.length === 1 ? "grid-cols-1" : images.length === 2 || images.length === 4 ? "grid-cols-2" : "grid-cols-2 @lg:grid-cols-3"
    body = (
      <div className={cn("grid gap-2", columns)}>
        {images.map((image, index) => (
          <Tile key={index} image={image} aspect={images.length === 1 ? "wide" : "square"} onOpen={() => setOpen(index)} />
        ))}
      </div>
    )
  }

  return (
    <section aria-label={block.title ?? "Image gallery"} className="space-y-3">
      <BlockHeader title={block.title} />
      {body}
      <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </section>
  )
}
