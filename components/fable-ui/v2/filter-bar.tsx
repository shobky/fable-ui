import { useId } from "react"

import { cn } from "@/lib/utils"

export interface FableFilterOption {
  label: string
  value: string
}

export interface FableFilterBarProps {
  label: string
  value: string
  options: FableFilterOption[]
  onValueChange: (value: string) => void
  className?: string
}

export function FableFilterBar({
  label,
  value,
  options,
  onValueChange,
  className,
}: FableFilterBarProps) {
  const selectId = useId()

  return (
    <div className={cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <label htmlFor={selectId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        className="h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:min-w-44"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
