import { cn } from "@/lib/utils"

/** Cursor F: a caret, a streamed line, and the component it becomes. */
export function FableMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect x="10" y="6" width="8" height="52" rx="4" fill="currentColor" />
      <rect x="23" y="6" width="31" height="7" rx="3.5" fill="currentColor" />
      <rect x="23" y="20" width="21" height="15" rx="5.5" fill="#E8552E" />
    </svg>
  )
}

export function FableLogo({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 text-foreground",
        className
      )}
      {...props}
    >
      <span className="text-[23px] leading-none font-semibold tracking-[-0.055em]">
        fable<span className="ms-1 font-normal text-muted-foreground">ui</span>
      </span>
    </span>
  )
}
