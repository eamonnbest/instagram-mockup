import type { CanvasBlock } from "@/components/text-overlay-editor"

export interface PostTemplate {
  id: string
  name: string
  category: string
  blocks: CanvasBlock[]
}

// Helper to make IDs unique per template load
let _counter = 0
export function hydrateTemplate(template: PostTemplate): CanvasBlock[] {
  _counter++
  return template.blocks.map((block, i) => ({
    ...block,
    id: `tpl-${_counter}-${i}`,
  }))
}

const S = 1080

// Shared defaults for text blocks to reduce repetition
function text(overrides: Partial<import("@/components/text-overlay-editor").CanvasBlock> & {
  id: string; text: string; x: number; y: number; width: number; fontSize: number; fill: string
}): import("@/components/text-overlay-editor").CanvasBlock {
  return {
    type: "text" as const,
    fontStyle: "bold",
    fontFamily: "Arial",
    align: "left",
    opacity: 1,
    rotation: 0,
    bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
    shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
    lineHeight: 1.1, letterSpacing: 0,
    ...overrides,
  } as import("@/components/text-overlay-editor").CanvasBlock
}

function rect(overrides: Partial<import("@/components/text-overlay-editor").CanvasBlock> & {
  id: string; x: number; y: number; width: number; height: number; fill: string
}): import("@/components/text-overlay-editor").CanvasBlock {
  return {
    type: "rect" as const,
    opacity: 1,
    rotation: 0,
    cornerRadius: 0,
    strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
    ...overrides,
  } as import("@/components/text-overlay-editor").CanvasBlock
}

export const templates: PostTemplate[] = [

  // ──────────────────────────────────────────────────
  // 1. BOLD STAT — Big number on vibrant gradient
  //    Purple-to-coral, huge centered number, small label
  // ──────────────────────────────────────────────────
  {
    id: "bold-stat",
    name: "Bold Stat",
    category: "data",
    blocks: [
      rect({ id: "bg", x: 0, y: 0, width: S, height: S, fill: "#4F46E5", opacity: 1 }),
      rect({ id: "bg2", x: 0, y: S * 0.6, width: S, height: S * 0.4, fill: "#EC4899", opacity: 0.6 }),
      text({
        id: "number", text: "87%",
        x: 100, y: 300, width: 880, fontSize: 220, fill: "#ffffff",
        align: "center", fontFamily: "Impact", letterSpacing: -4,
      }),
      text({
        id: "label", text: "of training is forgotten\nwithin 30 days",
        x: 140, y: 580, width: 800, fontSize: 42, fill: "#ffffff",
        fontStyle: "normal", align: "center", lineHeight: 1.4, opacity: 0.85,
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 2. HORIZONTAL SPLIT — Top color block, bottom for photo
  //    Deep navy top with bold white text
  // ──────────────────────────────────────────────────
  {
    id: "h-split",
    name: "Horizontal Split",
    category: "announcement",
    blocks: [
      rect({ id: "top", x: 0, y: 0, width: S, height: S * 0.45, fill: "#0F172A" }),
      text({
        id: "headline", text: "TITLE",
        x: 80, y: 100, width: 920, fontSize: 96, fill: "#ffffff",
        align: "left", lineHeight: 1.05,
      }),
      text({
        id: "sub", text: "Subtitle text",
        x: 80, y: 240, width: 700, fontSize: 32, fill: "#94A3B8",
        fontStyle: "normal", lineHeight: 1.4,
      }),
      // Accent line
      rect({ id: "accent", x: 80, y: 350, width: 120, height: 6, fill: "#3B82F6" }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 3. VERTICAL SPLIT — Left color panel, right for photo
  //    Warm amber left panel with large text
  // ──────────────────────────────────────────────────
  {
    id: "v-split",
    name: "Vertical Split",
    category: "feature",
    blocks: [
      rect({ id: "left", x: 0, y: 0, width: S * 0.42, height: S, fill: "#F59E0B" }),
      text({
        id: "headline", text: "FILM\nONCE.",
        x: 50, y: 340, width: 380, fontSize: 88, fill: "#0F172A",
        align: "left", lineHeight: 1.05, letterSpacing: -2,
      }),
      text({
        id: "sub", text: "TRAIN\nFOREVER.",
        x: 50, y: 560, width: 380, fontSize: 88, fill: "#ffffff",
        align: "left", lineHeight: 1.05, letterSpacing: -2,
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 4. CARD INSET — Rounded white card on gradient bg
  //    Clean, modern, editorial feel
  // ──────────────────────────────────────────────────
  {
    id: "card-inset",
    name: "Card Inset",
    category: "tip",
    blocks: [
      rect({ id: "bg", x: 0, y: 0, width: S, height: S, fill: "#059669" }),
      rect({ id: "card", x: 60, y: 60, width: S - 120, height: S - 120, fill: "#ffffff", cornerRadius: 32 }),
      rect({ id: "accent", x: 120, y: 160, width: 80, height: 80, fill: "#059669", cornerRadius: 16 }),
      text({
        id: "tag", text: "TIP",
        x: 133, y: 177, width: 60, fontSize: 28, fill: "#ffffff",
        align: "center", fontStyle: "bold",
      }),
      text({
        id: "title", text: "Title goes here",
        x: 120, y: 300, width: 840, fontSize: 64, fill: "#0F172A",
        lineHeight: 1.15,
      }),
      text({
        id: "body", text: "Supporting detail text",
        x: 120, y: 500, width: 840, fontSize: 32, fill: "#64748B",
        fontStyle: "normal", lineHeight: 1.5,
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 5. BOLD STATEMENT — One big word filling the frame
  //    Electric blue, massive outlined text
  // ──────────────────────────────────────────────────
  {
    id: "bold-statement",
    name: "Bold Statement",
    category: "impact",
    blocks: [
      rect({ id: "bg", x: 0, y: 0, width: S, height: S, fill: "#1E1B4B" }),
      text({
        id: "word", text: "STOP",
        x: 40, y: 240, width: 1000, fontSize: 260, fill: "transparent",
        align: "center", fontFamily: "Impact",
        strokeEnabled: true, strokeColor: "#818CF8", strokeWidth: 5,
        letterSpacing: 8,
      }),
      text({
        id: "follow", text: "using WhatsApp\nfor training.",
        x: 140, y: 560, width: 800, fontSize: 52, fill: "#C7D2FE",
        fontStyle: "normal", align: "center", lineHeight: 1.4,
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 6. FRAME — Thick colored border around central area
  //    Coral frame, central area for photo or content
  // ──────────────────────────────────────────────────
  {
    id: "frame",
    name: "Frame",
    category: "showcase",
    blocks: [
      rect({ id: "border", x: 0, y: 0, width: S, height: S, fill: "#E11D48" }),
      rect({ id: "inner", x: 48, y: 48, width: S - 96, height: S - 96, fill: "#ffffff", cornerRadius: 0, opacity: 0.15 }),
      text({
        id: "top-label", text: "NEW",
        x: 80, y: 880, width: 200, fontSize: 24, fill: "#ffffff",
        fontStyle: "bold", letterSpacing: 6,
        bgEnabled: true, bgColor: "#000000", bgOpacity: 0.3, bgPadding: 12, bgCornerRadius: 6,
      }),
      text({
        id: "handle", text: "@lattify",
        x: 750, y: 880, width: 280, fontSize: 24, fill: "#ffffff",
        fontStyle: "normal", align: "right", opacity: 0.7,
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 7. GRADIENT QUOTE — Rich gradient, big quote text
  //    Dark purple to teal, italic serif
  // ──────────────────────────────────────────────────
  {
    id: "gradient-quote",
    name: "Gradient Quote",
    category: "quote",
    blocks: [
      rect({ id: "bg1", x: 0, y: 0, width: S, height: S, fill: "#1E1B4B" }),
      rect({ id: "bg2", x: 0, y: 0, width: S, height: S * 0.5, fill: "#0D9488", opacity: 0.35 }),
      // Large decorative quote mark
      text({
        id: "mark", text: "\u201C",
        x: 60, y: 160, width: 200, fontSize: 300, fill: "#5EEAD4",
        fontFamily: "Georgia", opacity: 0.25, lineHeight: 0.8,
      }),
      text({
        id: "quote", text: "Your quote here",
        x: 100, y: 340, width: 880, fontSize: 56, fill: "#ffffff",
        fontStyle: "italic", fontFamily: "Georgia", align: "center", lineHeight: 1.45,
      }),
      // Divider
      rect({ id: "div", x: S / 2 - 40, y: 620, width: 80, height: 3, fill: "#5EEAD4", opacity: 0.6 }),
      text({
        id: "attr", text: "- Attribution",
        x: 100, y: 660, width: 880, fontSize: 24, fill: "#94A3B8",
        fontStyle: "normal", fontFamily: "Georgia", align: "center",
      }),
    ],
  },

  // ──────────────────────────────────────────────────
  // 8. BOTTOM FADE — Gradient fade at bottom for text
  //    Works on any photo background
  // ──────────────────────────────────────────────────
  {
    id: "bottom-fade",
    name: "Bottom Fade",
    category: "overlay",
    blocks: [
      // Three stacked rects to simulate gradient fade
      rect({ id: "fade1", x: 0, y: S * 0.5, width: S, height: S * 0.15, fill: "#000000", opacity: 0.2 }),
      rect({ id: "fade2", x: 0, y: S * 0.65, width: S, height: S * 0.15, fill: "#000000", opacity: 0.45 }),
      rect({ id: "fade3", x: 0, y: S * 0.8, width: S, height: S * 0.2, fill: "#000000", opacity: 0.75 }),
      text({
        id: "title", text: "Title",
        x: 60, y: 780, width: 960, fontSize: 64, fill: "#ffffff",
        lineHeight: 1.15,
      }),
      text({
        id: "sub", text: "Subtitle",
        x: 60, y: 870, width: 960, fontSize: 28, fill: "#D4D4D8",
        fontStyle: "normal", lineHeight: 1.3,
      }),
    ],
  },
]
