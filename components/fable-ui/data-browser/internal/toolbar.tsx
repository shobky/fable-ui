import { SearchIcon } from "lucide-react"

import type { DataFilter, DataSort, SortState } from "@/lib/fable-ui/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function getOptionValue(option: string | { value: string | number | boolean }) {
  return typeof option === "string" ? option : String(option.value)
}

function getOptionLabel(option: string | { label: string }) {
  return typeof option === "string" ? option : option.label
}

export function DataBrowserToolbar({
  search,
  searchPlaceholder,
  filters,
  filterValues,
  sortOptions,
  sort,
  isDisabled,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: {
  search: string
  searchPlaceholder: string
  filters: DataFilter[]
  filterValues: Record<string, unknown>
  sortOptions: DataSort[]
  sort?: SortState
  isDisabled?: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onSortChange: (sort?: SortState) => void
  onClearFilters: () => void
}) {
  const hasFilters = Object.values(filterValues).some((value) => value != null && value !== "")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder={searchPlaceholder}
            disabled={isDisabled}
            className="pl-9"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        {sortOptions.length > 0 ? (
          <Select
            value={sort ? `${sort.key}:${sort.direction}` : ""}
            disabled={isDisabled}
            onValueChange={(value) => {
              if (!value) {
                onSortChange(undefined)
                return
              }

              const [key, direction] = value.split(":")
              onSortChange({ key, direction: direction === "desc" ? "desc" : "asc" })
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortOptions.flatMap((option) =>
                  (option.directions ?? ["asc", "desc"]).map((direction) => (
                    <SelectItem key={`${option.key}:${direction}`} value={`${option.key}:${direction}`}>
                      {option.label} {direction === "asc" ? "asc" : "desc"}
                    </SelectItem>
                  )),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {filters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            if (filter.type === "select" && filter.options?.length) {
              return (
                <Select
                  key={filter.key}
                  value={String(filterValues[filter.key] ?? "")}
                  disabled={isDisabled}
                  onValueChange={(value) => onFilterChange(filter.key, value)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {filter.options.map((option) => (
                        <SelectItem key={getOptionValue(option)} value={getOptionValue(option)}>
                          {getOptionLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )
            }

            return (
              <Input
                key={filter.key}
                value={String(filterValues[filter.key] ?? "")}
                placeholder={filter.label}
                disabled={isDisabled}
                className="w-44"
                onChange={(event) => onFilterChange(filter.key, event.target.value)}
              />
            )
          })}
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" disabled={isDisabled} onClick={onClearFilters}>
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
