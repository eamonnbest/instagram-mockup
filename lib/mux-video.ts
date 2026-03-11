/**
 * Combines a video file and an audio file into a single video with embedded audio.
 * Uses FFmpeg.wasm (runs entirely in the browser, no server needed).
 */
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null

async function getFFmpeg(onProgress?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg

  ffmpeg = new FFmpeg()

  if (onProgress) {
    ffmpeg.on("log", ({ message }) => {
      onProgress(message)
    })
  }

  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  })

  return ffmpeg
}

export async function muxVideoAudio(
  videoUrl: string,
  audioUrl: string,
  onProgress?: (message: string) => void,
  videoDuration?: number,
): Promise<Blob> {
  const ff = await getFFmpeg(onProgress)

  // Determine input extensions from URLs
  const videoExt = videoUrl.match(/\.(mp4|mov|webm)/) ? videoUrl.match(/\.(mp4|mov|webm)/)![1] : "mp4"
  const audioExt = audioUrl.match(/\.(mp3|wav|aac|m4a)/) ? audioUrl.match(/\.(mp3|wav|aac|m4a)/)![1] : "mp3"

  // Write input files to FFmpeg's virtual filesystem
  await ff.writeFile(`input.${videoExt}`, await fetchFile(videoUrl))
  await ff.writeFile(`input.${audioExt}`, await fetchFile(audioUrl))

  // 2s audio fade-out before the video ends (avoids hard chop from -shortest)
  const fadeDuration = 2
  const audioFilter = videoDuration && videoDuration > fadeDuration
    ? `afade=t=out:st=${Math.max(0, videoDuration - fadeDuration).toFixed(2)}:d=${fadeDuration}`
    : null

  // Mux: copy video stream, encode audio as AAC, trim audio to match video length
  const args = [
    "-i", `input.${videoExt}`,
    "-i", `input.${audioExt}`,
    "-c:v", "copy",       // Don't re-encode video (fast)
    "-c:a", "aac",        // Encode audio as AAC for broad compatibility
    "-b:a", "192k",
    ...(audioFilter ? ["-af", audioFilter] : []),
    "-shortest",          // Trim to whichever input is shorter
    "-map", "0:v:0",      // Take video from first input
    "-map", "1:a:0",      // Take audio from second input
    "-movflags", "+faststart", // Optimize for web playback
    "output.mp4",
  ]

  await ff.exec(args)

  // Read the result
  const data = await ff.readFile("output.mp4") as Uint8Array

  // Clean up virtual filesystem
  await ff.deleteFile(`input.${videoExt}`).catch(() => {})
  await ff.deleteFile(`input.${audioExt}`).catch(() => {})
  await ff.deleteFile("output.mp4").catch(() => {})

  // Copy to a standard ArrayBuffer to satisfy TypeScript's BlobPart constraint
  const buffer = new Uint8Array(data).buffer as ArrayBuffer
  return new Blob([buffer], { type: "video/mp4" })
}

/**
 * Combines a still image and audio into a video (like Instagram reels from photos).
 * The image is displayed as a static frame for the duration of the audio.
 */
export async function muxImageAudio(
  imageUrl: string,
  audioUrl: string,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  const ff = await getFFmpeg(onProgress)

  // Determine input extensions from URLs
  const imageExt = imageUrl.match(/\.(jpg|jpeg|png|webp)/) ? imageUrl.match(/\.(jpg|jpeg|png|webp)/)![1] : "jpg"
  const audioExt = audioUrl.match(/\.(mp3|wav|aac|m4a)/) ? audioUrl.match(/\.(mp3|wav|aac|m4a)/)![1] : "mp3"

  // Write input files to FFmpeg's virtual filesystem
  await ff.writeFile(`input.${imageExt}`, await fetchFile(imageUrl))
  await ff.writeFile(`input.${audioExt}`, await fetchFile(audioUrl))

  // Create video from still image + audio
  // -loop 1: loop the image indefinitely (until -shortest stops it)
  // -c:v libx264: encode as H.264 (can't copy since there's no video stream to copy)
  // -tune stillimage: optimize encoding for a static frame
  // -pix_fmt yuv420p: required for broad player compatibility
  await ff.exec([
    "-loop", "1",
    "-i", `input.${imageExt}`,
    "-i", `input.${audioExt}`,
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    "output.mp4",
  ])

  // Read the result
  const data = await ff.readFile("output.mp4") as Uint8Array

  // Clean up virtual filesystem
  await ff.deleteFile(`input.${imageExt}`).catch(() => {})
  await ff.deleteFile(`input.${audioExt}`).catch(() => {})
  await ff.deleteFile("output.mp4").catch(() => {})

  const buffer = new Uint8Array(data).buffer as ArrayBuffer
  return new Blob([buffer], { type: "video/mp4" })
}
