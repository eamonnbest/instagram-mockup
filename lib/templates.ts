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

const S = 1080 // canvas size

export const templates: PostTemplate[] = [
  // 1. Bold headline — dark overlay, big white text
  {
    id: "bold-headline",
    name: "Bold Headline",
    category: "announcement",
    blocks: [
      {
        id: "bg", type: "rect" as const,
        x: 0, y: 0, width: S, height: S,
        fill: "#000000", opacity: 0.55, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "headline", type: "text" as const,
        text: "YOUR HEADLINE\nGOES HERE",
        x: 90, y: S / 2 - 120, width: 900,
        fontSize: 96, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 8, shadowOffsetX: 2, shadowOffsetY: 2,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.1, letterSpacing: 2,
      },
    ],
  },

  // 2. Headline + subtitle
  {
    id: "headline-subtitle",
    name: "Headline + Subtitle",
    category: "announcement",
    blocks: [
      {
        id: "bg", type: "rect" as const,
        x: 0, y: 0, width: S, height: S,
        fill: "#000000", opacity: 0.5, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "headline", type: "text" as const,
        text: "HEADLINE HERE",
        x: 90, y: 340, width: 900,
        fontSize: 88, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.1, letterSpacing: 2,
      },
      {
        id: "subtitle", type: "text" as const,
        text: "Supporting text that gives more context",
        x: 140, y: 480, width: 800,
        fontSize: 36, fill: "#cccccc",
        fontStyle: "normal", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.4, letterSpacing: 0,
      },
    ],
  },

  // 3. Quote post — large quote marks, centered text
  {
    id: "quote",
    name: "Quote",
    category: "engagement",
    blocks: [
      {
        id: "bg", type: "rect" as const,
        x: 0, y: 0, width: S, height: S,
        fill: "#1a1a2e", opacity: 0.85, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "quotemark", type: "text" as const,
        text: "\u201C",
        x: 80, y: 220, width: 200,
        fontSize: 200, fill: "#e94560",
        fontStyle: "bold", fontFamily: "Georgia",
        align: "left", opacity: 0.8, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1, letterSpacing: 0,
      },
      {
        id: "quotetext", type: "text" as const,
        text: "Your inspiring quote or key message goes right here",
        x: 120, y: 400, width: 840,
        fontSize: 52, fill: "#ffffff",
        fontStyle: "italic", fontFamily: "Georgia",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.4, letterSpacing: 0,
      },
      {
        id: "attribution", type: "text" as const,
        text: "- Attribution",
        x: 120, y: 650, width: 840,
        fontSize: 28, fill: "#888888",
        fontStyle: "normal", fontFamily: "Georgia",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 0,
      },
    ],
  },

  // 4. Bottom bar CTA
  {
    id: "bottom-cta",
    name: "Bottom CTA Bar",
    category: "promotion",
    blocks: [
      {
        id: "bar", type: "rect" as const,
        x: 0, y: 820, width: S, height: 260,
        fill: "#000000", opacity: 0.75, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "cta-text", type: "text" as const,
        text: "YOUR CALL TO ACTION",
        x: 90, y: 860, width: 900,
        fontSize: 56, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.1, letterSpacing: 1,
      },
      {
        id: "cta-sub", type: "text" as const,
        text: "Link in bio | Learn more",
        x: 140, y: 940, width: 800,
        fontSize: 28, fill: "#aaaaaa",
        fontStyle: "normal", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.3, letterSpacing: 0,
      },
    ],
  },

  // 5. Top + bottom text — text at top and bottom of image
  {
    id: "top-bottom",
    name: "Top + Bottom Text",
    category: "engagement",
    blocks: [
      {
        id: "top-bar", type: "rect" as const,
        x: 0, y: 0, width: S, height: 240,
        fill: "#000000", opacity: 0.65, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "top-text", type: "text" as const,
        text: "DID YOU KNOW?",
        x: 90, y: 70, width: 900,
        fontSize: 72, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.1, letterSpacing: 2,
      },
      {
        id: "bottom-bar", type: "rect" as const,
        x: 0, y: 840, width: S, height: 240,
        fill: "#000000", opacity: 0.65, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "bottom-text", type: "text" as const,
        text: "The answer might surprise you",
        x: 90, y: 900, width: 900,
        fontSize: 40, fill: "#ffffff",
        fontStyle: "normal", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.3, letterSpacing: 0,
      },
    ],
  },

  // 6. Outlined text — big text with stroke, no background overlay
  {
    id: "outlined-text",
    name: "Outlined Text",
    category: "bold",
    blocks: [
      {
        id: "headline", type: "text" as const,
        text: "BOLD\nSTATEMENT",
        x: 90, y: S / 2 - 140, width: 900,
        fontSize: 120, fill: "transparent",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: true, strokeColor: "#ffffff", strokeWidth: 4,
        lineHeight: 1.1, letterSpacing: 4,
      },
    ],
  },

  // 7. Pill label — small text in a rounded pill shape
  {
    id: "pill-label",
    name: "Pill Label",
    category: "minimal",
    blocks: [
      {
        id: "label", type: "text" as const,
        text: "NEW POST",
        x: S / 2 - 150, y: S - 180, width: 300,
        fontSize: 32, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: true, bgColor: "#000000", bgOpacity: 0.8, bgPadding: 20, bgCornerRadius: 24,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 2,
      },
    ],
  },

  // 8. Numbered step — for training/how-to content
  {
    id: "step-number",
    name: "Step Number",
    category: "training",
    blocks: [
      {
        id: "circle", type: "ellipse" as const,
        x: 160, y: 160, radiusX: 80, radiusY: 80,
        fill: "#e94560", opacity: 1, rotation: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "number", type: "text" as const,
        text: "1",
        x: 110, y: 110, width: 100,
        fontSize: 72, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1, letterSpacing: 0,
      },
      {
        id: "step-title", type: "text" as const,
        text: "Step title here",
        x: 90, y: 820, width: 900,
        fontSize: 52, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: true, bgColor: "#000000", bgOpacity: 0.6, bgPadding: 20, bgCornerRadius: 12,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 0,
      },
    ],
  },

  // 9. Gradient bottom fade — text readable on any image
  {
    id: "gradient-bottom",
    name: "Bottom Fade",
    category: "versatile",
    blocks: [
      {
        id: "fade", type: "rect" as const,
        x: 0, y: 540, width: S, height: 540,
        fill: "#000000", opacity: 0.7, rotation: 0, cornerRadius: 0,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "title", type: "text" as const,
        text: "Your title here",
        x: 70, y: 750, width: 940,
        fontSize: 64, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 0,
      },
      {
        id: "description", type: "text" as const,
        text: "A short description or subtitle",
        x: 70, y: 870, width: 940,
        fontSize: 30, fill: "#cccccc",
        fontStyle: "normal", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.3, letterSpacing: 0,
      },
    ],
  },

  // 10. Swipe indicator — "Swipe for more" carousel prompt
  {
    id: "swipe-cta",
    name: "Swipe for More",
    category: "carousel",
    blocks: [
      {
        id: "arrow", type: "line" as const,
        x: S - 160, y: S / 2, points: [0, 0, 80, 0],
        stroke: "#ffffff", strokeWidth: 6, opacity: 0.9, rotation: 0,
        arrowEnd: true, arrowStart: false, dash: false,
      },
      {
        id: "swipe-text", type: "text" as const,
        text: "SWIPE",
        x: S - 240, y: S / 2 + 30, width: 200,
        fontSize: 24, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 0.8, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: true, shadowColor: "#000000", shadowBlur: 6, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 4,
      },
    ],
  },

  // 11. Tip/fact card — full overlay with structured content
  {
    id: "tip-card",
    name: "Tip Card",
    category: "educational",
    blocks: [
      {
        id: "bg", type: "rect" as const,
        x: 60, y: 60, width: S - 120, height: S - 120,
        fill: "#ffffff", opacity: 0.92, rotation: 0, cornerRadius: 24,
        strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 0,
      },
      {
        id: "tag", type: "text" as const,
        text: "TIP",
        x: 140, y: 140, width: 200,
        fontSize: 28, fill: "#e94560",
        fontStyle: "bold", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 4,
      },
      {
        id: "tip-title", type: "text" as const,
        text: "Your tip title goes here",
        x: 140, y: 200, width: 800,
        fontSize: 56, fill: "#1a1a1a",
        fontStyle: "bold", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 0,
      },
      {
        id: "tip-body", type: "text" as const,
        text: "Explain the tip in more detail here. Keep it concise and actionable so people actually remember it.",
        x: 140, y: 420, width: 800,
        fontSize: 32, fill: "#444444",
        fontStyle: "normal", fontFamily: "Arial",
        align: "left", opacity: 1, rotation: 0,
        bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.5, letterSpacing: 0,
      },
    ],
  },

  // 12. Minimal corner tag — small label in corner
  {
    id: "corner-tag",
    name: "Corner Tag",
    category: "minimal",
    blocks: [
      {
        id: "tag", type: "text" as const,
        text: "BEFORE",
        x: 40, y: 40, width: 250,
        fontSize: 28, fill: "#ffffff",
        fontStyle: "bold", fontFamily: "Arial",
        align: "center", opacity: 1, rotation: 0,
        bgEnabled: true, bgColor: "#e94560", bgOpacity: 1, bgPadding: 16, bgCornerRadius: 8,
        shadowEnabled: false, shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
        lineHeight: 1.2, letterSpacing: 2,
      },
    ],
  },
]
