"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { modelCatalog, ProviderId, ProviderReadiness } from "@/lib/ai/provider-config";
import { Icons } from "../icons";

export type ModelSelectorProps = {
    provider: ProviderId;
    model: string;
    providerReadiness: ProviderReadiness[];
    onProviderChange: (provider: ProviderId) => void;
    onModelChange: (model: string) => void;
};

export function ModelSelector({
    provider,
    model,
    providerReadiness,
    onProviderChange,
    onModelChange,
}: ModelSelectorProps) {
    const Icon = Icons[provider === "google" ? "gemini" : provider] || (() => null);

    const handleValueChange = (value: string) => {
        // We expect value to be in format "providerId:modelName"
        const [newProvider, newModel] = value.split(":");
        if (newProvider !== provider) onProviderChange(newProvider as ProviderId);
        if (newModel !== model) onModelChange(newModel);
    };

    return (
        <Select value={`${provider}:${model}`} onValueChange={handleValueChange}>
            <SelectTrigger className="w-full sm:w-fit bg-transparent">
                <SelectValue>
                    <div className="flex items-center gap-2">
                        {Icon({ className: "size-3.5" })}
                        <span className="truncate">{model}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="h-[70svh] max-w-52 mb-5 -ml- bg-background/50 backdrop-blur-lg" >
                {providerReadiness.map((p) => (
                    <SelectGroup key={p.id}>
                        {modelCatalog[p.id as ProviderId]?.map((m) => {
                            const isSelected = provider === p.id && model === m;
                            return (
                                <SelectItem key={`${p.id}:${m}`} value={`${p.id}:${m}`} disabled={isSelected || providerReadiness.find((pr) => pr.id === p.id)?.isConfigured === false}>
                                    <div className="flex items-center gap-2">
                                        {Icons[p.id === "google" ? "gemini" : p.id]?.({ className: "size-4" })}
                                        <span>{m}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
}