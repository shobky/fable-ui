export function InlineError({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
      <p className="text-sm font-medium text-destructive">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
