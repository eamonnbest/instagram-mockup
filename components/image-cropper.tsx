"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Check, X } from "lucide-react"

const CANVAS_SIZE = 1080
const DISPLAY_SIZE = 400 // CSS display size

interface ImageCropperProps {
  imageUrl: string
  onCrop: (croppedDataUrl: string) => void
  onCancel: () => void
}

export function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 })
  const stageRef = useRef<Konva.Stage>(null)
  const imageRef = useRef<Konva.Image>(null)

  // Load the image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })

      // Calculate initial fit: image covers the square (cover mode)
      const imgRatio = img.naturalWidth / img.naturalHeight
      let fitW: number, fitH: number, fitX: number, fitY: number

      if (imgRatio > 1) {
        // Landscape: height fills canvas, width overflows
        fitH = CANVAS_SIZE
        fitW = CANVAS_SIZE * imgRatio
        fitX = -(fitW - CANVAS_SIZE) / 2
        fitY = 0
      } else {
        // Portrait or square: width fills canvas, height overflows
        fitW = CANVAS_SIZE
        fitH = CANVAS_SIZE / imgRatio
        fitX = 0
        fitY = -(fitH - CANVAS_SIZE) / 2
      }

      setPosition({ x: fitX, y: fitY })
      setImgNaturalSize({ w: fitW, h: fitH })
    }
    img.src = imageUrl
  }, [imageUrl])

  // Constrain position so image always covers the square
  const constrainPosition = useCallback((x: number, y: number, s: number, imgW: number, imgH: number) => {
    const scaledW = imgW * s
    const scaledH = imgH * s

    // Image must cover the full canvas: right edge >= CANVAS_SIZE, left edge <= 0, etc.
    const minX = CANVAS_SIZE - scaledW
    const maxX = 0
    const minY = CANVAS_SIZE - scaledH
    const maxY = 0

    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    }
  }, [])

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target
    const constrained = constrainPosition(node.x(), node.y(), scale, imgNaturalSize.w, imgNaturalSize.h)
    node.position(constrained)
    setPosition(constrained)
  }

  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target
    const constrained = constrainPosition(node.x(), node.y(), scale, imgNaturalSize.w, imgNaturalSize.h)
    node.position(constrained)
  }

  function handleZoom(newScale: number) {
    const s = Math.max(1, Math.min(3, newScale))

    // Adjust position to zoom from center
    const centerX = CANVAS_SIZE / 2
    const centerY = CANVAS_SIZE / 2

    const oldX = position.x
    const oldY = position.y

    // Calculate new position so zoom centers on the middle of the visible area
    const newX = centerX - ((centerX - oldX) / scale) * s
    const newY = centerY - ((centerY - oldY) / scale) * s

    const constrained = constrainPosition(newX, newY, s, imgNaturalSize.w, imgNaturalSize.h)
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

    // Export the stage (which is clipped to the square) as a data URL
    const dataUrl = stageRef.current.toDataURL({
      x: 0,
      y: 0,
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      pixelRatio: 1,
    })

    onCrop(dataUrl)
  }

  // Check if image needs cropping (is it not already square?)
  const isSquare = image && Math.abs(image.naturalWidth - image.naturalHeight) < 2

  const displayScale = DISPLAY_SIZE / CANVAS_SIZE

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
        className="mx-auto rounded-lg overflow-hidden bg-neutral-900"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      >
        <Stage
          ref={stageRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
          onWheel={handleWheel}
        >
          <Layer>
            {/* Clip region — only show what's inside the square */}
            {image && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={position.x}
                y={position.y}
                width={imgNaturalSize.w}
                height={imgNaturalSize.h}
                scaleX={scale}
                scaleY={scale}
                draggable
                onDragEnd={handleDragEnd}
                onDragMove={handleDragMove}
              />
            )}
            {/* Clip mask — dim area outside square (visual guide) */}
          </Layer>
        </Stage>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-2 max-w-[400px] mx-auto">
        <button onClick={() => handleZoom(scale - 0.1)} className="p-1 hover:bg-neutral-100 rounded">
          <ZoomOut className="w-4 h-4 text-neutral-500" />
        </button>
        <input
          type="range"
          min={1}
          max={3}
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

      {/* Controls */}
      <div className="flex gap-2 max-w-[400px] mx-auto">
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
