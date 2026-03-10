import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null
function getSupabase() {
  if (_supabase) return _supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  return _supabase
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
}

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
}

const ALLOWED_TYPES = { ...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES }

export async function POST(request: Request) {
  try {
    const { contentType, fileSize } = await request.json()

    if (typeof contentType !== "string" || typeof fileSize !== "number" || fileSize <= 0) {
      return NextResponse.json({ error: "Invalid request: contentType (string) and fileSize (number) are required" }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[contentType]
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM." },
        { status: 400 },
      )
    }

    const isVideo = contentType in VIDEO_TYPES
    const isAudio = contentType in AUDIO_TYPES
    const maxSize = isVideo ? 50 * 1024 * 1024 : isAudio ? 50 * 1024 * 1024 : 10 * 1024 * 1024

    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File must be under ${isVideo || isAudio ? "50MB" : "10MB"}` },
        { status: 400 },
      )
    }

    const bucket = isAudio ? "post-audio" : isVideo ? "post-videos" : "post-images"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Generate a signed upload URL (valid for 60 seconds)
    const { data, error } = await getSupabase().storage
      .from(bucket)
      .createSignedUploadUrl(fileName)

    if (error) {
      console.error("Signed URL error:", error)
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
    }

    // Build the final public URL
    const { data: urlData } = getSupabase().storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: fileName,
      publicUrl: urlData.publicUrl,
      isVideo,
    })
  } catch (error) {
    console.error("Upload URL error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
