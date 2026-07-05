// components/provider-settings.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  Edit,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Loader,
  Pencil,
  Plus,
  Server,
  TestTube2,
  Trash2,
} from "lucide-react";

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
import {
  type ProviderCredentialSource,
  modelCatalog,
  ProviderId,
  ProviderReadiness,
} from "@/lib/ai/provider-config";
import { type StoredProviderKey, isKeyEligibleForModel } from "@/lib/ai/client-provider-key-store";

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

const sourceMeta: Record<ProviderCredentialSource,
  { icon: typeof Server; label: string; blurb: string }> = {
  "server-env": { icon: Server, label: "Server key", blurb: "Uses the key configured in the deployment env." },
  "browser-key": { icon: KeyRound, label: "Browser key", blurb: "Uses a key you saved, encrypted, in this browser." },
  "session-key": { icon: KeyRound, label: "Session key", blurb: "Uses a key provided for this session only." },
  none: { icon: Ban, label: "None", blurb: "Requests run in mock mode, no provider is called." },
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
  const [manageOpen, setManageOpen] = useState(false);

  const selectedProvider =
    providerReadiness.find((candidate) => candidate.id === provider) || providerReadiness[0]!;
  const modelOptions = modelCatalog[provider] || [selectedProvider.defaultModel];
  const eligibleKeys = useMemo(
    () => localKeys.filter((key) => isKeyEligibleForModel(key, provider, model)),
    [localKeys, model, provider],
  );
  const providerKeys = useMemo(
    () => localKeys.filter((key) => key.provider === provider),
    [localKeys, provider],
  );
  const readiness = selectedProvider.modelReadiness?.[model];
  const selectedKey = localKeys.find((key) => key.id === selectedKeyId);
  const isReady = Boolean(readiness?.isConfigured);

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
    if (!nextLabel || nextLabel === key.label) return;
    await onRenameKey(key.id, nextLabel);
  }

  async function handleTestKey(id: string) {
    try {
      setLoadingKeyTest(id);
      await onTestKey(id);
    } finally {
      setLoadingKeyTest(null);
    }
  }

  return (
    <div className="flex max-h-[75svh] flex-col gap-5 overflow-y-auto px-4 pb-6 pt-1 sm:px-6">
      {/* ── Status summary ─────────────────────────────────────────── */}
      <div
        className={`flex items-start gap-3 rounded-lg text-sm`}
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
            isReady ? "bg-green-500/15 text-green-600" : "bg-destructive/15 text-destructive"
          }`}
        >
          {isReady ? <Check className="size-3.5" /> : <Ban className="size-3.5" />}
        </span>
        <div className="min-w-0">
          <p className={`font-medium ${
          isReady ? "text-green-500" : "text-red-500"
        }`}>
            {selectedProvider.label} · {model || selectedProvider.defaultModel}
          </p>
          <p className="text-xs text-muted-foreground">
            {isReady
              ? `Ready via ${sourceMeta[credentialSource].label.toLowerCase()}${
                  selectedKey ? ` "${selectedKey.label}"` : ""
                }.`
              : "Not configured yet — pick a key source below."}
          </p>
        </div>
      </div>

      {/* ── Provider / Model ───────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Provider</span>
          <Select value={provider} onValueChange={(value) => onProviderChange(value as ProviderId)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Providers</SelectLabel>
                {providerReadiness.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex items-center gap-2">
                      {option.label}
                      {option.isConfigured ? (
                        <span className="size-1.5 rounded-full bg-green-500" />
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Model</span>
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

      {/* ── Key source ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Key source</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["server-env", "browser-key", "none"] as ProviderCredentialSource[]).map((source) => {
            const meta = sourceMeta[source];
            const Icon = meta.icon;
            const disabled =
              (source === "server-env" && !selectedProvider?.serverConfigured) ||
              (source === "browser-key" && eligibleKeys.length === 0);
            const active = credentialSource === source;

            return (
              <button
                key={source}
                type="button"
                disabled={disabled}
                onClick={() => onCredentialSourceChange(source)}
                className={`flex flex-col gap-1  rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "bg-secondary"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="size-3.5" />
                  {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {disabled
                    ? source === "server-env"
                      ? "Not configured on the server"
                      : "No saved key fits this model"
                    : meta.blurb}
                </span>
              </button>
            );
          })}
        </div>

        {credentialSource === "browser-key" && eligibleKeys.length > 1 ? (
          <Select value={selectedKeyId || ""} onValueChange={(value) => onSelectedKeyChange(value || undefined)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose which saved key" />
            </SelectTrigger>
            <SelectContent>
              {eligibleKeys.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {key.label} ({key.maskedPreview})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {!isReady ? (
        <Alert variant="destructive">
          <AlertTitle>This model needs a provider API key</AlertTitle>
          <AlertDescription>
            Choose a server environment key above, or add a local browser key below for{" "}
            {selectedProvider?.label || "this provider"}.
          </AlertDescription>
        </Alert>
      ) : null}

      {storeError ? (
        <Alert variant="destructive">
          <AlertTitle>Browser key storage unavailable</AlertTitle>
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      ) : null}

      {/* ── Manage keys (collapsed by default) ─────────────────────── */}
      <details
        className="group rounded-xl border border-border/60"
        open={manageOpen}
        onToggle={(event) => setManageOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            Manage saved keys
            {providerKeys.length > 0 ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {providerKeys.length}
              </Badge>
            ) : null}
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="flex flex-col gap-4 border-t border-border/60 p-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Keys are encrypted in this browser and only sent to this app&apos;s API route when you send a
            request. They&apos;re never stored in a database. Use restricted, low-limit keys — browser storage
            can&apos;t protect secrets from malicious scripts on this site.
          </p>

          <div className="grid gap-3 rounded-lg border border-border/60 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Label</span>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Personal Google key" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">API key</span>
                <div className="relative flex items-center gap-2">
                  <Input
                    value={apiKey}
                    type={showKey ? "text" : "password"}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste provider key"
                    autoComplete="off"
                    className="pr-9"
                  />
                  <Button
                    className="absolute right-1"
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowKey((v) => !v)}
                  >
                    {showKey ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Use key for</span>
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
              <Button type="button" disabled={!apiKey.trim() || isSaving} onClick={handleSaveKey}>
                <Plus className="size-4" />
                {isSaving ? "Saving…" : "Save encrypted key"}
              </Button>
            </div>
          </div>

          {providerKeys.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              No local keys saved for {selectedProvider?.label || "this provider"} yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {providerKeys.map((key) => {
                const isEligible = isKeyEligibleForModel(key, provider, model);
                const isTesting = loadingKeyTest === key.id;

                return (
                  <div
                    key={key.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 p-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">{key.label}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{key.maskedPreview}</p>
                      </div>
                      {isTesting ? (
                        <Loader className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <Badge
                          variant={key.status === "valid" ? "default" : key.status === "invalid" ? "destructive" : "secondary"}
                          className="shrink-0"
                        >
                          {key.status}
                        </Badge>
                      )}
                      <Badge variant={isEligible ? "outline" : "secondary"} className="hidden shrink-0 sm:inline-flex">
                        {key.modelScope === "*" ? "All models" : key.modelScope.join(", ")}
                      </Badge>
                    </div>

                    <div className="flex shrink-0 gap-1 self-end sm:self-auto">
                      <Button type="button" size="sm" variant="ghost" title="Test key" onClick={() => handleTestKey(key.id)}>
                       Test
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" title="Rename" onClick={() => handleRenameKey(key)}>
                        <Edit className="size-4" />
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" title="Delete" onClick={() => onDeleteKey(key.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}