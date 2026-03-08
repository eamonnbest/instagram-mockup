import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg
  ffmpeg = new FFmpeg()
  // Single-threaded mode — no SharedArrayBuffer/COEP headers needed
  await ffmpeg.load()
  return ffmpeg
}

function releaseFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate()
    ffmpeg = null
  }
}

/**
 * Records a canvas element and exports as MP4.
 * Call `onStartAnimations` once the recorder is running to avoid missing first frames.
 *
 * @param canvas - The HTML canvas element to record
 * @param durationMs - How long to record in milliseconds
 * @param onStartAnimations - Called once recording has started — trigger your animations here
 * @param fps - Frames per second (default 30)
 * @param onProgress - Optional progress callback (0-1)
 * @returns Blob of the MP4 file
 */
export async function recordCanvasToMp4(
  canvas: HTMLCanvasElement,
  durationMs: number,
  onStartAnimations: () => void,
  fps = 30,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const mimeType = getSupportedMimeType()

  // Step 1: Record canvas to WebM using MediaRecorder
  onProgress?.(0.1)
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }))
    }
    recorder.onerror = (e) => {
      reject(new Error(`MediaRecorder error: ${(e as ErrorEvent).message || "unknown"}`))
    }
  })

  recorder.start()
  // Trigger animations AFTER recorder is running to capture first frames
  onStartAnimations()

  await new Promise((r) => setTimeout(r, durationMs))
  recorder.stop()
  // Release the media stream
  stream.getTracks().forEach((t) => t.stop())

  const webmBlob = await recordingDone
  // Free chunk references
  chunks.length = 0
  onProgress?.(0.5)

  // Step 2: Convert WebM to MP4 using ffmpeg.wasm
  const ff = await getFFmpeg()
  onProgress?.(0.6)

  const inputName = "input.webm"
  const outputName = "output.mp4"

  await ff.writeFile(inputName, await fetchFile(webmBlob))
  onProgress?.(0.7)

  await ff.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputName,
  ])
  onProgress?.(0.9)

  const data = await ff.readFile(outputName)
  const mp4Blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" })

  // Cleanup temp files and free WASM memory
  await ff.deleteFile(inputName)
  await ff.deleteFile(outputName)
  releaseFFmpeg()

  onProgress?.(1.0)
  return mp4Blob
}

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  throw new Error("No supported video recording format found in this browser")
}

/**
 * Triggers a download of a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
