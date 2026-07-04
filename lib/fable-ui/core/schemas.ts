import { z } from "zod"

export const dataCellSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])
export const dataRowSchema = z.record(z.string(), z.unknown())

export const dataColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z
    .enum([
      "text",
      "number",
      "currency",
      "date",
      "datetime",
      "boolean",
      "badge",
    ])
    .optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  width: z.union([z.number().positive(), z.string().min(1)]).optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  hidden: z.boolean().optional(),
})

export const dataFilterOptionSchema = z.union([
  z.string(),
  z.object({
    label: z.string().min(1),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
])

export const dataFilterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "text",
    "select",
    "multi-select",
    "date",
    "date-preset",
    "number",
    "boolean",
  ]),
  options: z.array(dataFilterOptionSchema).optional(),
})

export const dataSortSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  directions: z.array(z.enum(["asc", "desc"])).optional(),
})

export const sortStateSchema = z.object({
  key: z.string().min(1),
  direction: z.enum(["asc", "desc"]),
})

export const dataQuerySchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  sort: sortStateSchema.optional(),
  cursor: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
})

export const dataActionFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "textarea", "select", "date", "toggle"]),
  required: z.boolean().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.union([z.string(), z.number(), z.boolean()]),
      })
    )
    .optional(),
})

export const dataActionInputSchema = z.object({
  actionId: z.string().min(1),
  resourceId: z.string().min(1),
  rowId: z.string().optional(),
  values: z.record(z.string(), z.unknown()).optional(),
})
