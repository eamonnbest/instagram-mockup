"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Scissors, Play, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadViaSigned } from "@/lib/upload-signed"

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length * numChannels * 2 + 44
  const out = new ArrayBuffer(length)
  const view = new DataView(out)

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, "RIFF")
  view.setUint32(4, length - 8, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, buffer.length * numChannels * 2, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([out], { type: "audio/wav" })
}

interface AudioTrimmerProps {
  audioUrl: string
  onSave: (newUrl: string) => void
  onCancel: () => void
}

export function AudioTrimmer({ audioUrl, onSave, onCancel }: AudioTrimmerProps) {
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const rawAudioDataRef = useRef<ArrayBuffer | null>(null)
  const animFrameRef = useRef<number>(0)

  // Fetch audio data on mount (no AudioContext yet — iOS blocks it without gesture)
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.src = audioUrl
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
      setEndTime(audio.duration)
    })

    // Pre-fetch the raw bytes so decode is fast on first interaction
    fetch(audioUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => { rawAudioDataRef.current = buf })
      .catch((err) => {
        console.error("Failed to fetch audio:", err)
        setLoadError("Could not load audio for trimming. The file may not be accessible.")
      })

    return () => {
      audio.pause()
      cancelAnimationFrame(animFrameRef.current)
      audioContextRef.current?.close()
    }
  }, [audioUrl])

  const decodePromiseRef = useRef<Promise<AudioBuffer | null> | null>(null)

  // Decode audio on first user gesture (iOS requires AudioContext inside a tap)
  // AudioContext creation is synchronous (stays in gesture stack), decode is async
  function ensureDecodedSync(): AudioBuffer | null {
    if (audioBufferRef.current) return audioBufferRef.current
    if (!rawAudioDataRef.current || decodePromiseRef.current) return null

    // Create/resume AudioContext synchronously in gesture stack (required for iOS)
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }

    // Kick off decode — store promise so saveClip can await it
    decodePromiseRef.current = audioContextRef.current.decodeAudioData(rawAudioDataRef.current.slice(0))
      .then((decoded) => {
        audioBufferRef.current = decoded
        if (decoded.duration > 0) {
          setDuration(decoded.duration)
          setEndTime(decoded.duration)
        }
        return decoded
      })
      .catch((err) => {
        console.error("Failed to decode audio:", err)
        setLoadError("Could not decode audio. The file may be corrupted.")
        return null
      })

    return null
  }

  const updatePlayhead = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.paused) return
    setCurrentTime(audio.currentTime)
    if (audio.currentTime >= endTime) {
      audio.pause()
      setPlaying(false)
      return
    }
    animFrameRef.current = requestAnimationFrame(updatePlayhead)
  }, [endTime])

  function previewClip() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
      return
    }

    // Kick off decode if needed (synchronous AudioContext creation for iOS gesture)
    ensureDecodedSync()

    // audio.play() stays synchronous in the gesture stack
    audio.currentTime = startTime
    audio.play()
    setPlaying(true)
    animFrameRef.current = requestAnimationFrame(updatePlayhead)
  }

  async function saveClip() {
    // Kick off decode synchronously (iOS gesture context)
    ensureDecodedSync()

    // Await decode if still in progress (saveClip doesn't need gesture context)
    if (!audioBufferRef.current && decodePromiseRef.current) {
      await decodePromiseRef.current
    }
    const buffer = audioBufferRef.current
    if (!buffer) {
      alert("Audio is still loading. Please try again.")
      return
    }

    setSaving(true)
    try {
      const sampleRate = buffer.sampleRate
      const startSample = Math.floor(startTime * sampleRate)
      const endSample = Math.floor(endTime * sampleRate)
      const clipLength = endSample - startSample

      const offlineCtx = new OfflineAudioContext(
        buffer.numberOfChannels,
        clipLength,
        sampleRate,
      )

      const source = offlineCtx.createBufferSource()
      source.buffer = buffer

      // Auto fade-out if trimmed before the track's natural end
      const isTrimmedEnd = endTime < buffer.duration - 0.1
      if (isTrimmedEnd) {
        const gainNode = offlineCtx.createGain()
        const fadeDuration = Math.min(2, endTime - startTime) // 2s fade, or clip length if shorter
        gainNode.gain.setValueAtTime(1, 0)
        gainNode.gain.setValueAtTime(1, Math.max(0, (endTime - startTime) - fadeDuration))
        gainNode.gain.linearRampToValueAtTime(0, endTime - startTime)
        source.connect(gainNode)
        gainNode.connect(offlineCtx.destination)
      } else {
        source.connect(offlineCtx.destination)
      }

      source.start(0, startTime, endTime - startTime)

      const rendered = await offlineCtx.startRendering()
      const wav = audioBufferToWav(rendered)
      const file = new File([wav], "clip.wav", { type: "audio/wav" })

      const { url } = await uploadViaSigned(file)
      onSave(url)
    } catch (error) {
      console.error("Failed to save clip:", error)
      alert("Failed to save clip. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const clipDuration = endTime - startTime
  const progressPct = duration > 0 ? ((currentTime - startTime) / (endTime - startTime)) * 100 : 0

  if (loadError) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-500">{loadError}</p>
        <Button size="sm" variant="outline" className="text-xs" onClick={onCancel}>Back</Button>
      </div>
    )
  }

  const pct = (v: number) => duration > 0 ? (v / duration) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600">Trim audio</span>
        <span className="text-xs text-neutral-400">
          Clip: {formatTime(clipDuration)}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-10 bg-neutral-100 rounded-md overflow-hidden">
        {/* Selected range highlight */}
        <div
          className="absolute top-0 bottom-0 bg-blue-100"
          style={{
            left: `${pct(startTime)}%`,
            width: `${pct(endTime - startTime)}%`,
          }}
        />
        {/* Playhead */}
        {playing && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
            style={{ left: `${pct(currentTime)}%` }}
          />
        )}
        {/* Progress bar inside selection */}
        {playing && (
          <div
            className="absolute top-0 bottom-0 bg-blue-200/50"
            style={{
              left: `${pct(startTime)}%`,
              width: `${Math.max(0, Math.min(progressPct, 100)) * (pct(endTime - startTime) / 100)}%`,
            }}
          />
        )}
      </div>

      {/* Range inputs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500 w-10">Start</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startTime}
            onChange={(e) => {
              const v = Number(e.target.value)
              setStartTime(Math.min(v, endTime - 0.5))
            }}
            className="flex-1 h-1.5 accent-blue-500"
          />
          <span className="text-xs text-neutral-500 w-12 text-right font-mono">{formatTime(startTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500 w-10">End</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={endTime}
            onChange={(e) => {
              const v = Number(e.target.value)
              setEndTime(Math.max(v, startTime + 0.5))
            }}
            className="flex-1 h-1.5 accent-blue-500"
          />
          <span className="text-xs text-neutral-500 w-12 text-right font-mono">{formatTime(endTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={previewClip}>
          {playing ? <Square className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
          {playing ? "Stop" : "Preview clip"}
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={saveClip}
          disabled={saving || clipDuration < 0.5}
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</>
          ) : (
            <><Scissors className="w-3.5 h-3.5 mr-1" />Save clip</>
          )}
        </Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
