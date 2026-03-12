"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Move } from "lucide-react"

/**
 * Video/image repositioner for choosing crop position within a 3:4 frame.
 * The user drags the media to choose which slice is visible in the grid.
 * Outputs a normalized {x, y} where 0.5 = center, 0 = top/left, 1 = bottom/right.
 */

const CROP_ASPECT = 3 / 4 // width / height — the grid cell aspect ratio

interface VideoRepositionerProps {
  /** URL of the video or image to reposition */
  mediaUrl: string
  /** Whether the media is a video (vs image) */
  isVideo: boolean
  /** Optional poster/thumbnail for video */
  posterUrl?: string
  /** Initial crop position (0-1 range, default center) */
  initialPosition?: { x: number; y: number }
  /** Called with the chosen crop position */
  onConfirm: (position: { x: number; y: number }) => void
  onCancel: () => void
}

export function VideoRepositioner({
  mediaUrl,
  isVideo,
  posterUrl,
  initialPosition,
  onConfirm,
  onCancel,
}: VideoRepositionerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)

  // Natural dimensions of the media
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)

  // Offset in pixels from the "centered" position — {0,0} = centered
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null)

  // Container display size
  const [containerWidth, setContainerWidth] = useState(300)

  // Responsive container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setContainerWidth(Math.floor(width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const containerHeight = containerWidth / CROP_ASPECT

  // Compute how the media fits: it must cover the crop frame
  // The media is scaled so its shorter dimension fills the frame,
  // and the user drags along the longer dimension.
  const layout = useCallback(() => {
    if (!naturalSize) return null
    const mediaAspect = naturalSize.w / naturalSize.h

    let displayW: number, displayH: number

    if (mediaAspect > CROP_ASPECT) {
      // Media is wider than frame — fill height, overflow width
      displayH = containerHeight
      displayW = containerHeight * mediaAspect
    } else {
      // Media is taller than frame — fill width, overflow height
      displayW = containerWidth
      displayH = containerWidth / mediaAspect
    }

    // How far can the media be dragged in each direction
    const maxOffsetX = Math.max(0, (displayW - containerWidth) / 2)
    const maxOffsetY = Math.max(0, (displayH - containerHeight) / 2)

    return { displayW, displayH, maxOffsetX, maxOffsetY }
  }, [naturalSize, containerWidth, containerHeight])

  const layoutResult = layout()

  // Set initial offset from initialPosition prop
  useEffect(() => {
    if (!layoutResult || !initialPosition) return
    // Convert normalized 0-1 position to pixel offset
    // x=0 means show left edge => offset = +maxOffsetX
    // x=0.5 means center => offset = 0
    // x=1 means show right edge => offset = -maxOffsetX
    const ox = (0.5 - initialPosition.x) * 2 * layoutResult.maxOffsetX
    const oy = (0.5 - initialPosition.y) * 2 * layoutResult.maxOffsetY
    setOffset({ x: ox, y: oy })
    // Only run once when layout is first computed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!layoutResult])

  // Clamp offset to bounds
  const clamp = useCallback(
    (ox: number, oy: number) => {
      if (!layoutResult) return { x: 0, y: 0 }
      return {
        x: Math.max(-layoutResult.maxOffsetX, Math.min(layoutResult.maxOffsetX, ox)),
        y: Math.max(-layoutResult.maxOffsetY, Math.min(layoutResult.maxOffsetY, oy)),
      }
    },
    [layoutResult],
  )

  // Pointer handlers for drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      }
    },
    [offset],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setOffset(clamp(dragRef.current.startOffsetX + dx, dragRef.current.startOffsetY + dy))
    },
    [clamp],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  // Convert pixel offset to normalized 0-1 position for storage
  const toNormalized = useCallback((): { x: number; y: number } => {
    if (!layoutResult) return { x: 0.5, y: 0.5 }
    const x = layoutResult.maxOffsetX > 0 ? 0.5 - offset.x / (2 * layoutResult.maxOffsetX) : 0.5
    const y = layoutResult.maxOffsetY > 0 ? 0.5 - offset.y / (2 * layoutResult.maxOffsetY) : 0.5
    // Clamp to 0-1 range
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }, [layoutResult, offset])

  // Handle video/image load to get natural dimensions
  const handleVideoLoaded = useCallback(() => {
    const video = mediaRef.current as HTMLVideoElement
    if (video) {
      setNaturalSize({ w: video.videoWidth, h: video.videoHeight })
    }
  }, [])

  const handleImageLoaded = useCallback(() => {
    const img = mediaRef.current as HTMLImageElement
    if (img) {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
  }, [])

  // Check if media perfectly matches the crop aspect (no repositioning needed)
  const canDrag = layoutResult && (layoutResult.maxOffsetX > 1 || layoutResult.maxOffsetY > 1)

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-neutral-500 flex items-center gap-1.5">
        <Move className="w-4 h-4" />
        {canDrag ? "Drag to reposition within the grid frame" : naturalSize ? "Media fits the frame perfectly" : "Loading…"}
      </div>

      {/* Crop preview window */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-neutral-200 bg-black cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ aspectRatio: `${CROP_ASPECT}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            poster={posterUrl}
            muted
            loop
            autoPlay
            playsInline
            onLoadedMetadata={handleVideoLoaded}
            className="pointer-events-none absolute"
            style={
              layoutResult
                ? {
                    width: layoutResult.displayW,
                    height: layoutResult.displayH,
                    left: (containerWidth - layoutResult.displayW) / 2 + offset.x,
                    top: (containerHeight - layoutResult.displayH) / 2 + offset.y,
                  }
                : { width: "100%", height: "100%", objectFit: "cover" }
            }
          />
        ) : (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={mediaUrl}
            alt="Reposition preview"
            onLoad={handleImageLoaded}
            className="pointer-events-none absolute"
            style={
              layoutResult
                ? {
                    width: layoutResult.displayW,
                    height: layoutResult.displayH,
                    left: (containerWidth - layoutResult.displayW) / 2 + offset.x,
                    top: (containerHeight - layoutResult.displayH) / 2 + offset.y,
                  }
                : { width: "100%", height: "100%", objectFit: "cover" }
            }
          />
        )}

        {/* Subtle grid overlay to help with alignment */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Confirm / Cancel */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(toNormalized())}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Check className="w-4 h-4 mr-1" />
          Confirm
        </Button>
      </div>
    </div>
  )
}
