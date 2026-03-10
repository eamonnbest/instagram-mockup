import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null
function getSupabase() {
  if (_supabase) return _supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  return _supabase
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("Missing ELEVENLABS_API_KEY environment variable")
    }

    const { prompt, duration_seconds, instrumental } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Clamp duration: 3s–300s (5 min)
    const durationMs = Math.min(Math.max((duration_seconds || 30) * 1000, 3000), 300000)

    // Call ElevenLabs Music API
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        music_length_ms: durationMs,
        model_id: "music_v1",
        force_instrumental: instrumental ?? false,
      }),
    })

    if (!response.ok) {
      let message = "Music generation failed"
      try {
        const errData = await response.json()
        message = errData.detail?.message || errData.detail || message
      } catch {
        // Response wasn't JSON
      }
      console.error("ElevenLabs error:", message)
      return NextResponse.json({ error: message }, { status: response.status })
    }

    // Response is raw audio binary
    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Upload to Supabase storage
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`

    const { error: uploadError } = await getSupabase().storage
      .from("post-audio")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Audio upload error:", uploadError)
      return NextResponse.json({ error: "Failed to store audio file" }, { status: 500 })
    }

    const { data: urlData } = getSupabase().storage
      .from("post-audio")
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      audioUrl: urlData.publicUrl,
      durationMs,
    })
  } catch (error) {
    console.error("Music generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Music generation failed" },
      { status: 500 },
    )
  }
}
