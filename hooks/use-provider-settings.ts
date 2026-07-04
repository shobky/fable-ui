"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  type ModelReadiness,
  type ProviderCredentialSource,
  type ProviderId,
  type ProviderReadiness,
  isProviderId,
  modelCatalog,
} from "@/lib/ai/provider-config"
import {
  type ProviderKeyInput,
  type StoredProviderKey,
  deleteStoredProviderKey,
  decryptStoredProviderKey,
  isKeyEligibleForModel,
  listStoredProviderKeys,
  markStoredProviderKeyUsed,
  renameStoredProviderKey,
  saveStoredProviderKey,
  updateStoredProviderKeyStatus,
} from "@/lib/ai/client-provider-key-store"

export type ProviderSelection = {
  provider: ProviderId
  model: string
  credentialSource: ProviderCredentialSource
  selectedKeyId?: string
}

type UseProviderSettingsInput = {
  defaults: {
    provider: ProviderId
    model: string
  }
  serverReadiness: ProviderReadiness[]
}

const selectionStorageKey = "fable-ui-provider-selection"
const defaultCredentialSource: ProviderCredentialSource =
  process.env.NEXT_PUBLIC_FABLE_UI_DEMO_MODE === "mock" ? "none" : "server-env"

function readStoredSelection(): Partial<ProviderSelection> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(selectionStorageKey) || "{}"
    ) as Partial<ProviderSelection>
  } catch {
    return {}
  }
}

function isSource(value: unknown): value is ProviderCredentialSource {
  return (
    value === "server-env" ||
    value === "browser-key" ||
    value === "session-key" ||
    value === "none"
  )
}

function eligibleKeys(
  localKeys: StoredProviderKey[],
  provider: ProviderId,
  model: string
) {
  return localKeys.filter((key) => isKeyEligibleForModel(key, provider, model))
}

export function getClientProviderReadiness({
  serverReadiness,
  localKeys,
  selectedProvider,
  selectedModel,
  selectedKeyId,
}: {
  serverReadiness: ProviderReadiness[]
  localKeys: StoredProviderKey[]
  selectedProvider: ProviderId
  selectedModel: string
  selectedKeyId?: string
}) {
  return serverReadiness.map((provider) => {
    const providerKeys = localKeys.filter((key) => key.provider === provider.id)
    const models = modelCatalog[provider.id] || [provider.defaultModel]
    const modelReadiness = Object.fromEntries(
      models.map((model) => {
        const matchingKeys = eligibleKeys(localKeys, provider.id, model)
        const serverConfigured =
          provider.serverConfigured || provider.isConfigured
        const source = serverConfigured
          ? "server-env"
          : matchingKeys.length > 0
            ? "browser-key"
            : "none"
        const readiness: ModelReadiness = {
          model,
          isConfigured: serverConfigured || matchingKeys.length > 0,
          source,
          eligibleLocalKeyCount: matchingKeys.length,
          selectedKeyId:
            provider.id === selectedProvider && model === selectedModel
              ? selectedKeyId
              : undefined,
        }

        return [model, readiness]
      })
    )
    const browserConfigured = providerKeys.length > 0

    return {
      ...provider,
      serverConfigured: provider.serverConfigured || provider.isConfigured,
      browserConfigured,
      localKeyCount: providerKeys.length,
      isConfigured:
        provider.serverConfigured || provider.isConfigured || browserConfigured,
      modelReadiness,
    } satisfies ProviderReadiness
  })
}

export function useProviderSettings({
  defaults,
  serverReadiness,
}: UseProviderSettingsInput) {
  const storedSelection = useMemo(() => readStoredSelection(), [])
  const [provider, setProviderState] = useState<ProviderId>(
    isProviderId(storedSelection.provider)
      ? storedSelection.provider
      : defaults.provider
  )
  const [model, setModelState] = useState(
    storedSelection.model || defaults.model
  )
  const [credentialSource, setCredentialSourceState] =
    useState<ProviderCredentialSource>(
      isSource(storedSelection.credentialSource)
        ? storedSelection.credentialSource
        : defaultCredentialSource
    )
  const [selectedKeyId, setSelectedKeyIdState] = useState<string | undefined>(
    storedSelection.selectedKeyId
  )
  const [localKeys, setLocalKeys] = useState<StoredProviderKey[]>([])
  const [storeError, setStoreError] = useState<string | null>(null)

  const refreshKeys = useCallback(async () => {
    try {
      setLocalKeys(await listStoredProviderKeys())
      setStoreError(null)
    } catch (error) {
      setStoreError(
        error instanceof Error
          ? error.message
          : "Could not open encrypted browser key storage."
      )
    }
  }, [])

  useEffect(() => {
    let isActive = true

    queueMicrotask(() => {
      if (isActive) {
        void refreshKeys()
      }
    })

    return () => {
      isActive = false
    }
  }, [refreshKeys])

  const readiness = useMemo(
    () =>
      getClientProviderReadiness({
        serverReadiness,
        localKeys,
        selectedProvider: provider,
        selectedModel: model,
        selectedKeyId,
      }),
    [localKeys, model, provider, selectedKeyId, serverReadiness]
  )

  const selectedProviderReadiness = readiness.find(
    (candidate) => candidate.id === provider
  )
  const selectedModelReadiness =
    selectedProviderReadiness?.modelReadiness?.[model]
  const currentEligibleKeys = useMemo(
    () => eligibleKeys(localKeys, provider, model),
    [localKeys, model, provider]
  )

  useEffect(() => {
    const hasServerKey = Boolean(selectedProviderReadiness?.serverConfigured)
    const selectedKeyIsEligible = currentEligibleKeys.some(
      (key) => key.id === selectedKeyId
    )

    if (credentialSource === "browser-key" && !selectedKeyIsEligible) {
      const nextKey = currentEligibleKeys[0]

      queueMicrotask(() => {
        if (nextKey) {
          setSelectedKeyIdState(nextKey.id)
        } else if (hasServerKey) {
          setCredentialSourceState("server-env")
          setSelectedKeyIdState(undefined)
        } else {
          setCredentialSourceState("none")
          setSelectedKeyIdState(undefined)
        }
      })
    }
  }, [
    credentialSource,
    currentEligibleKeys,
    selectedKeyId,
    selectedProviderReadiness?.serverConfigured,
  ])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(
      selectionStorageKey,
      JSON.stringify({ provider, model, credentialSource, selectedKeyId })
    )
  }, [credentialSource, model, provider, selectedKeyId])

  const setProvider = useCallback(
    (nextProvider: ProviderId) => {
      const next = readiness.find((candidate) => candidate.id === nextProvider)
      setProviderState(nextProvider)
      setModelState(next?.defaultModel || "")
    },
    [readiness, setModelState, setProviderState]
  )

  const setModel = useCallback(
    (nextModel: string) => {
      setModelState(nextModel)
    },
    [setModelState]
  )

  const setCredentialSource = useCallback(
    (source: ProviderCredentialSource) => {
      setCredentialSourceState(source)
      if (source !== "browser-key") {
        setSelectedKeyIdState(undefined)
      }
    },
    [setCredentialSourceState, setSelectedKeyIdState]
  )

  const addKey = useCallback(
    async (input: ProviderKeyInput) => {
      const saved = await saveStoredProviderKey(input)
      await refreshKeys()
      setCredentialSourceState("browser-key")
      setSelectedKeyIdState(saved.id)
    },
    [refreshKeys]
  )

  const deleteKey = useCallback(
    async (keyId: string) => {
      await deleteStoredProviderKey(keyId)
      await refreshKeys()

      if (selectedKeyId === keyId) {
        setSelectedKeyIdState(undefined)
      }
    },
    [refreshKeys, selectedKeyId]
  )

  const renameKey = useCallback(
    async (keyId: string, label: string) => {
      await renameStoredProviderKey(keyId, label)
      await refreshKeys()
    },
    [refreshKeys]
  )

  const testKey = useCallback(
    async (keyId: string) => {
      const key = localKeys.find((candidate) => candidate.id === keyId)

      if (!key) {
        return
      }

      try {
        const apiKey = await decryptStoredProviderKey(keyId)
        const response = await fetch("/api/ai/test-provider-key", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: key.provider,
            model,
            apiKey,
          }),
        })
        const result = (await response.json()) as {
          ok?: boolean
          message?: string
        }

        await updateStoredProviderKeyStatus(
          keyId,
          response.ok && result.ok ? "valid" : "invalid",
          result.message || "Key test finished."
        )
      } catch (error) {
        console.error("Error testing provider key:", error)
        await updateStoredProviderKeyStatus(
          keyId,
          "invalid",
          error instanceof Error ? error.message : "Key test failed."
        )
      } finally {
        await refreshKeys()
      }
    },
    [localKeys, model, refreshKeys]
  )

  const resolveRequestCredentials = useCallback(async () => {
    if (
      credentialSource !== "browser-key" &&
      credentialSource !== "session-key"
    ) {
      return { credentialSource }
    }

    if (!selectedKeyId) {
      throw new Error(
        "Select a saved browser key before sending a live provider request."
      )
    }

    const apiKey = await decryptStoredProviderKey(selectedKeyId)
    await markStoredProviderKeyUsed(selectedKeyId)
    await refreshKeys()

    return {
      credentialSource,
      selectedKeyId,
      apiKey,
    }
  }, [credentialSource, refreshKeys, selectedKeyId])

  return {
    provider,
    model,
    credentialSource,
    selectedKeyId,
    localKeys,
    eligibleKeys: currentEligibleKeys,
    readiness,
    selectedProviderReadiness,
    selectedModelReadiness,
    storeError,
    setProvider,
    setModel,
    setCredentialSource,
    setSelectedKeyId: setSelectedKeyIdState,
    addKey,
    deleteKey,
    renameKey,
    testKey,
    resolveRequestCredentials,
  }
}
