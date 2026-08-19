"use client"

import * as React from "react"
import { Check, Copy, Mail, Send } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  resolveTextDirection,
  usePlainTextDraft,
  type TextDirection,
} from "@/components/fable-ui/text-editor-card/text-editor-card"

export type EmailComposerCardProps = {
  subject: string
  body: string
  to?: string[]
  editable?: boolean
  direction?: TextDirection
  isLoading?: boolean
  isStreaming?: boolean
  isDisabled?: boolean
  error?: {
    title: string
    description?: string
  }
  onDraftChange?: (draft: {
    to: string[]
    subject: string
    body: string
  }) => void
}

type EmailDraft = {
  to: string[]
  subject: string
  body: string
}

const mailtoMaxLength = 1800

function parseRecipients(value: string) {
  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean)
}

function invalidRecipients(recipients: string[]) {
  return recipients.filter(
    (recipient) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(recipient)
  )
}

function buildMailtoUrl({
  recipients,
  subject,
  body,
}: {
  recipients: string[]
  subject: string
  body: string
}) {
  const encodedRecipients = recipients.map(encodeURIComponent).join(",")
  const url = new URL(`mailto:${encodedRecipients}`)

  url.search = new URLSearchParams({
    subject,
    body: body.replace(/\r?\n/g, "\r\n"),
  }).toString()

  return url.toString()
}

function buildGmailComposeUrl({
  recipients,
  subject,
  body,
}: {
  recipients: string[]
  subject: string
  body: string
}) {
  const url = new URL("https://mail.google.com/mail/")

  url.search = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: recipients.join(","),
    su: subject,
    body,
  }).toString()

  return url.toString()
}

function buildOutlookComposeUrl({
  recipients,
  subject,
  body,
}: {
  recipients: string[]
  subject: string
  body: string
}) {
  const url = new URL("https://outlook.office.com/mail/deeplink/compose")

  url.search = new URLSearchParams({
    to: recipients.join(","),
    subject,
    body,
  }).toString()

  return url.toString()
}

function openDefaultEmailApp(
  mailtoUrl: string,
  location: Pick<Location, "href"> = window.location
) {
  location.href = mailtoUrl
}

function openExternalEmailApp(url: string) {
  const popup = window.open("about:blank", "_blank")

  if (!popup) {
    return false
  }

  popup.opener = null
  popup.location.replace(url)
  return true
}

function createPlainTextEmailPackage({ to, subject, body }: EmailDraft) {
  return `${to.length ? `To: ${to.join(", ")}\n` : ""}Subject: ${subject}\n\n${body}`
}

function GmailMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M3 18V6l9 7 9-7v12h-3v-8l-6 4.7L6 10v8z" />
      <path fill="#4285F4" d="M3 6h3l6 4.7L9 13z" />
      <path fill="#34A853" d="M21 6h-3l-6 4.7 3 2.3z" />
      <path fill="#FBBC05" d="M6 18V10l3 3v5z" />
    </svg>
  )
}

function OutlookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect width="15" height="15" x="2" y="4.5" fill="#0F6CBD" rx="2" />
      <path
        fill="#FFF"
        d="M5.2 8.1h3.5c2.1 0 3.5 1.4 3.5 3.9s-1.4 3.9-3.5 3.9H5.2zm2.1 1.8v4.2h1.2c1.1 0 1.7-.7 1.7-2.1s-.6-2.1-1.7-2.1z"
      />
      <path fill="#28A8EA" d="M17 7.5 22 9v7l-5 1.5z" />
    </svg>
  )
}

function ReadOnlyEmail({
  subject,
  body,
  to,
  direction,
}: Pick<EmailComposerCardProps, "subject" | "body" | "to" | "direction">) {
  const contentDirection = resolveTextDirection(
    direction ?? "auto",
    `${subject}\n${body}`
  )

  return (
    <div className="flex flex-col gap-3" dir={contentDirection}>
      {to?.length ? (
        <p dir="ltr" className="text-start text-sm text-muted-foreground">
          To: {to.join(", ")}
        </p>
      ) : null}
      <p className="font-medium">{subject || "(No subject)"}</p>
      <pre className="max-h-80 overflow-auto rounded-2xl border bg-muted/30 p-3 text-sm break-words whitespace-pre-wrap">
        {body}
      </pre>
    </div>
  )
}

function EmailFields({
  initialTo,
  subject,
  body,
  editable,
  isDisabled,
  direction,
  onDraftChange,
  onDraftUpdate,
}: {
  initialTo: string[]
  subject: string
  body: string
  editable: boolean
  isDisabled?: boolean
  direction: TextDirection
  onDraftChange?: EmailComposerCardProps["onDraftChange"]
  onDraftUpdate: (draft: EmailDraft) => void
}) {
  const fieldId = React.useId()
  const toId = `${fieldId}-to`
  const subjectId = `${fieldId}-subject`
  const bodyId = `${fieldId}-body`
  const bodyControlRef = React.useRef<HTMLTextAreaElement>(null)
  const recipients = usePlainTextDraft<HTMLInputElement>({
    initialValue: initialTo.join(", "),
  })
  const subjectDraft = usePlainTextDraft<HTMLInputElement>({
    initialValue: subject,
  })
  const bodyDraft = usePlainTextDraft<HTMLTextAreaElement>({
    initialValue: body,
  })
  const recipientValues = parseRecipients(recipients.value)
  const invalid = invalidRecipients(recipientValues)
  const readOnly = isDisabled || !editable

  function getDraft(next: Partial<EmailDraft> = {}): EmailDraft {
    return {
      to: next.to ?? parseRecipients(recipients.value),
      subject: next.subject ?? subjectDraft.value,
      body: next.body ?? bodyDraft.value,
    }
  }

  function commitDraft() {
    onDraftChange?.(getDraft())
  }

  return (
    <FieldGroup>
      <Field
        data-disabled={readOnly || undefined}
        data-invalid={invalid.length ? true : undefined}
      >
        <FieldLabel htmlFor={toId}>To</FieldLabel>
        <Input
          id={toId}
          defaultValue={initialTo.join(", ")}
          dir="ltr"
          readOnly={readOnly}
          aria-invalid={invalid.length ? true : undefined}
          placeholder="name@example.com, other@example.com"
          onInput={(event) => {
            recipients.onInput(event)
            onDraftUpdate(
              getDraft({ to: parseRecipients(event.currentTarget.value) })
            )
          }}
          onBlur={commitDraft}
        />
        {invalid.length ? (
          <FieldError>
            Enter valid comma-separated email addresses: {invalid.join(", ")}
          </FieldError>
        ) : null}
      </Field>
      <Field data-disabled={readOnly || undefined}>
        <FieldLabel htmlFor={subjectId}>Subject</FieldLabel>
        <Input
          id={subjectId}
          defaultValue={subject}
          dir={direction}
          readOnly={readOnly}
          onInput={(event) => {
            subjectDraft.onInput(event)
            onDraftUpdate(getDraft({ subject: event.currentTarget.value }))
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              bodyControlRef.current?.focus()
            }
          }}
        />
      </Field>
      <Field data-disabled={readOnly || undefined}>
        <FieldLabel htmlFor={bodyId}>Body</FieldLabel>
        <Textarea
          id={bodyId}
          ref={bodyControlRef}
          defaultValue={body}
          dir={direction}
          readOnly={readOnly}
          onInput={(event) => {
            bodyDraft.onInput(event)
            onDraftUpdate(getDraft({ body: event.currentTarget.value }))
          }}
          onBlur={commitDraft}
          className="max-h-80 min-h-40 overflow-auto leading-6"
        />
      </Field>
    </FieldGroup>
  )
}

function getSendUnavailableReason({
  draft,
  isDisabled,
  isPartial,
  isLoading,
}: {
  draft: EmailDraft
  isDisabled?: boolean
  isPartial: boolean
  isLoading?: boolean
}) {
  const hasContent = Boolean(draft.to.length || draft.subject || draft.body)
  const invalid = invalidRecipients(draft.to)
  const mailto = buildMailtoUrl({
    recipients: draft.to,
    subject: draft.subject,
    body: draft.body,
  })

  if (!hasContent) {
    return null
  }

  if (isLoading) {
    return "Send is unavailable while this email draft is being prepared."
  }

  if (isPartial) {
    return "Send is unavailable for this incomplete draft. Copy the email package instead."
  }

  if (isDisabled) {
    return "Send is unavailable because this draft is read-only. Copy the email package instead."
  }

  if (invalid.length) {
    return "Fix invalid recipients before sending, or copy the email package instead."
  }

  if (mailto.length > mailtoMaxLength) {
    return "This email is too long for a reliable mailto link. Copy the email package instead."
  }

  return null
}

function EmailCardActions({
  draft,
  canCopy,
  canSend,
  isCopied,
  onCopy,
  onLaunchResult,
}: {
  draft: EmailDraft
  canCopy: boolean
  canSend: boolean
  isCopied: boolean
  onCopy: () => void
  onLaunchResult?: (provider: "Gmail" | "Outlook", didOpen: boolean) => void
}) {
  const copyLabel = isCopied ? "Copied email package" : "Copy email package"
  const sendLabel = "Choose email app"
  const gmailUrl = buildGmailComposeUrl({
    recipients: draft.to,
    subject: draft.subject,
    body: draft.body,
  })
  const outlookUrl = buildOutlookComposeUrl({
    recipients: draft.to,
    subject: draft.subject,
    body: draft.body,
  })
  const mailtoUrl = buildMailtoUrl({
    recipients: draft.to,
    subject: draft.subject,
    body: draft.body,
  })

  function launchExternalEmail(url: string, provider: "Gmail" | "Outlook") {
    onLaunchResult?.(provider, openExternalEmailApp(url))
  }

  return (
    <CardAction>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={copyLabel}
                disabled={!canCopy}
                onClick={onCopy}
              >
                {isCopied ? <Check /> : <Copy />}
                <span className="sr-only">{copyLabel}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copyLabel}</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={sendLabel}
                      disabled={!canSend}
                    >
                      <Send />
                      <span className="sr-only">{sendLabel}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>{sendLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => launchExternalEmail(gmailUrl, "Gmail")}
                >
                  <GmailMark />
                  Open in Gmail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => launchExternalEmail(outlookUrl, "Outlook")}
                >
                  <OutlookMark />
                  Open in Outlook
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openDefaultEmailApp(mailtoUrl)
                  }}
                >
                  <Mail className="text-primary" />
                  Open default email app
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </CardAction>
  )
}

function EmailReadyCard({
  sourceDraft,
  editable,
  direction,
  isDisabled,
  onDraftChange,
}: {
  sourceDraft: EmailDraft
  editable: boolean
  direction: TextDirection
  isDisabled?: boolean
  onDraftChange?: EmailComposerCardProps["onDraftChange"]
}) {
  const [copyError, setCopyError] = React.useState(false)
  const [launchFailure, setLaunchFailure] = React.useState<string | null>(null)
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const [draft, setDraft] = React.useState(sourceDraft)
  const canCopy = Boolean(draft.to.length || draft.subject || draft.body)
  const sendUnavailableReason = getSendUnavailableReason({
    draft,
    isDisabled,
    isPartial: false,
  })
  const canSend = canCopy && sendUnavailableReason === null

  async function copyEmailPackage() {
    setCopyError(false)
    setCopyError(!(await copyToClipboard(createPlainTextEmailPackage(draft))))
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="sr-only">Email draft</CardTitle>
        <EmailCardActions
          draft={draft}
          canCopy={canCopy}
          canSend={canSend}
          isCopied={isCopied}
          onCopy={copyEmailPackage}
          onLaunchResult={(provider, didOpen) => {
            setLaunchFailure(
              didOpen
                ? null
                : `Could not open ${provider}. Allow popups and try again, or copy the email package instead.`
            )
          }}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <EmailFields
          initialTo={sourceDraft.to}
          subject={sourceDraft.subject}
          body={sourceDraft.body}
          editable={editable}
          isDisabled={isDisabled}
          direction={direction}
          onDraftChange={onDraftChange}
          onDraftUpdate={(nextDraft) => {
            setDraft(nextDraft)
          }}
        />
        {copyError ? (
          <p role="status" className="text-sm text-destructive">
            Could not copy the email package. Select the draft and copy it
            manually.
          </p>
        ) : null}
        {launchFailure ? (
          <p role="status" className="text-sm text-destructive">
            {launchFailure}
          </p>
        ) : null}
        {sendUnavailableReason ? (
          <p role="status" className="text-sm text-muted-foreground">
            {sendUnavailableReason}
          </p>
        ) : null}
      </CardContent>
    </>
  )
}

function EmailStaticCard({
  sourceDraft,
  direction,
  isLoading,
  isStreaming,
  isDisabled,
  error,
}: {
  sourceDraft: EmailDraft
  direction: TextDirection
  isLoading?: boolean
  isStreaming?: boolean
  isDisabled?: boolean
  error?: EmailComposerCardProps["error"]
}) {
  const [copyError, setCopyError] = React.useState(false)
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const hasContent = Boolean(
    sourceDraft.to.length || sourceDraft.subject || sourceDraft.body
  )
  const canCopy = hasContent
  const sendUnavailableReason = getSendUnavailableReason({
    draft: sourceDraft,
    isDisabled,
    isPartial: Boolean(isStreaming || error),
    isLoading,
  })

  async function copyEmailPackage() {
    setCopyError(false)
    setCopyError(
      !(await copyToClipboard(createPlainTextEmailPackage(sourceDraft)))
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="sr-only">Email draft</CardTitle>
        <EmailCardActions
          draft={sourceDraft}
          canCopy={canCopy}
          canSend={false}
          isCopied={isCopied}
          onCopy={copyEmailPackage}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || (isStreaming && !hasContent) ? (
          <>
            <p role="status" className="sr-only">
              Preparing email draft...
            </p>
            <Skeleton className="h-8 w-full motion-reduce:animate-none" />
            <Skeleton className="h-40 w-full motion-reduce:animate-none" />
          </>
        ) : null}
        {isStreaming && hasContent ? (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              Generating email...
            </p>
            <ReadOnlyEmail
              subject={sourceDraft.subject}
              body={sourceDraft.body}
              to={sourceDraft.to}
              direction={direction}
            />
          </>
        ) : null}
        {!isLoading && !isStreaming && error ? (
          <>
            <Alert variant="destructive">
              <AlertTitle>{error.title}</AlertTitle>
              {error.description ? (
                <AlertDescription>{error.description}</AlertDescription>
              ) : null}
            </Alert>
            {hasContent ? (
              <ReadOnlyEmail
                subject={sourceDraft.subject}
                body={sourceDraft.body}
                to={sourceDraft.to}
                direction={direction}
              />
            ) : null}
          </>
        ) : null}
        {!isLoading && !isStreaming && !error && !hasContent ? (
          <Empty className="min-h-40 p-6">
            <EmptyHeader>
              <EmptyTitle>No email draft yet</EmptyTitle>
              <EmptyDescription>
                There is no subject, body, or recipient to compose.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {copyError ? (
          <p role="status" className="text-sm text-destructive">
            Could not copy the email package. Select the draft and copy it
            manually.
          </p>
        ) : null}
        {sendUnavailableReason ? (
          <p role="status" className="text-sm text-muted-foreground">
            {sendUnavailableReason}
          </p>
        ) : null}
      </CardContent>
    </>
  )
}

export function EmailComposerCard({
  subject,
  body,
  to = [],
  editable = true,
  direction = "auto",
  isLoading,
  isStreaming,
  isDisabled,
  error,
  onDraftChange,
}: EmailComposerCardProps) {
  const sourceDraft: EmailDraft = { to, subject, body }
  const hasContent = Boolean(to.length || subject || body)
  const isReady = !isLoading && !isStreaming && !error && hasContent
  const sourceKey = JSON.stringify([to, subject, body])

  return (
    <Card
      size="sm"
      className="w-full max-w-2xl"
      data-fable-ui="email-composer-card"
      aria-busy={isLoading || isStreaming || undefined}
    >
      {isReady ? (
        <EmailReadyCard
          key={sourceKey}
          sourceDraft={sourceDraft}
          editable={editable}
          direction={direction}
          isDisabled={isDisabled}
          onDraftChange={onDraftChange}
        />
      ) : (
        <EmailStaticCard
          sourceDraft={sourceDraft}
          direction={direction}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isDisabled={isDisabled}
          error={error}
        />
      )}
    </Card>
  )
}

export {
  buildGmailComposeUrl,
  buildMailtoUrl,
  buildOutlookComposeUrl,
  createPlainTextEmailPackage,
  invalidRecipients,
  openDefaultEmailApp,
  parseRecipients,
}
