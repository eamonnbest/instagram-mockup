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
): Promise<Blob> {
  const ff = await getFFmpeg(onProgress)

  // Determine input extensions from URLs
  const videoExt = videoUrl.match(/\.(mp4|mov|webm)/) ? videoUrl.match(/\.(mp4|mov|webm)/)![1] : "mp4"
  const audioExt = audioUrl.match(/\.(mp3|wav|aac|m4a)/) ? audioUrl.match(/\.(mp3|wav|aac|m4a)/)![1] : "mp3"

  // Write input files to FFmpeg's virtual filesystem
  await ff.writeFile(`input.${videoExt}`, await fetchFile(videoUrl))
  await ff.writeFile(`input.${audioExt}`, await fetchFile(audioUrl))

  // Mux: copy video stream, encode audio as AAC, trim audio to match video length
  await ff.exec([
    "-i", `input.${videoExt}`,
    "-i", `input.${audioExt}`,
    "-c:v", "copy",       // Don't re-encode video (fast)
    "-c:a", "aac",        // Encode audio as AAC for broad compatibility
    "-b:a", "192k",
    "-shortest",          // Trim to whichever input is shorter
    "-map", "0:v:0",      // Take video from first input
    "-map", "1:a:0",      // Take audio from second input
    "-movflags", "+faststart", // Optimize for web playback
    "output.mp4",
  ])

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
