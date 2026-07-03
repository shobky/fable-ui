import { Button } from "@/components/ui/button"

export function PaginationFooter({
  page,
  pageSize,
  totalRows,
  hasNextPage,
  hasPreviousPage,
  isDisabled,
  onPageChange,
}: {
  page: number
  pageSize: number
  totalRows: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  isDisabled?: boolean
  onPageChange: (page: number) => void
}) {
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalRows)

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        {start}-{end} of {totalRows}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled || !hasPreviousPage}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled || !hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
