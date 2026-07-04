import {
  assertProviderConfigured,
  getConfiguredModel,
  isModelForProvider,
  isProviderId,
  resolveProviderConfig,
  type ProviderCredentialSource,
} from "@/lib/ai/provider-config"
import { toolRegistry } from "@/lib/fable-ui/tools"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import type { UIMessage } from "ai"

const tools = Object.fromEntries(
  Object.entries(toolRegistry).map(([name, def]) => [name, def.tool])
)

type ChatRequestBody = {
  messages?: UIMessage[]
  provider?: string
  model?: string
  mode?: string
  credentialSource?: ProviderCredentialSource
  apiKey?: string
  selectedKeyId?: string
}

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
}

export async function POST(req: Request) {
  let body: ChatRequestBody

  try {
    body = (await req.json()) as ChatRequestBody
  } catch {
    return createTextOnlyResponse(
      "Request error. The playground server received invalid chat JSON."
    )
  }

  const messages = body.messages || []
  const credentialSource =
    body.credentialSource || (body.mode === "mock" ? "none" : "server-env")

  if (body.mode === "mock" || credentialSource === "none") {
    return createMockToolResponse(messages)
  }

  const providerConfig = resolveProviderConfig(body.provider, body.model)
  const runtimeApiKey =
    credentialSource === "browser-key" || credentialSource === "session-key"
      ? body.apiKey?.trim()
      : undefined

  if (body.provider && !isProviderId(body.provider)) {
    return createTextOnlyResponse(
      "Configuration error: unknown provider.",
      messages
    )
  }

  if (!isModelForProvider(providerConfig.provider, providerConfig.model)) {
    return createTextOnlyResponse(
      "Configuration error: unknown model for the selected provider.",
      messages
    )
  }

  if (
    (credentialSource === "browser-key" ||
      credentialSource === "session-key") &&
    !runtimeApiKey
  ) {
    return createTextOnlyResponse(
      "Configuration error: selected browser key is unavailable.",
      messages
    )
  }

  try {
    assertProviderConfigured(providerConfig.provider, runtimeApiKey)
  } catch (error) {
    return createTextOnlyResponse(getPublicChatError(error), messages)
  }

  try {
    const model = getConfiguredModel({
      provider: providerConfig.provider,
      model: providerConfig.model,
      apiKey: runtimeApiKey,
    })
    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model,
      system: [
        "You are a helpful AI assistant inside the fable-UI playground.",
        "Have normal, context-aware conversations in markdown when the user asks for explanation, planning, brainstorming, writing, or broad analysis.",
        "Use a fable-UI tool only when the user asks for a UI-backed result or when concrete data from the conversation is already available and a trusted UI component is clearly the right surface.",
        "Do not call tools with generic placeholder data. If exact values, rows, fields, options, labels, or consequences are missing, ask a short follow-up question or answer in text.",
        "When you call a tool, preserve the user's actual context in the labels, summaries, details, and rows. Never replace it with a generic demo metric.",
        "Do not invent components, HTML, CSS, routes, data sources, or authorization decisions.",
        "For side effects, call request_confirmation before the host app performs the action.",
        "For real data access, return display-ready data only when it is already available.",
      ].join("\n"),
      messages: modelMessages,
      tools,
      toolChoice: "auto",
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error(getPublicChatError(error))
      },
    })

    return result.toUIMessageStreamResponse({
      onError: getPublicChatError,
      headers: noStoreHeaders,
    })
  } catch (error) {
    return createTextOnlyResponse(getPublicChatError(error), messages)
  }
}

function getPublicChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")

  if (/api key|not configured|environment|env/i.test(message)) {
    return "Configuration error: provider credentials are missing or invalid for the selected provider/model."
  }

  if (
    /unauthorized|authentication|permission|forbidden|401|403/i.test(message)
  ) {
    return "Provider authentication error. Check the selected provider API key and model access."
  }

  if (/rate limit|quota|429/i.test(message)) {
    return "Provider rate limit reached. Wait a moment or switch to another configured provider."
  }

  if (/model|not found|unsupported|404/i.test(message)) {
    return "Provider model error. The selected model is unavailable for this provider or API key."
  }

  if (/timeout|network|fetch|econn|enotfound|socket/i.test(message)) {
    return "Network connection issue. The playground server could not reach the AI provider."
  }

  return "Server error. The playground route failed while asking the AI provider."
}

function createTextOnlyResponse(text: string, messages: UIMessage[] = []) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const id = "text-error"
      writer.write({ type: "text-start", id })
      writer.write({ type: "text-delta", id, delta: text })
      writer.write({ type: "text-end", id })
    },
  })

  return createUIMessageStreamResponse({ stream, headers: noStoreHeaders })
}

function createMockToolResponse(messages: UIMessage[] = []) {
  const mock = getMockToolCall(messages)
  const stream = createUIMessageStream<UIMessage>({
    originalMessages: messages,
    execute: ({ writer }) => {
      const textId = "mock-intro"

      writer.write({ type: "text-start", id: textId })
      writer.write({ type: "text-delta", id: textId, delta: mock.text })
      writer.write({ type: "text-end", id: textId })
      writer.write({
        type: "tool-input-available",
        toolCallId: mock.toolCallId,
        toolName: mock.toolName,
        input: mock.input,
      })

      if (mock.output !== undefined) {
        writer.write({
          type: "tool-output-available",
          toolCallId: mock.toolCallId,
          output: mock.output,
        })
      }
    },
  })

  return createUIMessageStreamResponse({ stream, headers: noStoreHeaders })
}

function getMockToolCall(messages: UIMessage[]) {
  const prompt = getLastUserText(messages).toLowerCase()

  if (/invalid|bad|broken/.test(prompt) && /form|collect|input/.test(prompt)) {
    return {
      toolName: "collect_input",
      toolCallId: "mock-invalid-form",
      text: "Mock mode is rendering an intentionally invalid form payload.",
      input: {
        title: "Broken mock form",
        fields: [{ name: "priority", label: "Priority", type: "select" }],
      },
    }
  }

  if (/form|collect|input|email|priority/.test(prompt)) {
    const input = {
      title: "Update contact",
      description: "Collect only the fields needed for this step.",
      submitLabel: "Continue",
      fields: [
        {
          name: "email",
          label: "Email",
          type: "text",
          required: true,
          placeholder: "name@example.com",
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Urgent", value: "urgent" },
          ],
        },
        { name: "notify", label: "Notify customer", type: "toggle" },
      ],
    }

    return {
      toolName: "collect_input",
      toolCallId: "mock-form",
      text: "Mock mode is rendering a `collect_input` tool call.",
      input,
    }
  }

  if (/confirm|approval|approve|delete|refund/.test(prompt)) {
    const input = {
      id: "mock-confirm-refund",
      title: "Refund order 1007?",
      description: "The host app will run the refund after confirmation.",
      confirmLabel: "Refund",
      cancelLabel: "Keep order",
      variant: "warning",
      details: ["Amount: EGP 420", "Reason: duplicate charge"],
    }

    return {
      toolName: "request_confirmation",
      toolCallId: "mock-confirmation",
      text: "Mock mode is rendering a `request_confirmation` tool call.",
      input,
      output: input,
    }
  }

  if (/metric|kpi|revenue|total/.test(prompt)) {
    const input = {
      label: "Revenue today",
      value: "EGP 4,200",
      trend: { direction: "up", delta: "+18% vs yesterday" },
      context: "Mock data from the playground route",
    }

    return {
      toolName: "show_metric",
      toolCallId: "mock-metric",
      text: "Mock mode is rendering a `show_metric` tool call.",
      input,
      output: input,
    }
  }

  if (/action|next|suggest/.test(prompt)) {
    const input = {
      title: "Next safe actions",
      description: "Prompt-only follow ups for the current answer.",
      actions: [
        { label: "Compare to yesterday", prompt: "Compare this to yesterday." },
        { label: "Show source rows", prompt: "Show the source rows." },
      ],
    }

    return {
      toolName: "show_next_actions",
      toolCallId: "mock-actions",
      text: "Mock mode is rendering a `show_next_actions` tool call.",
      input,
      output: input,
    }
  }

  const rows = createMockRows(150)
  const input = {
    title: /table/.test(prompt) ? "Mock people table" : "Mock people browser",
    entityLabel: "people",
    description: "Static mock rows from the playground route.",
    pageSize: 10,
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "role", label: "Role", filterable: true },
      { key: "team", label: "Team", filterable: true },
      { key: "status", label: "Status", type: "badge", filterable: true },
      {
        key: "score",
        label: "Score",
        type: "number",
        align: "right",
        sortable: true,
      },
    ],
    rows,
  }

  return {
    toolName: /table/.test(prompt) ? "show_table" : "show_data_browser",
    toolCallId: /table/.test(prompt) ? "mock-table" : "mock-data-browser",
    text: /table/.test(prompt)
      ? "Mock mode is rendering a paginated `show_table` tool call."
      : "Mock mode is rendering a paginated `show_data_browser` tool call.",
    input,
    output: input,
  }
}

function getLastUserText(messages: UIMessage[]) {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") {
      continue
    }

    return (message.parts ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
  }

  return ""
}

function createMockRows(count: number) {
  const names = [
    "Nadia Ali",
    "Mina Fahmy",
    "Sarah Adel",
    "Omar Saleh",
    "Lina Nasser",
    "Youssef Mansour",
  ]
  const roles = ["Designer", "Engineer", "Analyst", "Operator"]
  const teams = ["North", "South", "West"]
  const statuses = ["active", "review", "paused"]

  return Array.from({ length: count }, (_, index) => {
    const name = names[index % names.length]

    return {
      id: `person-${index + 1}`,
      name,
      avatarUrl: name && createInitialsDataUrl(name),
      role: roles[index % roles.length],
      team: teams[index % teams.length],
      status: statuses[index % statuses.length],
      score: 70 + (index % 30),
    }
  })
}
function createInitialsDataUrl(name: string) {
  return `https://api.dicebear.com/10.x/stripes/svg?seed=${encodeURIComponent(name)}`
}
