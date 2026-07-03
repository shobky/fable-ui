import type { DataColumn, DataRow } from "./types"

export function getDataValue(row: DataRow, key: string): unknown {
  const cells = row.cells

  if (cells && typeof cells === "object" && key in cells) {
    return (cells as Record<string, unknown>)[key]
  }

  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part]
    }

    return undefined
  }, row)
}

export function normalizeDataValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value == null) {
    return ""
  }

  return String(value)
}

export function formatDataCell(row: DataRow, column: DataColumn) {
  const value = getDataValue(row, column.key)

  if (value == null) {
    return ""
  }

  if (column.type === "date" || column.type === "datetime") {
    const date = value instanceof Date ? value : new Date(String(value))

    if (!Number.isNaN(date.getTime())) {
      return column.type === "date" ? date.toLocaleDateString() : date.toLocaleString()
    }
  }

  return normalizeDataValue(value)
}

export function getRowId(row: DataRow) {
  const id = row.id ?? row._id ?? row.uid ?? row.orderId ?? row.order
  return id == null ? null : String(id)
}
