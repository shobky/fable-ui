import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export function HugeIcon({ strokeWidth = 2, className, ...props }: HugeiconsIconProps) {
  return (
    <HugeiconsIcon
      strokeWidth={strokeWidth}
      className={cn("size-4 shrink-0", className)}
      {...props}
    />
  );
}
