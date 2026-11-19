import { FableChat } from "@/components/fable-ui/chat/fable-chat"

export default function FableChatPage() {
  return (
    <main className="flex h-dvh flex-col bg-background">
      <FableChat
        api="/api/fable-chat"
        title="What can I help with?"
        suggestions={[
          { label: "Compare options", prompt: "Compare the three most popular note-taking apps in a table" },
          { label: "Plan a trip", prompt: "Plan a relaxed weekend in Copenhagen" },
          { label: "Draft an email", prompt: "Draft an email asking my team for feedback on the new onboarding" },
          { label: "Ask me questions", prompt: "Help me plan a birthday dinner — ask me what you need to know" },
        ]}
        // Images load only from hosts you list; others wait for a click.
        // images={{ allowedHosts: ["images.example-cdn.com"] }}
        // Side effects the model may request by name. Nothing else can run.
        // actions={{ "email.send": { confirm: "Send this email?", run: async (payload) => { … } } }}
      />
    </main>
  )
}
