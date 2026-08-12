import Chat from "@/components/chat/chat";
import { getDefaultProviderConfig, getProviderReadiness } from "@/lib/ai/provider-config";
import { FableDataProvider } from "@/lib/fable-ui/core";

type PlaygroundSearchParams = {
  prompt?: string | string[];
  send?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}


export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<PlaygroundSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const providerDefaults = getDefaultProviderConfig();
  const providerReadiness = getProviderReadiness();
  const initialPrompt = firstParam(resolvedSearchParams.prompt) || "";
  const autoSend = firstParam(resolvedSearchParams.send) === "1";
  return (
    <div
      data-slot="layout"
      className="group/layout relative z-10 flex h-[calc(100svh-var(--header-height))] flex-col overflow-hidden bg-background"
    >
      <main className="h-[calc(100svh-var(--header-height))] flex-1 overflow-hidden">
        <FableDataProvider>
          <Chat
            providerDefaults={providerDefaults}
            providerReadiness={providerReadiness}
            initialPrompt={initialPrompt}
            autoSend={autoSend}
          />
        </FableDataProvider>
      </main>
    </div>

  )
}
