/**
 * Client-side upload via signed URL.
 *
 * Flow: browser asks server for a signed URL + token (tiny JSON request),
 * then uploads the file directly to Supabase using the SDK's uploadToSignedUrl
 * (bypasses Vercel's 4.5MB request body limit).
 */
import { createClient } from "@/lib/supabase/client"

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"])
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav"])

function getBucket(contentType: string): string {
  if (AUDIO_TYPES.has(contentType)) return "post-audio"
  if (VIDEO_TYPES.has(contentType)) return "post-videos"
  return "post-images"
}

export async function uploadViaSigned(file: File): Promise<{ url: string; isVideo: boolean }> {
  // Step 1: Get a signed upload URL + token from our API (small JSON payload)
  const res = await fetch("/api/instagram/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to get upload URL")
  }

  const { token, path, publicUrl, isVideo } = await res.json()
  const bucket = getBucket(file.type)

  // Step 2: Upload file directly to Supabase using the SDK's uploadToSignedUrl
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
    })

  if (error) {
    console.error("Signed upload failed:", error)
    throw new Error("Failed to upload file to storage")
  }

  return { url: publicUrl, isVideo }
}
