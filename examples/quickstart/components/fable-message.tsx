import type { UIMessage } from "ai"

import { FableToolPart } from "@/components/fable-ui/chat/fable-tool-part"

export function FableMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={isUser ? "max-w-[80%] rounded-md bg-primary px-3 py-2 text-primary-foreground" : "w-full"}>
        {(message.parts ?? []).map((part, index) => {
          if (part.type === "text") {
            return (
              <p key={`${message.id}-text-${index}`} className="whitespace-pre-wrap text-sm leading-6">
                {part.text}
              </p>
            )
          }

          if (part.type.startsWith("tool-")) {
            return (
              <div key={`${message.id}-tool-${index}`} className="my-4">
                <FableToolPart part={part} />
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
