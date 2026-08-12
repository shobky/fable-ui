"use client"

import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ConfirmationVariant = "default" | "warning" | "destructive"

export type ConfirmationCardProps = {
  id: string
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmationVariant
  details?: string[]
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  onConfirm?: (confirmation: { id: string; label: string }) => void
  onCancel?: (confirmation: { id: string; label: string }) => void
}

export function ConfirmationCard({
  id,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  details = [],
  isLoading,
  isDisabled,
  error,
  onConfirm,
  onCancel,
}: ConfirmationCardProps) {
  const isDestructive = variant === "destructive"
  const actionClaimedIdRef = useRef<string | null>(null)
  const [claimedActionId, setClaimedActionId] = useState<string | null>(null)
  const actionsBlocked = Boolean(isLoading || isDisabled || error || claimedActionId === id)

  function claimAction(
    handler: ConfirmationCardProps["onConfirm"] | ConfirmationCardProps["onCancel"],
    label: string,
  ) {
    if (!handler || actionsBlocked || actionClaimedIdRef.current === id) {
      return
    }

    actionClaimedIdRef.current = id
    setClaimedActionId(id)
    handler({ id, label })
  }

  return (
    <Card className="w-full max-w-xl" data-fable-ui="confirmation-card" aria-busy={isLoading || undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title || "Confirm action"}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={isDestructive ? "destructive" : "secondary"}>{variant}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Preparing confirmation...
          </p>
        ) : null}
        {error ? (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">{error.title}</p>
            {error.description ? <p className="text-sm text-muted-foreground">{error.description}</p> : null}
          </div>
        ) : null}
        {details.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {details.map((detail) => (
              <li key={detail} className="rounded-md bg-muted px-3 py-2">
                {detail}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={actionsBlocked || !onCancel}
          onClick={() => claimAction(onCancel, cancelLabel)}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={isDestructive ? "destructive" : "default"}
          className={cn(variant === "warning" && "bg-primary text-primary-foreground")}
          disabled={actionsBlocked || !onConfirm}
          onClick={() => claimAction(onConfirm, confirmLabel)}
        >
          {confirmLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
