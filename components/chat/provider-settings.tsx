"use client";

import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeIcon } from "@/components/hugeicon";
import { modelCatalog, ProviderId, ProviderReadiness } from "@/lib/ai/provider-config";

export type ProviderSettingsProps = {
  provider: ProviderId;
  model: string;
  providerReadiness: ProviderReadiness[];
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: string) => void;
};


export function ProviderSettings({
  provider,
  model,
  providerReadiness,
  onProviderChange,
  onModelChange,
}: ProviderSettingsProps) {
  const selectedProvider =
    providerReadiness.find((candidate) => candidate.id === provider) || providerReadiness[0];
  const modelOptions = modelCatalog[provider] || [selectedProvider?.defaultModel].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Provider</span>
          <Select value={provider} onValueChange={(value) => onProviderChange(value as ProviderId)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Providers</SelectLabel>
                {providerReadiness.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Model</span>
          <Select value={model || selectedProvider?.defaultModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{selectedProvider?.label || "Provider"} models</SelectLabel>
                {modelOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
      </div>

      {selectedProvider?.isConfigured ? (
        <Alert>
          <HugeIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
          <AlertTitle>{selectedProvider.label} is ready</AlertTitle>
          <AlertDescription>
            Requests will use {model || selectedProvider.defaultModel}.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <HugeIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertTitle>{selectedProvider?.label || "Provider"} needs configuration</AlertTitle>
          <AlertDescription>
            Add {selectedProvider?.envKey || "the provider API key"} to the server environment before sending live requests.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <HugeIcon icon={Settings02Icon} aria-hidden="true" />
        Provider credentials are read on the server from environment variables.
      </div>
    </div>
  );
}
