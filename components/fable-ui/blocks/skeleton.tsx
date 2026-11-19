import { cn } from "@/lib/utils"

import { surface } from "./shared"

function Bar({ className }: { className?: string }) {
  return <span className={cn("block rounded-full bg-muted motion-safe:animate-pulse", className)} />
}

const lines = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <Bar key={index} className={cn("h-3", index === count - 1 ? "w-3/5" : index % 2 ? "w-11/12" : "w-full")} />
  ))

/**
 * Placeholders shaped like the block that is still streaming, sized to its
 * usual footprint so the answer does not jump when the block lands.
 */
export function BlockSkeleton({ type }: { type?: string }) {
  const frame = cn(surface, "p-4 @lg:p-5")
  let body: React.ReactNode

  switch (type) {
    case "image":
      body = <span className="block aspect-[16/9] rounded-xl bg-muted motion-safe:animate-pulse" />
      break
    case "gallery":
      body = (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="aspect-square rounded-lg bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      )
      break
    case "hero":
      body = <span className="block h-80 rounded-2xl bg-muted motion-safe:animate-pulse" />
      break
    case "chart":
      body = (
        <div className={frame}>
          <Bar className="mb-5 h-3.5 w-40" />
          <div className="flex h-56 items-end gap-3">
            {[40, 65, 52, 80, 58, 90, 70].map((height, index) => (
              <span key={index} className="flex-1 rounded-t-md bg-muted motion-safe:animate-pulse" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      )
      break
    case "form":
    case "email":
    case "template":
      body = (
        <div className={cn(frame, "space-y-4")}>
          <Bar className="h-3.5 w-48" />
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <Bar className="h-2.5 w-24" />
              <span className="block h-8 rounded-2xl bg-muted motion-safe:animate-pulse" />
            </div>
          ))}
          <span className="block h-24 rounded-2xl bg-muted motion-safe:animate-pulse" />
        </div>
      )
      break
    case "cards":
      body = (
        <div className="grid gap-3 @lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className={cn(surface, "space-y-3 p-1.5 pb-4")}>
              <span className="block aspect-[4/3] rounded-lg bg-muted motion-safe:animate-pulse" />
              <div className="space-y-2 px-2.5">{lines(2)}</div>
            </div>
          ))}
        </div>
      )
      break
    case "metrics":
      body = (
        <div className={cn(surface, "grid grid-cols-2 gap-4 p-5 @lg:grid-cols-4")}>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="space-y-2.5">
              <Bar className="h-2.5 w-16" />
              <Bar className="h-6 w-24" />
            </div>
          ))}
        </div>
      )
      break
    case "table":
      body = (
        <div className={cn(surface, "space-y-3 p-4")}>
          <Bar className="h-3.5 w-40" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex gap-4">
              <Bar className="h-3 flex-[2]" />
              <Bar className="h-3 flex-1" />
              <Bar className="h-3 flex-1" />
            </div>
          ))}
        </div>
      )
      break
    case "actions":
      body = (
        <div className="flex gap-2">
          <span className="h-8 w-28 rounded-2xl bg-muted motion-safe:animate-pulse" />
          <span className="h-8 w-24 rounded-2xl bg-muted motion-safe:animate-pulse" />
        </div>
      )
      break
    case "file":
      body = <span className="block h-16 rounded-xl bg-muted motion-safe:animate-pulse" />
      break
    default:
      body = <div className="space-y-2.5 py-1">{lines(3)}</div>
  }

  return (
    <div role="status" aria-label="Loading" data-fable-skeleton={type ?? "block"}>
      {body}
    </div>
  )
}
