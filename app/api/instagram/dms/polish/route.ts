import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null
function getSupabase() {
  if (_supabase) return _supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars")
  }
  _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  return _supabase
}

async function loadStyleConfig(): Promise<{ examples: string[]; rules: string }> {
  try {
    const { data } = await getSupabase()
      .from("site_settings")
      .select("key, value")
      .in("key", ["dm_style_examples", "dm_style_rules"])
    const settings: Record<string, string> = {}
    data?.forEach((row: { key: string; value: string }) => { settings[row.key] = row.value })
    let examples: string[] = []
    try { examples = JSON.parse(settings.dm_style_examples || "[]") } catch { /* */ }
    return { examples, rules: settings.dm_style_rules || "" }
  } catch {
    return { examples: [], rules: "" }
  }
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  casual: "Keep it casual and friendly — like texting a colleague you get along with. Use natural, conversational language.",
  professional: "Make it polished and professional — clear, respectful, and business-appropriate. No slang.",
  playful: "Make it warm and playful — add personality, light humor, or a friendly vibe. Don't overdo it.",
  direct: "Make it concise and direct — get straight to the point, no filler, no fluff. Respectful but efficient.",
}

export async function POST(request: NextRequest) {
  try {
    const anthropic = getClient()
    const { draft, tone, business_name, business_type, thread_messages } = await request.json()

    if (!draft || !draft.trim()) {
      return NextResponse.json({ error: "Draft message is required" }, { status: 400 })
    }

    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.casual

    // Load user's style config
    const style = await loadStyleConfig()
    let styleContext = ""
    if (style.examples.length > 0) {
      styleContext += `\n\nIMPORTANT — The user has provided examples of DMs they've written. Match this voice and style closely:\n${style.examples.map((ex, i) => `Example ${i + 1}:\n"${ex}"`).join("\n\n")}`
    }
    if (style.rules) {
      styleContext += `\n\nIMPORTANT — The user has set these style rules. Follow them strictly:\n${style.rules}`
    }

    // Build conversation context from recent messages (limit to last 10 to control prompt size)
    let threadContext = ""
    if (thread_messages && thread_messages.length > 0) {
      const recent = thread_messages.slice(-10)
      const formatted = recent
        .map((m: { sender: string; content: string }) =>
          `${m.sender === "me" ? "Me" : business_name || "Them"}: ${m.content}`
        )
        .join("\n\n")
      threadContext = `\n\nRecent conversation (last ${recent.length} messages):\n${formatted}\n\nThe user wants to polish their next message in this conversation.`
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a DM writing assistant for a business called "Lattify".

About Lattify: Lattify is a training tool for businesses. You film one phone video and Lattify turns it into a step-by-step guide for your entire team. It extracts steps, timings, and equipment automatically. Staff follow on their phone with built-in help. Target customers: restaurants, retail, trades, cafes & bars, hotels. Brand voice: practical, no-nonsense, relatable to small business owners.

The user is writing a DM to ${business_name || "a business"}${business_type ? ` (${business_type})` : ""}.${threadContext}

Their draft message:
"${draft}"

Tone: ${toneInstruction}${styleContext}

Your job:
1. Polish the draft — fix awkward phrasing, improve flow, tighten language
2. Keep the user's voice and intent intact — don't rewrite it into something generic. If example DMs were provided, match that voice closely.
3. Keep approximately the same length (don't pad it out)
4. If the draft is already good, make minimal changes
5. Return ONLY a JSON object with two keys:
   - "polished": the polished version of their message (string)
   - "suggestions": 1-2 brief tips about the message, like "consider mentioning a specific post of theirs" or "the opening is strong" (array of strings)

Return ONLY the JSON object, no other text.`,
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
      console.error("Failed to parse AI response as JSON:", raw.slice(0, 500))
      throw new Error("AI returned an invalid response. Please try again.")
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("polished" in parsed) ||
      typeof (parsed as Record<string, unknown>).polished !== "string"
    ) {
      throw new Error("AI returned an unexpected format. Please try again.")
    }

    return NextResponse.json({
      success: true,
      polished: (parsed as { polished: string }).polished,
      suggestions: (parsed as { suggestions?: string[] }).suggestions || [],
    })
  } catch (error) {
    console.error("DM polish error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Polish failed" },
      { status: 500 },
    )
  }
}
