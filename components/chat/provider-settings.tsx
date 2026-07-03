"use client";

import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  type ProviderCredentialSource,
  modelCatalog,
  ProviderId,
  ProviderReadiness,
} from "@/lib/ai/provider-config";
import { type StoredProviderKey, isKeyEligibleForModel } from "@/lib/ai/client-provider-key-store";
import { Eye, EyeOff, Loader } from "lucide-react";

export type ProviderSettingsProps = {
  providerReadiness: ProviderReadiness[];
  provider: ProviderId;
  model: string;
  selectedKeyId?: string;
  localKeys: StoredProviderKey[];
  credentialSource: ProviderCredentialSource;
  storeError?: string | null;
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: string) => void;
  onCredentialSourceChange: (source: ProviderCredentialSource) => void;
  onSelectedKeyChange: (keyId: string | undefined) => void;
  onAddKey: (input: {
    provider: ProviderId;
    label: string;
    apiKey: string;
    modelScope: "*" | string[];
  }) => Promise<void>;
  onDeleteKey: (keyId: string) => Promise<void>;
  onRenameKey: (keyId: string, label: string) => Promise<void>;
  onTestKey: (keyId: string) => Promise<void>;
};


export function ProviderSettings({
  provider,
  model,
  providerReadiness,
  selectedKeyId,
  localKeys,
  credentialSource,
  storeError,
  onProviderChange,
  onModelChange,
  onCredentialSourceChange,
  onSelectedKeyChange,
  onAddKey,
  onDeleteKey,
  onRenameKey,
  onTestKey,
}: ProviderSettingsProps) {
  const [loadingKeyTest, setLoadingKeyTest] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [scope, setScope] = useState<"*" | "model">("*");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const selectedProvider =
    providerReadiness.find((candidate) => candidate.id === provider) || providerReadiness[0]!;
  const modelOptions = modelCatalog[provider] || [selectedProvider.defaultModel];
  const eligibleKeys = useMemo(
    () => localKeys.filter((key) => isKeyEligibleForModel(key, provider, model)),
    [localKeys, model, provider],
  );
  const readiness = selectedProvider.modelReadiness?.[model];
  const selectedKey = localKeys.find((key) => key.id === selectedKeyId);
  const sourceLabel =
    credentialSource === "server-env"
      ? "server environment"
      : credentialSource === "browser-key"
        ? `local key${selectedKey ? ` "${selectedKey.label}"` : ""}`
        : credentialSource === "session-key"
          ? "session key"
          : "no credentials";

  async function handleSaveKey() {
    setIsSaving(true);
    setActionError(null);

    try {
      await onAddKey({
        provider,
        label,
        apiKey,
        modelScope: scope === "*" ? "*" : [model],
      });
      setLabel("");
      setApiKey("");
      setScope("*");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save this key.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRenameKey(key: StoredProviderKey) {
    const nextLabel = window.prompt("Rename key", key.label);

    if (!nextLabel || nextLabel === key.label) {
      return;
    }

    await onRenameKey(key.id, nextLabel);
  }

  const handleTestKey = async (id: string) => {
    try {
      setLoadingKeyTest(id);
      await onTestKey(id)
      setLoadingKeyTest(null)
    } catch (e: any) {
      setLoadingKeyTest(null);
    }
  }

  return (
    <div className="flex max-h-[75svh] flex-col gap-5 overflow-y-auto pr-7 pb-6 px-6">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-muted-foreground">Key source</span>
        <Select value={credentialSource} onValueChange={(value) => onCredentialSourceChange(value as ProviderCredentialSource)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose key source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="server-env" disabled={!selectedProvider?.serverConfigured}>
              Server env key {selectedProvider?.serverConfigured ? "" : "(not configured)"}
            </SelectItem>
            <SelectItem value="browser-key" disabled={eligibleKeys.length === 0}>
              Local browser key {eligibleKeys.length > 0 ? `(${eligibleKeys.length})` : "(none eligible)"}
            </SelectItem>
            <SelectItem value="none">None / mock only</SelectItem>
          </SelectContent>
        </Select>
      </label>

       {credentialSource === "browser-key" ? (
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Selected local key</span>
            <Select value={selectedKeyId || ""} onValueChange={(value) => onSelectedKeyChange(value || undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose saved key" />
              </SelectTrigger>
              <SelectContent>
                {eligibleKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.label} ({key.maskedPreview})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

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

      {readiness?.isConfigured ? (
        <Alert className="border-green-500/15">
          <AlertTitle className="text-green-500">
            {selectedProvider.label} / {model || selectedProvider.defaultModel} is ready
          </AlertTitle>
          <AlertDescription>
            Requests will use {sourceLabel}. For production apps, prefer server-managed env, KMS, secrets, or provider OAuth where available.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <HugeIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertTitle>This model needs a provider API key</AlertTitle>
          <AlertDescription>
            Choose a server environment key or save a local browser key for {selectedProvider?.label || "this provider"}.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <HugeIcon icon={Settings02Icon} aria-hidden="true" />
        Playground/dev BYOK is for this open-source demo. It is not a recommended production credential system.
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium">Credentials</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Local API keys are encrypted in this browser and stored on this device. They are sent to this app&apos;s API route only when you send a request so the server can call the selected AI provider. They are not stored in a database by Fable UI. Browser storage cannot protect secrets from malicious scripts running on this same site. Use restricted, low-limit keys.
          </p>
        </div>

        {storeError ? (
          <Alert variant="destructive">
            <HugeIcon icon={AlertCircleIcon} aria-hidden="true" />
            <AlertTitle>Browser key storage unavailable</AlertTitle>
            <AlertDescription>{storeError}</AlertDescription>
          </Alert>
        ) : null}



       

        <div className="grid gap-3 rounded-lg border border-border/60 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Label</span>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Personal Google key" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-muted-foreground">API key</span>
              <div className="flex items-center gap-2 relative">
                <Input
                  value={apiKey}
                  type={showKey ? "text" : "password"}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Paste provider key"
                  autoComplete="off"
                  className="pr-6"
                />
                <Button className="absolute right-1" type="button" variant="ghost" size={"icon-sm"} onClick={() => setShowKey((value) => !value)}>
                  {!showKey ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Use key for</span>
            <Select value={scope} onValueChange={(value) => setScope(value as "*" | "model")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">All {selectedProvider?.label || "provider"} models</SelectItem>
                <SelectItem value="model">Only {model}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <div className="flex justify-end">
            <Button type="button" className="w-fit" disabled={!apiKey.trim() || isSaving} onClick={handleSaveKey}>
              {isSaving ? "Saving..." : "Save encrypted on this device"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Saved keys</h4>
          {localKeys.filter((key) => key.provider === provider).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              No local keys saved for {selectedProvider?.label || "this provider"}.
            </p>
          ) : (
            localKeys
              .filter((key) => key.provider === provider)
              .map((key) => {
                const isEligible = isKeyEligibleForModel(key, provider, model);

                return (
                  <div key={key.id} className="grid gap-3 rounded-lg border border-border/60 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{key.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">{key.maskedPreview}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {
                          loadingKeyTest === key.id ?
                            <Badge className="bg-transparent border-0">
                              <Loader className="size-5 animate-spin text-muted-foreground" />
                            </Badge>
                            : <Badge variant={key.status === "valid" ? "default" : key.status === "invalid" ? "destructive" : "secondary"}>
                              {key.status}
                            </Badge>
                        }
                        <Badge variant={isEligible ? "outline" : "secondary"}>
                          {key.modelScope === "*" ? "All provider models" : key.modelScope.join(", ")}
                        </Badge>
                      </div>
                    </div>
                    {key.statusMessage || key.lastTestedAt ? (
                      <p className="text-xs text-muted-foreground">
                        {key.statusMessage || "Last tested"}{key.lastTestedAt ? ` - ${new Date(key.lastTestedAt).toLocaleString()}` : ""}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => handleTestKey(key.id)}>
                        Test key
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleRenameKey(key)}>
                        Rename
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => onDeleteKey(key.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>

      <div className="text-xs text-muted-foreground">
        Server env readiness configures every model for that provider. Local keys are filtered by provider and model scope.
      </div>
    </div>
  );
}
