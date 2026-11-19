export const PRESETS = [
  { id: "neutral", label: "Neutral", swatch: "oklch(0.21 0 0)", note: "Geist · 10px radius" },
  { id: "cobalt", label: "Cobalt", swatch: "oklch(0.52 0.2 262)", note: "Cool blue · 12px" },
  { id: "moss", label: "Moss", swatch: "oklch(0.44 0.09 158)", note: "Deep green · 8px" },
  { id: "rose", label: "Rose", swatch: "oklch(0.58 0.2 8)", note: "Display type · 16px" },
  { id: "editorial", label: "Editorial", swatch: "oklch(0.17 0 0)", note: "Serif headings · 4px" },
  { id: "midnight", label: "Midnight", swatch: "oklch(0.52 0.22 285)", note: "Violet · 14px" },
] as const

export type PresetId = (typeof PRESETS)[number]["id"]
