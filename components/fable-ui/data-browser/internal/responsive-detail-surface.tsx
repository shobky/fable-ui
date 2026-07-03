import type { DataColumn, DataRow } from "@/lib/fable-ui/core"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import * as React from "react"
import type { DataBrowserRowAction } from "../data-browser.types"
import { RowDetail } from "./row-detail"

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener("change", update)

    return () => query.removeEventListener("change", update)
  }, [])

  return isMobile
}

export function ResponsiveDetailSurface<Row extends DataRow>({
  row,
  title,
  description,
  columns,
  actions,
  actionError,
  pendingActionId,
  renderDetail,
  onClose,
  onRunAction,
}: {
  row: Row | null
  title: string
  description?: string
  columns: DataColumn[]
  actions: DataBrowserRowAction<Row>[]
  actionError?: string | null
  pendingActionId?: string | null
  renderDetail?: (row: Row) => React.ReactNode
  onClose: () => void
  onRunAction: (action: DataBrowserRowAction<Row>, row: Row, values?: Record<string, unknown>) => void
}) {
  const isMobile = useIsMobile()
  const isOpen = Boolean(row)

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
            {row ? (
              <RowDetail
                row={row}
                columns={columns}
                actions={actions}
                actionError={actionError}
                pendingActionId={pendingActionId}
                renderDetail={renderDetail}
                onRunAction={onRunAction}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {row ? (
          <RowDetail
            row={row}
            columns={columns}
            actions={actions}
            actionError={actionError}
            pendingActionId={pendingActionId}
            renderDetail={renderDetail}
            onRunAction={onRunAction}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
