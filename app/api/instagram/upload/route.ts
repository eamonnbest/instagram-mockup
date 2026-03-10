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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function detectImageType(buffer: Buffer): { ext: string; contentType: string } | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return { ext: "jpg", contentType: "image/jpeg" }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { ext: "png", contentType: "image/png" }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return { ext: "gif", contentType: "image/gif" }
  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return { ext: "webp", contentType: "image/webp" }
  return null
}

function detectVideoType(buffer: Buffer): { ext: string; contentType: string } | null {
  if (buffer.length < 12) return null
  // MP4/MOV: ftyp box at offset 4
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    // Check sub-type to distinguish MP4 vs MOV
    const brand = buffer.slice(8, 12).toString("ascii")
    if (brand === "qt  ") return { ext: "mov", contentType: "video/quicktime" }
    return { ext: "mp4", contentType: "video/mp4" }
  }
  // WebM: starts with 0x1A45DFA3 (EBML header)
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) return { ext: "webm", contentType: "video/webm" }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Try image first, then video
    const imageType = detectImageType(buffer)
    const videoType = !imageType ? detectVideoType(buffer) : null
    const detected = imageType || videoType
    const isVideo = !!videoType

    if (!detected) {
      return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM." }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File must be under ${isVideo ? "50MB" : "10MB"}` }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${detected.ext}`

    const bucket = isVideo ? "post-videos" : "post-images"

    const { error } = await getSupabase().storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: detected.contentType,
        upsert: false,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const { data: urlData } = getSupabase().storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      isVideo,
      contentType: detected.contentType,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
