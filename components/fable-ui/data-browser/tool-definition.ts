import { tool } from "ai"
import { z } from "zod"

import { DataBrowser } from "@/components/fable-ui/data-browser/data-browser"
import { ShowTable } from "@/components/fable-ui/data-browser/show-table"
import { defineFableComponent, fableRegistry } from "@/lib/fable-ui/core"
import { dataColumnSchema, dataFilterSchema, dataSortSchema, sortStateSchema } from "@/lib/fable-ui/core/schemas"
import { resolveDataBrowserIntent } from "./resolve-intent"

const rowSchema = z.record(z.string(), z.unknown())

export const showTableInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  columns: z.array(dataColumnSchema).min(1).max(12),
  rows: z.array(rowSchema).max(50),
})

export type ShowTableInput = z.infer<typeof showTableInputSchema>

export const showDataBrowserInputSchema = z.object({
  title: z.string().min(1),
  entityLabel: z.string().min(1).optional(),
  description: z.string().optional(),
  resourceId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Use only a resource id from fableRegistry.getAgentResourceManifest(). Never invent resource ids.",
    ),
  searchPlaceholder: z.string().optional(),
  columns: z.array(dataColumnSchema).optional(),
  rows: z.array(rowSchema).max(50).optional(),
  filters: z.array(dataFilterSchema).optional(),
  sortOptions: z.array(dataSortSchema).optional(),
  initialFilters: z.record(z.string(), z.unknown()).optional(),
  initialSort: sortStateSchema.optional(),
  initialSearch: z.string().optional(),
  visibleColumns: z.array(z.string().min(1)).optional(),
  detail: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      fields: z.array(z.string()).optional(),
    })
    .optional(),
  actionIntents: z
    .array(
      z.object({
        actionId: z.string().min(1),
        rowId: z.string().optional(),
      }),
    )
    .optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})

export type ShowDataBrowserInput = z.infer<typeof showDataBrowserInputSchema>

export function describeAvailableResources() {
  return JSON.stringify(fableRegistry.getAgentResourceManifest(), null, 2)
}

export function createShowTableTool() {
  return tool({
    description:
      "Show a small static table snapshot when display-ready rows are already available. Limit rows to about 50. Do not use for raw SQL, raw Firestore paths, secrets, or authorization decisions.",
    inputSchema: showTableInputSchema,
    execute: async (input) => input,
  })
}

export const showTableTool = createShowTableTool()

export function createShowDataBrowserTool() {
  return tool({
    description: [
      "Show a trusted data browser for search, filters, sort, pagination, or row detail.",
      "Use resourceId only from fableRegistry.getAgentResourceManifest(); never invent resource IDs.",
      "Never pass raw SQL, raw Firestore paths, raw collection names, secrets, or authorization decisions.",
      "The host owns data access, permissions, validation, allowed filters, allowed sorts, and row actions.",
      "If no resourceId is available, include safe static rows and columns only when the data is already present.",
    ].join(" "),
    inputSchema: showDataBrowserInputSchema,
    execute: async (input) => input,
  })
}

export const showDataBrowserTool = createShowDataBrowserTool()

export const showTable = defineFableComponent({
  name: "show_table",
  schema: showTableInputSchema,
  tool: showTableTool,
  renderer: {
    Component: ShowTable,
    loadingProps: { title: "Table", columns: [], rows: [], isLoading: true },
    emptyProps: { title: "Table", columns: [], rows: [] },
    errorProps: (description: string) => ({
      title: "Table unavailable",
      columns: [],
      rows: [],
      error: { title: "Table unavailable", description },
    }),
    toProps: (data: ShowTableInput) => ({ ...data }),
  },
})

export const showDataBrowser = defineFableComponent({
  name: "show_data_browser",
  schema: showDataBrowserInputSchema,
  tool: showDataBrowserTool,
  renderer: {
    Component: DataBrowser,
    loadingProps: {
      title: "Data browser",
      entityLabel: "rows",
      columns: [],
      rows: [],
      isLoading: true,
    },
    emptyProps: { title: "Data browser", entityLabel: "rows", columns: [], rows: [] },
    errorProps: (description: string) => ({
      title: "Data browser unavailable",
      entityLabel: "rows",
      columns: [],
      rows: [],
      error: { title: "Data browser unavailable", description },
    }),
    toProps: (data: ShowDataBrowserInput) => resolveDataBrowserIntent(data),
  },
})
