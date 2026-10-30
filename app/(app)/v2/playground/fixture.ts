import type {
  FableViewData,
  FableViewSpec,
} from "@/components/fable-ui/v2/catalog"
import type { FableLinkCatalog } from "@/components/fable-ui/v2/rich-content-utils"

export const demoSpec: FableViewSpec = {
  root: "response",
  elements: {
    response: {
      type: "Stack",
      props: { direction: "vertical", gap: 4 },
      children: [
        "headline",
        "summary",
        "metric",
        "destination-filter",
        "properties",
        "trend",
      ],
    },
    headline: {
      type: "Text",
      props: {
        content: "Coral House leads direct bookings across the portfolio.",
        level: "heading",
      },
      children: [],
    },
    summary: {
      type: "RichContent",
      props: {
        blocks: [
          {
            type: "paragraph",
            spans: [
              {
                type: "text",
                text: "Review the 30-day booking trend, then use the destination filter to compare properties. ",
                mark: "plain",
              },
              {
                type: "text",
                text: "Values below come from the host dataset.",
                mark: "strong",
              },
            ],
          },
          {
            type: "heading",
            level: 3,
            spans: [{ type: "text", text: "Quick read", mark: "plain" }],
          },
          {
            type: "list",
            ordered: false,
            items: [
              [
                {
                  type: "text",
                  text: "Compare the property cards by destination.",
                  mark: "plain",
                },
              ],
              [
                {
                  type: "text",
                  text: "The chart and headline values are host supplied.",
                  mark: "plain",
                },
              ],
            ],
          },
          {
            type: "paragraph",
            spans: [
              {
                type: "text",
                text: "See the installation and component API: ",
                mark: "plain",
              },
              { type: "link", linkId: "v2-guide" },
            ],
          },
        ],
      },
      children: [],
    },
    metric: {
      type: "Metric",
      props: { resultId: "direct-bookings" },
      children: [],
    },
    "destination-filter": {
      type: "Filter",
      props: { filterId: "destination" },
      children: [],
    },
    properties: {
      type: "EntityList",
      props: {
        resultId: "property-performance",
        filterId: "destination",
      },
      children: [],
    },
    trend: {
      type: "Chart",
      props: { resultId: "weekly-bookings" },
      children: [],
    },
  },
}

export const demoLinks: FableLinkCatalog = {
  "v2-guide": {
    href: "/docs/components/v2",
    label: "Fable UI v2 guide",
  },
}

export const demoData: FableViewData = {
  "direct-bookings": {
    kind: "metric",
    label: "Direct bookings · 30 days",
    value: 2194,
    format: "number",
    unit: "bookings",
  },
  "property-performance": {
    kind: "entity-list",
    label: "Property performance",
    valueLabel: "Direct bookings",
    locale: "en",
    items: [
      {
        id: "coral-house",
        name: "Coral House",
        location: "Dahab",
        description:
          "A quiet stay near the lagoon, popular with longer visits.",
        value: 962,
        unit: "bookings",
        changePercent: 16,
        filterValues: { destination: "dahab" },
      },
      {
        id: "blue-dune-studio",
        name: "Blue Dune Studio",
        location: "Dahab",
        description: "Compact studios with strong midweek occupancy.",
        value: 824,
        unit: "bookings",
        changePercent: 9,
        filterValues: { destination: "dahab" },
      },
      {
        id: "cedar-town-hotel",
        name: "Cedar Town Hotel",
        location: "Cairo",
        description: "A central base for short city breaks and work trips.",
        value: 408,
        unit: "bookings",
        changePercent: -3,
        filterValues: { destination: "cairo" },
      },
    ],
  },
  destination: {
    kind: "filter",
    label: "Filter properties by destination",
    allValue: "all",
    options: [
      { label: "All destinations", value: "all" },
      { label: "Dahab", value: "dahab" },
      { label: "Cairo", value: "cairo" },
    ],
  },
  "weekly-bookings": {
    kind: "chart",
    label: "Direct bookings by week",
    format: "number",
    points: [
      { label: "Oct 1", value: 420 },
      { label: "Oct 8", value: 502 },
      { label: "Oct 15", value: 581 },
      { label: "Oct 22", value: 691 },
    ],
  },
}
