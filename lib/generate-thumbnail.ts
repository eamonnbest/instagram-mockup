/**
 * Generates a JPEG thumbnail from a video URL.
 * Fetches video as blob (avoids CORS/canvas tainting), seeks to 0.1s,
 * waits for frame via requestVideoFrameCallback, draws to canvas, uploads.
 */
import { uploadViaSigned } from "@/lib/upload-signed"

function waitForFrame(video: HTMLVideoElement): Promise<void> {
  // requestVideoFrameCallback doesn't fire for offscreen/detached videos,
  // so use a short delay after seek to let the frame decode
  return new Promise((resolve) => setTimeout(resolve, 300))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

export async function generateVideoThumbnail(videoUrl: string): Promise<string | null> {
  let objectUrl: string | null = null
  try {
    console.log("[Thumbnail] Fetching video blob...")
    const response = await withTimeout(fetch(videoUrl), 15000, "Video fetch")
    if (!response.ok) throw new Error(`Failed to fetch video: ${response.status}`)
    const blob = await withTimeout(response.blob(), 15000, "Blob read")
    console.log("[Thumbnail] Blob ready, size:", blob.size)
    objectUrl = URL.createObjectURL(blob)

    const video = document.createElement("video")
    video.preload = "auto"
    video.muted = true
    video.src = objectUrl

    console.log("[Thumbnail] Waiting for metadata...")
    await withTimeout(new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Failed to load video for thumbnail"))
    }), 10000, "Metadata load")

    console.log("[Thumbnail] Seeking to 0.1s...")
    video.currentTime = 0.1
    await withTimeout(new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve()
      video.onerror = () => reject(new Error("Seek error"))
    }), 10000, "Seek")

    console.log("[Thumbnail] Waiting for paintable frame...")
    await withTimeout(waitForFrame(video), 5000, "Frame wait")

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)

    const thumbBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    )
    if (!thumbBlob) return null

    console.log("[Thumbnail] Uploading thumbnail...")
    const file = new File([thumbBlob], "thumbnail.jpg", { type: "image/jpeg" })
    const { url } = await uploadViaSigned(file)
    console.log("[Thumbnail] Done:", url?.slice(-30))
    return url
  } catch (err) {
    console.error("[Thumbnail] Failed:", err)
    return null
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}
