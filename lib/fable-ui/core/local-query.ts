import { getDataValue, normalizeDataValue } from "./format"
import type { DataColumn, DataQuery, DataQueryResult, DataRow } from "./types"

function matchesSearch(row: DataRow, query: string, columns?: DataColumn[]) {
  const keys = columns?.map((column) => column.key) ?? Object.keys(row)
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return keys.some((key) => normalizeDataValue(getDataValue(row, key)).toLowerCase().includes(normalizedQuery))
}

function matchesFilters(row: DataRow, filters: Record<string, unknown>) {
  return Object.entries(filters).every(([key, expected]) => {
    if (expected == null || expected === "" || (Array.isArray(expected) && expected.length === 0)) {
      return true
    }

    const value = getDataValue(row, key)

    if (Array.isArray(expected)) {
      return expected.map(String).includes(String(value))
    }

    if (typeof expected === "boolean") {
      return Boolean(value) === expected
    }

    return String(value).toLowerCase() === String(expected).toLowerCase()
  })
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  return normalizeDataValue(a).localeCompare(normalizeDataValue(b), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

export function queryLocalRows<Row extends DataRow>(
  rows: Row[],
  query: DataQuery = {},
  columns?: DataColumn[],
): DataQueryResult<Row> {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? (rows.length || 10)

  let nextRows = rows.filter((row) => matchesSearch(row, query.search ?? "", columns))
  nextRows = nextRows.filter((row) => matchesFilters(row, query.filters ?? {}))

  if (query.sort?.key) {
    const { key, direction } = query.sort
    nextRows = [...nextRows].sort((a, b) => {
      const result = compareValues(getDataValue(a, key), getDataValue(b, key))
      return direction === "desc" ? -result : result
    })
  }

  const totalRows = nextRows.length
  const start = (page - 1) * pageSize
  const pagedRows = nextRows.slice(start, start + pageSize)

  return {
    rows: pagedRows,
    totalRows,
    page,
    pageSize,
    nextCursor: start + pageSize < totalRows ? String(page + 1) : undefined,
    previousCursor: page > 1 ? String(page - 1) : undefined,
  }
}
