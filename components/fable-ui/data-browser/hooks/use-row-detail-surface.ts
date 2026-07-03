import * as React from "react"

import type { DataRow } from "@/lib/fable-ui/core"

export function useRowDetailSurface<Row extends DataRow>() {
  const [row, setRow] = React.useState<Row | null>(null)

  return {
    row,
    isOpen: Boolean(row),
    open: setRow,
    close: () => setRow(null),
  }
}
