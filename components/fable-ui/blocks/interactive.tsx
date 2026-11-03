"use client"

import * as React from "react"
import { CheckCircle2Icon, MailIcon, PencilIcon, RotateCcwIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useFable, useFableState } from "../provider"
import type { BlockOf } from "../schema"
import { ActionButton } from "./actions"
import { BlockHeader, CopyAction, IconAction, surface } from "./shared"

type FieldValue = string | boolean
type Field = BlockOf<"form">["fields"][number]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function initialValue(field: Field): FieldValue {
  if (field.type === "checkbox" || field.type === "toggle") return field.defaultValue === true
  if (field.defaultValue === undefined || typeof field.defaultValue === "boolean") return ""
  return String(field.defaultValue)
}

function describeValue(field: Field, value: FieldValue) {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return value.trim() || "—"
}

/**
 * A form is how the model asks a clarifying question without a back-and-
 * forth. Submitting sends the answers as the user's next message.
 */
export function FormBlock({ block }: { block: BlockOf<"form"> }) {
  const { onReply, readOnly } = useFable()
  const id = React.useId()
  const [values, setValues] = useFableState<Record<string, FieldValue>>("values", () =>
    Object.fromEntries(block.fields.map((field) => [field.name, initialValue(field)]))
  )
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useFableState("submitted", false)
  const set = (name: string, value: FieldValue) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    for (const field of block.fields) {
      const value = values[field.name] ?? initialValue(field)
      if (field.required && (value === "" || value === false)) nextErrors[field.name] = "Required"
      else if (field.type === "email" && typeof value === "string" && value && !EMAIL.test(value)) {
        nextErrors[field.name] = "Enter a valid email address"
      }
    }
    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const lines = block.fields.map((field) => `- ${field.label}: ${describeValue(field, values[field.name] ?? initialValue(field))}`)
    onReply?.([block.title ? `${block.title}:` : "Here are my answers:", ...lines].join("\n"))
    setSubmitted(true)
  }

  const disabled = submitted || readOnly

  return (
    <form onSubmit={submit} noValidate className={cn(surface, "p-4 @lg:p-5")} aria-label={block.title ?? "Form"}>
      <BlockHeader title={block.title} description={block.description} className="mb-4" />
      <fieldset disabled={disabled} className="grid gap-4 @lg:grid-cols-2">
        {block.fields.map((field) => {
          const fieldId = `${id}-${field.name}`
          const value = values[field.name] ?? initialValue(field)
          const error = errors[field.name]
          const wide = field.type === "textarea" || field.type === "radio" || field.type === "checkbox" || field.type === "toggle"
          const describedBy = error ? `${fieldId}-error` : field.helper ? `${fieldId}-helper` : undefined
          const labelNode = (
            <Label htmlFor={fieldId} className="text-[0.8125rem] font-medium">
              {field.label}
              {field.required ? <span className="text-muted-foreground" aria-hidden>*</span> : null}
            </Label>
          )

          let control: React.ReactNode
          if (field.type === "textarea") {
            control = (
              <Textarea
                id={fieldId}
                value={String(value)}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                onChange={(event) => set(field.name, event.target.value)}
                className="min-h-20"
              />
            )
          } else if (field.type === "select") {
            control = (
              <Select value={String(value) || undefined} onValueChange={(next) => set(field.name, next)} disabled={disabled}>
                <SelectTrigger id={fieldId} className="w-full" aria-invalid={Boolean(error)} aria-describedby={describedBy}>
                  <SelectValue placeholder={field.placeholder ?? "Choose…"} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          } else if (field.type === "radio") {
            control = (
              <RadioGroup
                id={fieldId}
                value={String(value)}
                onValueChange={(next) => set(field.name, next)}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                className="flex flex-wrap gap-2"
              >
                {(field.options ?? []).map((option, index) => (
                  <Label
                    key={option}
                    htmlFor={`${fieldId}-${index}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-normal ring-1 ring-border transition-[background-color,box-shadow] has-data-[state=checked]:bg-primary/[0.06] has-data-[state=checked]:ring-primary/50"
                  >
                    <RadioGroupItem id={`${fieldId}-${index}`} value={option} />
                    {option}
                  </Label>
                ))}
              </RadioGroup>
            )
          } else if (field.type === "checkbox" || field.type === "toggle") {
            const Control = field.type === "toggle" ? Switch : Checkbox
            return (
              <div key={field.name} className="flex items-start gap-3 @lg:col-span-2">
                <Control
                  id={fieldId}
                  checked={value === true}
                  onCheckedChange={(next: boolean | "indeterminate") => set(field.name, next === true)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={describedBy}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  {labelNode}
                  {field.helper ? (
                    <p id={`${fieldId}-helper`} className="text-xs text-muted-foreground">
                      {field.helper}
                    </p>
                  ) : null}
                  {error ? (
                    <p id={`${fieldId}-error`} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          } else {
            control = (
              <Input
                id={fieldId}
                type={field.type}
                inputMode={field.type === "number" ? "decimal" : undefined}
                value={String(value)}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )
          }

          return (
            <div key={field.name} className={cn("grid content-start gap-1.5", wide && "@lg:col-span-2")}>
              {labelNode}
              {control}
              {error ? (
                <p id={`${fieldId}-error`} className="text-xs text-destructive">
                  {error}
                </p>
              ) : field.helper ? (
                <p id={`${fieldId}-helper`} className="text-xs text-muted-foreground">
                  {field.helper}
                </p>
              ) : null}
            </div>
          )
        })}
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        {submitted ? (
          <>
            <span role="status" className="me-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Answers sent
            </span>
            <Button type="button" variant="ghost" onClick={() => setSubmitted(false)} disabled={readOnly}>
              <PencilIcon data-icon="inline-start" />
              Edit answers
            </Button>
          </>
        ) : (
          <Button type="submit" disabled={!onReply || readOnly} className="transition-[scale] active:scale-[0.96]">
            {block.submitLabel ?? "Send answers"}
            <SendIcon data-icon="inline-end" />
          </Button>
        )}
      </div>
    </form>
  )
}

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]{0,39})\s*\}\}/g

function fill(body: string, values: Record<string, string>) {
  return body.replace(PLACEHOLDER, (match, name: string) => values[name]?.trim() || match)
}

/** Editable text with {{placeholders}}: fill the blanks, or edit the whole thing. */
export function TemplateBlock({ block, stateKey }: { block: BlockOf<"template">; stateKey: string }) {
  const id = React.useId()
  const names = React.useMemo(() => {
    const declared = block.variables?.map((variable) => variable.name) ?? []
    const found = [...block.body.matchAll(PLACEHOLDER)].map((match) => match[1])
    return [...new Set([...declared, ...found])].slice(0, 20)
  }, [block.body, block.variables])
  const labels = Object.fromEntries((block.variables ?? []).map((variable) => [variable.name, variable.label]))
  const [body, setBody] = useFableState("body", block.body)
  const [editing, setEditing] = useFableState("editing", false)
  const [values, setValues] = useFableState<Record<string, string>>("values", () =>
    Object.fromEntries((block.variables ?? []).map((variable) => [variable.name, variable.value ?? ""]))
  )
  const output = fill(body, values)
  const remaining = names.filter((name) => !values[name]?.trim() && body.includes(name)).length

  const preview = React.useMemo(() => {
    const parts: React.ReactNode[] = []
    let last = 0
    for (const match of body.matchAll(PLACEHOLDER)) {
      const index = match.index ?? 0
      parts.push(body.slice(last, index))
      const value = values[match[1]]?.trim()
      parts.push(
        value ? (
          <mark key={index} className="rounded-[4px] bg-primary/10 px-0.5 text-foreground">
            {value}
          </mark>
        ) : (
          <span key={index} className="rounded-[4px] border border-dashed border-primary/40 px-1 text-[0.85em] text-primary">
            {labels[match[1]] ?? match[1]}
          </span>
        )
      )
      last = index + match[0].length
    }
    parts.push(body.slice(last))
    return parts
  }, [body, values, labels])

  return (
    <section className={cn(surface, "overflow-hidden")} aria-label={block.title ?? "Template"}>
      <div className="px-4 pt-3.5 pb-3 @lg:px-5">
        <BlockHeader
          title={block.title ?? "Template"}
          description={block.description}
          actions={
            <>
              <IconAction label={editing ? "Done editing" : "Edit text"} onClick={() => setEditing((value) => !value)}>
                {editing ? <CheckCircle2Icon className="size-4" /> : <PencilIcon className="size-4" />}
              </IconAction>
              <IconAction
                label="Reset"
                disabled={body === block.body && Object.values(values).every((value) => !value)}
                onClick={() => {
                  setBody(block.body)
                  setValues({})
                }}
              >
                <RotateCcwIcon className="size-4" />
              </IconAction>
            </>
          }
        />
      </div>

      {names.length > 0 ? (
        <div className="grid gap-3 border-y border-border/70 bg-muted/30 px-4 py-3 @lg:grid-cols-2 @lg:px-5">
          {names.map((name) => (
            <div key={name} className="grid gap-1">
              <Label htmlFor={`${id}-${name}`} className="text-xs font-medium text-muted-foreground">
                {labels[name] ?? name.replace(/_/g, " ")}
              </Label>
              <Input
                id={`${id}-${name}`}
                value={values[name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                className="h-8 bg-background ring-1 ring-border"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="px-4 py-4 @lg:px-5">
        {editing ? (
          <Textarea
            aria-label="Template text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-48 font-mono text-[0.8125rem] leading-6"
            autoFocus
          />
        ) : (
          <div className="text-[0.9375rem] leading-7 whitespace-pre-wrap text-pretty [overflow-wrap:anywhere]">{preview}</div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 @lg:px-5">
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {remaining > 0 ? `${remaining} blank${remaining === 1 ? "" : "s"} left` : names.length ? "All blanks filled" : `${output.length} characters`}
        </span>
        <div className="flex gap-1.5">
          <ActionButton
            action={{ type: "download", label: "Download", filename: block.filename ?? block.title ?? "template", content: output }}
            stateKey={`${stateKey}.dl`}
            size="sm"
            fallbackStyle="ghost"
          />
          <ActionButton action={{ type: "copy", label: "Copy", text: output }} stateKey={`${stateKey}.cp`} size="sm" fallbackStyle="secondary" />
        </div>
      </div>
    </section>
  )
}

function Recipients({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = React.useId()
  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 @lg:px-5">
      <label htmlFor={id} className="w-14 shrink-0 text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        placeholder="name@example.com"
        inputMode="email"
        autoComplete="off"
      />
    </div>
  )
}

/** A draft the user finishes and sends from their own mail app or yours. */
export function EmailBlock({ block, stateKey }: { block: BlockOf<"email">; stateKey: string }) {
  const [to, setTo] = useFableState("to", (block.to ?? []).join(", "))
  const [cc, setCc] = useFableState("cc", (block.cc ?? []).join(", "))
  const [subject, setSubject] = useFableState("subject", block.subject)
  const [body, setBody] = useFableState("body", block.body)
  const [showCc, setShowCc] = React.useState(Boolean(block.cc?.length))
  const subjectId = React.useId()

  const list = (value: string) => value.split(/[,;\s]+/).map((entry) => entry.trim()).filter((entry) => EMAIL.test(entry))
  const mailto = (() => {
    const params = new URLSearchParams()
    if (subject) params.set("subject", subject)
    if (body) params.set("body", body.slice(0, 1800))
    if (list(cc).length) params.set("cc", list(cc).join(","))
    return `mailto:${list(to).map(encodeURIComponent).join(",")}?${params.toString().replace(/\+/g, "%20")}`
  })()
  const plain = [`To: ${to}`, cc ? `Cc: ${cc}` : "", `Subject: ${subject}`, "", body].filter((line, index) => line || index > 2).join("\n")

  return (
    <section className={cn(surface, "overflow-hidden")} aria-label="Email draft">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-2 @lg:px-5">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MailIcon className="size-3.5" aria-hidden />
          Draft
        </span>
        <div className="flex items-center">
          {!showCc ? (
            <Button variant="ghost" size="xs" onClick={() => setShowCc(true)} className="text-muted-foreground">
              Add Cc
            </Button>
          ) : null}
          <CopyAction text={plain} label="Copy email" />
        </div>
      </div>
      <Recipients label="To" value={to} onChange={setTo} />
      {showCc ? <Recipients label="Cc" value={cc} onChange={setCc} /> : null}
      <div className="flex items-center gap-3 border-b border-border/70 px-4 @lg:px-5">
        <label htmlFor={subjectId} className="w-14 shrink-0 text-sm text-muted-foreground">
          Subject
        </label>
        <input
          id={subjectId}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
        />
      </div>
      <textarea
        aria-label="Email body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="field-sizing-content block max-h-[32rem] min-h-40 w-full resize-none bg-transparent px-4 py-4 text-[0.9375rem] leading-7 outline-none @lg:px-5"
      />
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 px-4 py-2.5 @lg:px-5">
        <ActionButton
          action={{ type: "download", label: "Save as text", filename: subject || "email", content: plain }}
          stateKey={`${stateKey}.dl`}
          size="sm"
          fallbackStyle="ghost"
        />
        <ActionButton action={{ type: "link", label: "Open in mail app", url: mailto, icon: "mail" }} stateKey={`${stateKey}.mt`} size="sm" />
        {block.sendAction ? (
          <ActionButton
            action={{
              type: "host",
              label: "Send",
              icon: "send",
              action: block.sendAction,
              payload: { to: list(to).join(","), cc: list(cc).join(","), subject, body },
            }}
            stateKey={`${stateKey}.send`}
            size="sm"
            fallbackStyle="primary"
          />
        ) : null}
      </div>
    </section>
  )
}
