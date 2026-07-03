import { getDataValue, type DataColumn, type DataFilter, type DataRow, type DataSort } from "@/lib/fable-ui/core"

const fallbackFilterKeys = new Set(["status", "type", "category", "role"])

export function getFallbackFilters(rows: DataRow[], columns: DataColumn[]): DataFilter[] {
  return columns
    .filter((column) => column.filterable || fallbackFilterKeys.has(column.key))
    .map((column) => {
      const values = Array.from(
        new Set(
          rows
            .map((row) => getDataValue(row, column.key))
            .filter((value) => value != null && value !== "")
            .map(String),
        ),
      ).slice(0, 20)

      return {
        key: column.key,
        label: column.label,
        type: values.length > 0 ? "select" : "text",
        options: values,
      } satisfies DataFilter
    })
}

export function getFallbackSortOptions(columns: DataColumn[]): DataSort[] {
  return columns
    .filter((column) => column.sortable !== false)
    .map((column) => ({
      key: column.key,
      label: column.label,
      directions: ["asc", "desc"],
    }))
}
