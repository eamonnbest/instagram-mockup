"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Check, X } from "lucide-react"

const EXPORT_SIZE = 1080  // Final exported image size
const DISPLAY_SIZE = 600  // On-screen canvas size

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
  const stageRef = useRef<Konva.Stage>(null)

  // Load the image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)

      const imgRatio = img.naturalWidth / img.naturalHeight

      // Base size = contain fit (entire image visible inside the display square)
      let baseW: number, baseH: number
      if (imgRatio > 1) {
        baseW = DISPLAY_SIZE
        baseH = DISPLAY_SIZE / imgRatio
      } else {
        baseH = DISPLAY_SIZE
        baseW = DISPLAY_SIZE * imgRatio
      }

      setBaseSize({ w: baseW, h: baseH })

      // Start at cover fit (fills the square, no black bars)
      const coverScale = Math.max(DISPLAY_SIZE / baseW, DISPLAY_SIZE / baseH)

      const scaledW = baseW * coverScale
      const scaledH = baseH * coverScale
      const startX = -(scaledW - DISPLAY_SIZE) / 2
      const startY = -(scaledH - DISPLAY_SIZE) / 2

      setScale(coverScale)
      setPosition({ x: startX, y: startY })
    }
    img.src = imageUrl
  }, [imageUrl])

  // Constrain position
  const constrainPosition = useCallback((x: number, y: number, s: number, bw: number, bh: number) => {
    const scaledW = bw * s
    const scaledH = bh * s

    let cx: number, cy: number

    if (scaledW >= DISPLAY_SIZE) {
      cx = Math.min(0, Math.max(DISPLAY_SIZE - scaledW, x))
    } else {
      cx = (DISPLAY_SIZE - scaledW) / 2
    }

    if (scaledH >= DISPLAY_SIZE) {
      cy = Math.min(0, Math.max(DISPLAY_SIZE - scaledH, y))
    } else {
      cy = (DISPLAY_SIZE - scaledH) / 2
    }

    return { x: cx, y: cy }
  }, [])

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

    const centerX = DISPLAY_SIZE / 2
    const centerY = DISPLAY_SIZE / 2

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

  function applyCrop() {
    if (!stageRef.current) return

    // Export at high resolution (EXPORT_SIZE x EXPORT_SIZE)
    const ratio = EXPORT_SIZE / DISPLAY_SIZE
    const dataUrl = stageRef.current.toDataURL({
      x: 0,
      y: 0,
      width: DISPLAY_SIZE,
      height: DISPLAY_SIZE,
      pixelRatio: ratio,
    })

    onCrop(dataUrl)
  }

  const isSquare = image && Math.abs(image.naturalWidth - image.naturalHeight) < 2

  const coverScale = baseSize.w > 0 && baseSize.h > 0
    ? Math.max(DISPLAY_SIZE / baseSize.w, DISPLAY_SIZE / baseSize.h)
    : 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600">Position & zoom</span>
        {isSquare && (
          <span className="text-xs text-neutral-400">Image is already square</span>
        )}
      </div>

      {/* Canvas */}
      <div
        className="mx-auto rounded-lg overflow-hidden bg-neutral-900 cursor-grab active:cursor-grabbing"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      >
        <Stage
          ref={stageRef}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          onWheel={handleWheel}
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
