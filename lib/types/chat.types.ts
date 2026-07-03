import { FileUIPart } from "ai";
import { ProviderId, ProviderReadiness } from "../ai/provider-config";

export type PendingAttachment = FileUIPart & {
    id: string;
    size: number;
};

export type SubmittedPrompt = {
    text: string;
    attachments: PendingAttachment[];
};

export type ChatPageClientProps = {
    providerDefaults: {
        provider: ProviderId;
        model: string;
    };
    providerReadiness: ProviderReadiness[];
    initialPrompt?: string;
    autoSend?: boolean;
};