"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type FormCardField =
  | { name: string; label: string; type: "text" | "date" | "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "number"; required?: boolean; placeholder?: string; min?: number; max?: number }
  | { name: string; label: string; type: "select"; required?: boolean; options: { label: string; value: string }[] }
  | { name: string; label: string; type: "toggle"; required?: boolean }

export type FormCardProps = {
  title: string
  description?: string
  submitLabel?: string
  fields: FormCardField[]
  isLoading?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  onSubmit?: (values: Record<string, string | number | boolean>) => void
}

export function FormCard({
  title,
  description,
  submitLabel = "Submit",
  fields,
  isLoading,
  isDisabled,
  error,
  onSubmit,
}: FormCardProps) {
  const initialValues = useMemo(() => {
    return Object.fromEntries(fields.map((field) => [field.name, field.type === "toggle" ? false : ""]))
  }, [fields])
  const [values, setValues] = useState<Record<string, string | number | boolean>>(initialValues)

  function setValue(name: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  return (
    <Card className="w-full max-w-2xl" data-fable-ui="form-card" aria-busy={isLoading || undefined}>
      <CardHeader>
        <CardTitle className="text-base">{title || "Collect input"}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Preparing form...</p> : null}
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">{error.title}</p>
            {error.description ? <p className="text-sm text-muted-foreground">{error.description}</p> : null}
          </div>
        ) : null}
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit?.(values)
          }}
        >
          {fields.map((field) => {
            const value = values[field.name]

            return (
              <label key={field.name} className="flex flex-col gap-2 text-sm font-medium">
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <Textarea
                    value={String(value ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={isDisabled}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    value={String(value ?? "")}
                    required={field.required}
                    disabled={isDisabled}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "toggle" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={isDisabled}
                    onChange={(event) => setValue(field.name, event.target.checked)}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={String(value ?? "")}
                    min={field.type === "number" ? field.min : undefined}
                    max={field.type === "number" ? field.max : undefined}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={isDisabled}
                    onChange={(event) =>
                      setValue(
                        field.name,
                        field.type === "number" ? Number(event.target.value) : event.target.value,
                      )
                    }
                  />
                )}
              </label>
            )
          })}
          <CardFooter className="px-0 pb-0">
            <Button type="submit" disabled={isDisabled || fields.length === 0}>
              {submitLabel}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
