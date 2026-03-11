"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Check, X } from "lucide-react"

const EXPORT_SIZE = 1080  // Final exported image size
const MAX_DISPLAY_SIZE = 600  // Max on-screen canvas size

interface ImageCropperProps {
  imageUrl: string
  onCrop: (croppedDataUrl: string) => void
  onCancel: () => void
}

export function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [baseSize, setBaseSize] = useState({ w: 0, h: 0 })
  const [displaySize, setDisplaySize] = useState(MAX_DISPLAY_SIZE)
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef<{ lastDist: number; startScale: number; isPinching: boolean }>({
    lastDist: 0, startScale: 1, isPinching: false,
  })
  const scaleRef = useRef(scale)
  const positionRef = useRef(position)
  if (!pinchRef.current.isPinching) {
    scaleRef.current = scale
    positionRef.current = position
  }

  // Handle touchcancel (notifications, interruptions) — Konva has no onTouchCancel prop
  useEffect(() => {
    const canvas = stageRef.current?.container()
    if (!canvas) return
    const onCancel = () => handlePinchEnd()
    canvas.addEventListener("touchcancel", onCancel)
    return () => canvas.removeEventListener("touchcancel", onCancel)
  })

  // Responsive display size via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? MAX_DISPLAY_SIZE
      setDisplaySize(Math.min(Math.floor(width), MAX_DISPLAY_SIZE))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Load the image and compute initial layout
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)

      const imgRatio = img.naturalWidth / img.naturalHeight

      // Base size = contain fit (entire image visible inside the display square)
      let baseW: number, baseH: number
      if (imgRatio > 1) {
        baseW = displaySize
        baseH = displaySize / imgRatio
      } else {
        baseH = displaySize
        baseW = displaySize * imgRatio
      }

      setBaseSize({ w: baseW, h: baseH })

      // Start at cover fit (fills the square, no black bars)
      const coverScale = Math.max(displaySize / baseW, displaySize / baseH)

      const scaledW = baseW * coverScale
      const scaledH = baseH * coverScale
      const startX = -(scaledW - displaySize) / 2
      const startY = -(scaledH - displaySize) / 2

      setScale(coverScale)
      setPosition({ x: startX, y: startY })
    }
    img.src = imageUrl
  }, [imageUrl, displaySize])

  // Constrain position
  const constrainPosition = useCallback((x: number, y: number, s: number, bw: number, bh: number) => {
    const scaledW = bw * s
    const scaledH = bh * s

    let cx: number, cy: number

    if (scaledW >= displaySize) {
      cx = Math.min(0, Math.max(displaySize - scaledW, x))
    } else {
      cx = (displaySize - scaledW) / 2
    }

    if (scaledH >= displaySize) {
      cy = Math.min(0, Math.max(displaySize - scaledH, y))
    } else {
      cy = (displaySize - scaledH) / 2
    }

    return { x: cx, y: cy }
  }, [displaySize])

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target
    const constrained = constrainPosition(node.x(), node.y(), scale, baseSize.w, baseSize.h)
    node.position(constrained)
    setPosition(constrained)
  }

  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target
    const constrained = constrainPosition(node.x(), node.y(), scale, baseSize.w, baseSize.h)
    node.position(constrained)
  }

  function handleZoom(newScale: number) {
    const s = Math.max(1, Math.min(4, newScale))

    const centerX = displaySize / 2
    const centerY = displaySize / 2

    const newX = centerX - ((centerX - position.x) / scale) * s
    const newY = centerY - ((centerY - position.y) / scale) * s

    const constrained = constrainPosition(newX, newY, s, baseSize.w, baseSize.h)
    setScale(s)
    setPosition(constrained)
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? -0.05 : 0.05
    handleZoom(scale + delta)
  }

  function getTouchDist(touches: TouchList): number {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    )
  }

  function handleTouchStart(e: Konva.KonvaEventObject<TouchEvent>) {
    const touches = e.evt.touches
    if (touches.length >= 2) {
      e.evt.preventDefault()
      const dist = getTouchDist(touches)
      if (dist < 1) return // Fingers overlapping — ignore
      pinchRef.current = { lastDist: dist, startScale: scaleRef.current, isPinching: true }
      // Disable Konva drag during pinch
      const imageNode = stageRef.current?.findOne("Image")
      if (imageNode) imageNode.draggable(false)
    }
  }

  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const touches = e.evt.touches
    if (touches.length < 2 || !pinchRef.current.isPinching) return
    e.evt.preventDefault()

    const dist = getTouchDist(touches)
    if (dist < 1) return // Guard against zero distance

    const ratio = dist / pinchRef.current.lastDist
    const newScale = Math.max(1, Math.min(4, scaleRef.current * ratio))

    // Update Konva node directly for smooth 60fps (no React re-render per frame)
    const imageNode = stageRef.current?.findOne("Image") as Konva.Image | undefined
    if (imageNode) {
      const centerX = displaySize / 2
      const centerY = displaySize / 2
      const newX = centerX - ((centerX - positionRef.current.x) / scaleRef.current) * newScale
      const newY = centerY - ((centerY - positionRef.current.y) / scaleRef.current) * newScale
      const constrained = constrainPosition(newX, newY, newScale, baseSize.w, baseSize.h)

      imageNode.scaleX(newScale)
      imageNode.scaleY(newScale)
      imageNode.position(constrained)
      imageNode.getLayer()?.batchDraw()

      scaleRef.current = newScale
      positionRef.current = constrained
    }

    pinchRef.current.lastDist = dist
  }

  function handlePinchEnd() {
    if (!pinchRef.current.isPinching) return
    pinchRef.current.isPinching = false
    // Re-enable Konva drag
    const imageNode = stageRef.current?.findOne("Image")
    if (imageNode) imageNode.draggable(true)
    // Sync refs back to React state (single re-render)
    setScale(scaleRef.current)
    setPosition(positionRef.current)
  }

  function applyCrop() {
    if (!stageRef.current) return

    // Export at high resolution (EXPORT_SIZE x EXPORT_SIZE)
    const ratio = EXPORT_SIZE / displaySize
    const dataUrl = stageRef.current.toDataURL({
      x: 0,
      y: 0,
      width: displaySize,
      height: displaySize,
      pixelRatio: ratio,
    })

    onCrop(dataUrl)
  }

  const isSquare = image && Math.abs(image.naturalWidth - image.naturalHeight) < 2

  const coverScale = baseSize.w > 0 && baseSize.h > 0
    ? Math.max(displaySize / baseSize.w, displaySize / baseSize.h)
    : 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600">Position & zoom</span>
        {isSquare && (
          <span className="text-xs text-neutral-400">Image is already square</span>
        )}
      </div>

      {/* Canvas — container measures available width */}
      <div ref={containerRef} className="w-full max-w-[600px] mx-auto">
        <div
          className="rounded-lg overflow-hidden bg-neutral-900 cursor-grab active:cursor-grabbing"
          style={{ width: displaySize, height: displaySize, touchAction: "none" }}
        >
          <Stage
            ref={stageRef}
            width={displaySize}
            height={displaySize}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handlePinchEnd}
          >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                x={position.x}
                y={position.y}
                width={baseSize.w}
                height={baseSize.h}
                scaleX={scale}
                scaleY={scale}
                draggable
                onDragEnd={handleDragEnd}
                onDragMove={handleDragMove}
              />
            )}
          </Layer>
        </Stage>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-2 max-w-[600px] mx-auto">
        <button onClick={() => handleZoom(scale - 0.1)} className="p-1 hover:bg-neutral-100 rounded">
          <ZoomOut className="w-4 h-4 text-neutral-500" />
        </button>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={scale}
          onChange={(e) => handleZoom(Number(e.target.value))}
          className="flex-1 h-1.5 accent-blue-500"
        />
        <button onClick={() => handleZoom(scale + 0.1)} className="p-1 hover:bg-neutral-100 rounded">
          <ZoomIn className="w-4 h-4 text-neutral-500" />
        </button>
        <span className="text-xs text-neutral-400 w-10 text-right">{Math.round(scale * 100)}%</span>
      </div>

      {/* Cover indicator */}
      {scale < coverScale && (
        <p className="text-xs text-amber-500 text-center">
          Zoom in to {Math.round(coverScale * 100)}%+ to fill the square (no black bars)
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-2 max-w-[600px] mx-auto">
        <Button size="sm" onClick={applyCrop} className="flex-1">
          <Check className="w-3.5 h-3.5 mr-1" />
          Apply crop
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1" />
          Skip
        </Button>
      </div>
    </div>
  )
}
