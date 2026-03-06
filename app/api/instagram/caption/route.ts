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
    const { prompt, style } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const styleGuide: Record<string, string> = {
      casual: "Write in a casual, friendly tone. Use natural language like you're talking to a friend.",
      professional: "Write in a polished, professional tone suitable for a brand account.",
      witty: "Write something clever and witty. Use wordplay or humor.",
      minimal: "Keep it very short and minimal. 1-2 lines max, maybe just a few words.",
    }

    const styleInstruction = styleGuide[style] || styleGuide.casual

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a social media caption writer for an Instagram account called "Lattify" (a coffee business). Generate 3 caption options for a post.

Context/description of the post: ${prompt}

Style: ${styleInstruction}

Rules:
- Each caption should be different in approach
- Include relevant hashtags (3-5 per caption)
- Keep captions concise (under 150 words each)
- Return ONLY a JSON array of 3 strings, no other text
- Example format: ["caption 1", "caption 2", "caption 3"]`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude")
    }

    // Strip markdown code fences if present
    const raw = textBlock.text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()
    const parsed = JSON.parse(raw)

    // Validate that we got an array of strings
    if (!Array.isArray(parsed) || !parsed.every((item: unknown) => typeof item === "string")) {
      throw new Error("Unexpected response format from AI")
    }

    return NextResponse.json({ success: true, captions: parsed })
  } catch (error) {
    console.error("Caption generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Caption generation failed" },
      { status: 500 },
    )
  }
}
