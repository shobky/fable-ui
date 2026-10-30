"use client"

import { useState } from "react"

import { FableBarChart } from "@/components/fable-ui/v2/chart"
import {
  FableAssetCatalogSchema,
  FableLinkCatalogSchema,
  FableViewDataSchema,
  validateFableViewSpec,
  type FableElement,
  type FableFilterResult,
} from "./catalog"
import { FableEntityCard } from "@/components/fable-ui/v2/entity-card"
import { FableFilterBar } from "@/components/fable-ui/v2/filter-bar"
import { FableMediaImage } from "@/components/fable-ui/v2/media-image"
import { FableMetricCard } from "@/components/fable-ui/v2/metric-card"
import {
  FableGrid,
  Section,
  Stack,
  Surface,
} from "@/components/fable-ui/v2/layout"
import {
  FableRichText,
  FableTypography,
} from "@/components/fable-ui/v2/typography"
import { FableRichContent } from "@/components/fable-ui/v2/rich-content"
import { cn } from "@/lib/utils"

export interface FableSpecRendererProps {
  /** Model-facing JSON is validated again before any element can render. */
  spec: unknown
  /** Values come from the host, keyed by IDs the host has authorized. */
  data: unknown
  /** Local, host-curated image paths. Remote and protocol-relative paths fail closed. */
  assets?: unknown
  /** Host-authorized link destinations and their visible labels. */
  links?: unknown
  className?: string
}

function Unavailable({ label }: { label: string }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground"
    >
      {label} is unavailable.
    </p>
  )
}

function filterSelection(
  filter: FableFilterResult,
  currentValue: string | undefined
) {
  const allowedValues = new Set(filter.options.map((option) => option.value))
  return currentValue && allowedValues.has(currentValue)
    ? currentValue
    : filter.allValue
}

export function FableSpecRenderer({
  spec,
  data,
  assets,
  links,
  className,
}: FableSpecRendererProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const parsedSpec = validateFableViewSpec(spec)
  const parsedData = FableViewDataSchema.safeParse(data)
  const parsedAssets = FableAssetCatalogSchema.safeParse(assets ?? {})
  const parsedLinks = FableLinkCatalogSchema.safeParse(links ?? {})

  if (!parsedSpec.success) {
    return (
      <div
        role="status"
        data-fable-ui-error="invalid-spec"
        className={cn(
          "rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground",
          className
        )}
      >
        This response layout could not be displayed safely.
      </div>
    )
  }

  if (!parsedData.success) {
    return (
      <div
        role="status"
        data-fable-ui-error="invalid-data"
        className={cn(
          "rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground",
          className
        )}
      >
        Supporting data is unavailable.
      </div>
    )
  }

  const specValue = parsedSpec.data
  const dataValue = parsedData.data
  const assetValue = parsedAssets.success ? parsedAssets.data : {}
  const linkValue = parsedLinks.success ? parsedLinks.data : {}

  const renderNode = (id: string, depth = 0): React.ReactNode => {
    if (depth > 6 || !Object.hasOwn(specValue.elements, id)) return null
    const element: FableElement = specValue.elements[id]

    switch (element.type) {
      case "Text": {
        const as = element.props.level === "heading" ? "h2" : "p"
        return (
          <FableTypography key={id} as={as} level={element.props.level}>
            {element.props.content}
          </FableTypography>
        )
      }
      case "RichText":
        return <FableRichText key={id} spans={element.props.spans} />
      case "RichContent":
        return (
          <FableRichContent
            key={id}
            blocks={element.props.blocks}
            links={linkValue}
          />
        )
      case "Metric": {
        const result = Object.hasOwn(dataValue, element.props.resultId)
          ? dataValue[element.props.resultId]
          : undefined
        if (!result || result.kind !== "metric") {
          return <Unavailable key={id} label="Metric data" />
        }
        return (
          <FableMetricCard
            key={id}
            label={result.label}
            value={result.value}
            format={result.format}
            currency={result.currency}
            unit={result.unit}
            locale={result.locale}
          />
        )
      }
      case "EntityList": {
        const result = Object.hasOwn(dataValue, element.props.resultId)
          ? dataValue[element.props.resultId]
          : undefined
        if (!result || result.kind !== "entity-list") {
          return <Unavailable key={id} label="Entity data" />
        }

        const filterResult = element.props.filterId
          ? dataValue[element.props.filterId]
          : undefined
        if (element.props.filterId && filterResult?.kind !== "filter") {
          return <Unavailable key={id} label="Filter data" />
        }

        const currentFilter =
          filterResult?.kind === "filter"
            ? filterSelection(
                filterResult,
                filterValues[element.props.filterId ?? ""]
              )
            : undefined
        const allFilterValue =
          filterResult?.kind === "filter" ? filterResult.allValue : undefined
        const items = result.items.filter((item) => {
          if (!element.props.filterId || currentFilter === allFilterValue)
            return true
          return item.filterValues?.[element.props.filterId] === currentFilter
        })

        return (
          <section
            key={id}
            aria-label={result.label}
            className="min-w-0 space-y-3"
          >
            <FableTypography
              as="h3"
              level="heading"
              className="text-base sm:text-lg"
            >
              {result.label}
            </FableTypography>
            {items.length > 0 ? (
              <FableGrid columns={3} gap={3}>
                {items.map((item) => (
                  <FableEntityCard
                    key={item.id}
                    name={item.name}
                    location={item.location}
                    description={item.description}
                    value={item.value}
                    unit={item.unit}
                    locale={result.locale}
                    changePercent={item.changePercent}
                    valueLabel={result.valueLabel ?? "Value"}
                  />
                ))}
              </FableGrid>
            ) : (
              <p
                role="status"
                className="rounded-xl bg-muted/50 px-4 py-5 text-sm text-muted-foreground"
              >
                No items match this filter.
              </p>
            )}
          </section>
        )
      }
      case "Chart": {
        const result = Object.hasOwn(dataValue, element.props.resultId)
          ? dataValue[element.props.resultId]
          : undefined
        if (!result || result.kind !== "chart") {
          return <Unavailable key={id} label="Chart data" />
        }
        return (
          <FableBarChart
            key={id}
            label={result.label}
            points={result.points}
            format={result.format}
            currency={result.currency}
            locale={result.locale}
          />
        )
      }
      case "Filter": {
        const result = Object.hasOwn(dataValue, element.props.filterId)
          ? dataValue[element.props.filterId]
          : undefined
        if (!result || result.kind !== "filter") {
          return <Unavailable key={id} label="Filter options" />
        }
        const currentValue = filterSelection(
          result,
          filterValues[element.props.filterId]
        )
        return (
          <FableFilterBar
            key={id}
            label={result.label}
            options={result.options}
            value={currentValue}
            onValueChange={(value) => {
              if (result.options.some((option) => option.value === value)) {
                setFilterValues((current) => ({
                  ...current,
                  [element.props.filterId]: value,
                }))
              }
            }}
          />
        )
      }
      case "Media": {
        const src = Object.hasOwn(assetValue, element.props.assetId)
          ? assetValue[element.props.assetId]
          : undefined
        if (!src) return <Unavailable key={id} label="Image" />
        return (
          <FableMediaImage
            key={id}
            src={src.src}
            alt={src.alt}
            decorative={src.decorative}
          />
        )
      }
      case "Stack": {
        const children = element.children.map((childId) =>
          renderNode(childId, depth + 1)
        )
        return (
          <Stack
            key={id}
            direction={element.props.direction}
            gap={element.props.gap}
          >
            {children}
          </Stack>
        )
      }
      case "Grid":
        return (
          <FableGrid
            key={id}
            gap={element.props.gap}
            columns={element.props.columns}
          >
            {element.children.map((childId) => renderNode(childId, depth + 1))}
          </FableGrid>
        )
      case "Section":
        return (
          <Section
            key={id}
            gap={element.props.gap}
            aria-label={element.props.title}
          >
            {element.props.title ? (
              <FableTypography
                as="h3"
                level="heading"
                className="text-base sm:text-lg"
              >
                {element.props.title}
              </FableTypography>
            ) : null}
            {element.children.map((childId) => renderNode(childId, depth + 1))}
          </Section>
        )
      case "Surface":
        return (
          <Surface
            key={id}
            variant={element.props.variant}
            padding={element.props.padding}
          >
            {element.children.map((childId) => renderNode(childId, depth + 1))}
          </Surface>
        )
      default:
        return null
    }
  }

  return (
    <div data-fable-ui="v2-renderer" className={cn("min-w-0", className)}>
      {renderNode(specValue.root)}
    </div>
  )
}
