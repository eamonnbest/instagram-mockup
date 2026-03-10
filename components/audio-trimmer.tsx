"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Scissors, Play, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadFileAction } from "@/lib/upload-action"

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
  const animFrameRef = useRef<number>(0)

  // Load audio and decode
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.src = audioUrl
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
      setEndTime(audio.duration)
    })

    // Decode for trimming
    fetch(audioUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const ctx = new AudioContext()
        audioContextRef.current = ctx
        return ctx.decodeAudioData(buf)
      })
      .then((decoded) => {
        audioBufferRef.current = decoded
        if (decoded.duration > 0) {
          setDuration(decoded.duration)
          setEndTime(decoded.duration)
        }
      })
      .catch((err) => {
        console.error("Failed to decode audio:", err)
        setLoadError("Could not load audio for trimming. The file may not be accessible.")
      })

    return () => {
      audio.pause()
      cancelAnimationFrame(animFrameRef.current)
      audioContextRef.current?.close()
    }
  }, [audioUrl])

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

    audio.currentTime = startTime
    audio.play()
    setPlaying(true)
    animFrameRef.current = requestAnimationFrame(updatePlayhead)
  }

  async function saveClip() {
    const buffer = audioBufferRef.current
    if (!buffer) return

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
      source.connect(offlineCtx.destination)
      source.start(0, startTime, endTime - startTime)

      const rendered = await offlineCtx.startRendering()
      const wav = audioBufferToWav(rendered)
      const file = new File([wav], "clip.wav", { type: "audio/wav" })

      const formData = new FormData()
      formData.append("file", file)

      // Add audio/wav to the upload action's allowed types
      const { url } = await uploadFileAction(formData)
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
