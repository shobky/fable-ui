"use client"

import * as React from "react"

import { fableRegistry, type DataSourceRegistry } from "./registry"
import type { DataActionInput, DataQuery, DataSourceContext } from "./types"

type FableDataContextValue = {
  registry: DataSourceRegistry
  context: DataSourceContext
}

const FableDataContext = React.createContext<FableDataContextValue | null>(null)

export function FableDataProvider({
  registry = fableRegistry,
  context = {},
  children,
}: {
  registry?: DataSourceRegistry
  context?: DataSourceContext
  children: React.ReactNode
}) {
  const value = React.useMemo(() => ({ registry, context }), [context, registry])

  return <FableDataContext.Provider value={value}>{children}</FableDataContext.Provider>
}

export function useFableDataContext() {
  const value = React.useContext(FableDataContext)

  if (!value) {
    throw new Error("useFableDataContext must be used within FableDataProvider.")
  }

  return value
}

export function useOptionalFableDataContext() {
  return React.useContext(FableDataContext)
}

export function useFableResource(resourceId: string) {
  const { registry, context } = useFableDataContext()
  const resource = registry.getResource(resourceId)

  const list = React.useCallback(
    (query: DataQuery = {}) => registry.list(resourceId, query, context),
    [context, registry, resourceId],
  )

  const runAction = React.useCallback(
    (input: Omit<DataActionInput, "resourceId">) =>
      registry.executeAction({ ...input, resourceId }, context),
    [context, registry, resourceId],
  )

  return {
    resource,
    list,
    runAction,
  }
}
