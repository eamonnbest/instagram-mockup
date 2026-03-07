import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate Instagram post overlay templates as JSON arrays.
The canvas is 1080x1080 pixels. You return ONLY a valid JSON array of block objects — no explanation, no markdown.

Block types:

TextBlock: { id: string, type: "text", text: string, x: number, y: number, fontSize: number, fill: string, fontStyle: "normal"|"bold"|"italic"|"bold italic", fontFamily: string, align: "left"|"center"|"right", width: number, opacity: number, rotation: number, bgEnabled: boolean, bgColor: string, bgOpacity: number, bgPadding: number, bgCornerRadius: number, shadowEnabled: boolean, shadowColor: string, shadowBlur: number, shadowOffsetX: number, shadowOffsetY: number, strokeEnabled: boolean, strokeColor: string, strokeWidth: number, lineHeight: number, letterSpacing: number }

ShapeBlock (rect): { id: string, type: "rect", x: number, y: number, width: number, height: number, fill: string, opacity: number, rotation: number, cornerRadius: number, strokeEnabled: boolean, strokeColor: string, strokeWidth: number }

EllipseBlock: { id: string, type: "ellipse", x: number, y: number, radiusX: number, radiusY: number, fill: string, opacity: number, rotation: number, strokeEnabled: boolean, strokeColor: string, strokeWidth: number }

LineBlock: { id: string, type: "line", x: number, y: number, points: number[], stroke: string, strokeWidth: number, opacity: number, rotation: number, arrowEnd: boolean, arrowStart: boolean, dash: boolean }

Rules:
- Use placeholder text like "Your headline here" so the user can edit
- Keep text within bounds (x + width < 1080, consider fontSize for y positioning)
- Use IDs like "block-0", "block-1", etc.
- For dark overlays on photos, use semi-transparent black rects (opacity 0.5-0.7)
- Common fonts: Arial, Georgia, Impact, Courier New, Verdana, Trebuchet MS
- All number values must be actual numbers, not strings
- Every property listed above is REQUIRED for each block type — include all of them
- Return ONLY the JSON array, no other text`

export async function POST(request: NextRequest) {
  try {
    const anthropic = getClient()
    const { prompt } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate an Instagram post overlay template for: ${prompt.trim()}`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude")
    }

    const raw = textBlock.text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error("Failed to parse template JSON:", raw.slice(0, 500))
      throw new Error("AI returned invalid template data. Please try again.")
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("AI returned an unexpected format. Please try again.")
    }

    return NextResponse.json({ success: true, blocks: parsed })
  } catch (error) {
    console.error("Template generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Template generation failed" },
      { status: 500 },
    )
  }
}
