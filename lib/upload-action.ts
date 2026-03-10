"use server"

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

export async function uploadFileAction(formData: FormData): Promise<{ url: string; isVideo: boolean }> {
  const file = formData.get("file") as File | null
  if (!file) throw new Error("No file provided")

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    throw new Error("Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.")
  }

  const isVideo = file.type in VIDEO_TYPES
  const isAudio = file.type in AUDIO_TYPES
  const maxSize = isVideo ? 50 * 1024 * 1024 : isAudio ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`File must be under ${isVideo || isAudio ? "50MB" : "10MB"}`)
  }

  const bucket = isAudio ? "post-audio" : isVideo ? "post-videos" : "post-images"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await getSupabase().storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("Upload error:", error)
    throw new Error("Failed to upload file")
  }

  const { data: urlData } = getSupabase().storage
    .from(bucket)
    .getPublicUrl(fileName)

  return { url: urlData.publicUrl, isVideo }
}
