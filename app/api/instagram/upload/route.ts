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

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const detected = detectImageType(buffer)
    if (!detected) {
      return NextResponse.json({ error: "File must be JPEG, PNG, WebP, or GIF" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${detected.ext}`

    const { error } = await getSupabase().storage
      .from("post-images")
      .upload(fileName, buffer, {
        contentType: detected.contentType,
        upsert: false,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    const { data: urlData } = getSupabase().storage
      .from("post-images")
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, imageUrl: urlData.publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
