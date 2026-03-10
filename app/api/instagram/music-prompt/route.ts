import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const anthropic = getClient()
    const { description, styles } = await request.json()

    if (!description && (!styles || styles.length === 0)) {
      return NextResponse.json({ error: "Description or styles required" }, { status: 400 })
    }

    const styleContext = styles?.length > 0 ? `Selected styles: ${styles.join(", ")}. ` : ""

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a music prompt engineer for an AI music generator. The user wants to generate a track for social media content (Instagram posts/reels).

${styleContext}User's description: "${description || "no specific description"}"

Write a detailed music generation prompt that will produce authentic, non-generic music. Be specific about:
- Instrumentation (exact instruments, not just "guitars")
- Production style (lo-fi, raw, polished, etc.)
- Tempo/energy feel
- Reference points ("like [artist] meets [artist]" style references)
- What to AVOID (stock music clichés, corporate feel, etc.)

Keep the prompt under 150 words. Return ONLY the prompt text, nothing else.`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude")
    }

    return NextResponse.json({ success: true, prompt: textBlock.text.trim() })
  } catch (error) {
    console.error("Music prompt error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prompt generation failed" },
      { status: 500 },
    )
  }
}
