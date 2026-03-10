/**
 * Generates a JPEG thumbnail from the first frame of a video URL.
 * Seeks to 0.1s to avoid a black first frame, draws to canvas, uploads via signed URL.
 */
import { uploadViaSigned } from "@/lib/upload-signed"

export async function generateVideoThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.muted = true
    video.src = videoUrl

    // Wait for metadata (dimensions + duration) before seeking
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Failed to load video for thumbnail"))
    })

    // Seek to 0.1s to skip potential black first frame
    video.currentTime = 0.1
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve()
      // Timeout after 10s in case seek never completes
      setTimeout(() => reject(new Error("Seek timed out")), 10000)
    })

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    )
    if (!blob) return null

    const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" })
    const { url } = await uploadViaSigned(file)
    return url
  } catch (err) {
    console.error("Thumbnail generation failed:", err)
    return null
  }
}
