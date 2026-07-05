"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type SuggestedAction = {
  label: string
  prompt: string
  description?: string
}

export type SuggestedActionsProps = {
  title: string
  description?: string
  actions: SuggestedAction[]
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  onAction?: (action: SuggestedAction) => void
}

export function SuggestedActions({
  title,
  description,
  actions,
  isLoading,
  isDisabled,
  error,
  onAction,
}: SuggestedActionsProps) {
  const areActionsDisabled = isDisabled || !onAction

  return (
    <Card className="w-full max-w-2xl" data-fable-ui="suggested-actions" aria-busy={isLoading || undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title || "Suggested actions"}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <Badge variant="secondary">safe prompts</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Preparing suggestions...</p>
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">{error.title}</p>
            {error.description ? <p className="text-sm text-muted-foreground">{error.description}</p> : null}
          </div>
        ) : actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No safe follow-up actions are available.</p>
        ) : (
          actions.map((action) => (
            <Button
              key={`${action.label}-${action.prompt}`}
              type="button"
              variant="outline"
              className="h-auto justify-start whitespace-normal px-3 py-2 text-left "
              disabled={areActionsDisabled}
              onClick={() => onAction?.(action)}
            >
              <span className="flex flex-col gap-1">
                <span>{action.label}</span>
                {action.description ? (
                  <span className="text-xs font-normal text-muted-foreground">{action.description}</span>
                ) : null}
              </span>
            </Button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
