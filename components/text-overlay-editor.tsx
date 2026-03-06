"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Download, Type, Bold, AlignLeft, AlignCenter, AlignRight } from "lucide-react"

interface TextBlock {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fill: string
  fontStyle: string
  align: string
  width: number
}

interface TextOverlayEditorProps {
  imageUrl: string
  onExport: (dataUrl: string) => void
  onCancel: () => void
}

const CANVAS_SIZE = 1080
const DISPLAY_SIZE = 400

const PRESET_COLORS = ["#ffffff", "#000000", "#f43f5e", "#3b82f6", "#22c55e", "#eab308", "#a855f7"]

export function TextOverlayEditor({ imageUrl, onExport, onCancel }: TextOverlayEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // Load image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => setImage(img)
    img.src = imageUrl
  }, [imageUrl])

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    const stage = stageRef.current
    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId, textBlocks])

  function addTextBlock() {
    const id = `text-${Date.now()}`
    const newBlock: TextBlock = {
      id,
      text: "Your text here",
      x: CANVAS_SIZE / 2 - 200,
      y: CANVAS_SIZE / 2 - 40,
      fontSize: 72,
      fill: "#ffffff",
      fontStyle: "bold",
      align: "center",
      width: 400,
    }
    setTextBlocks((prev) => [...prev, newBlock])
    setSelectedId(id)
  }

  function updateBlock(id: string, updates: Partial<TextBlock>) {
    setTextBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  function deleteBlock(id: string) {
    setTextBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleExport = useCallback(() => {
    if (!stageRef.current || !transformerRef.current) return
    // Hide transformer directly on the Konva layer before export
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
    setSelectedId(null)
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: CANVAS_SIZE / DISPLAY_SIZE,
      mimeType: "image/png",
    })
    onExport(dataUrl)
  }, [onExport])

  const selectedBlock = textBlocks.find((b) => b.id === selectedId)
  const scale = DISPLAY_SIZE / CANVAS_SIZE

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div
        className="mx-auto bg-neutral-900 rounded-lg overflow-hidden"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      >
        <Stage
          ref={stageRef}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage() || e.target.getClassName() === "Image") {
              setSelectedId(null)
            }
          }}
          onTap={(e) => {
            if (e.target === e.target.getStage() || e.target.getClassName() === "Image") {
              setSelectedId(null)
            }
          }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                listening={false}
              />
            )}
            {textBlocks.map((block) => (
              <Text
                key={block.id}
                id={block.id}
                text={block.text}
                x={block.x}
                y={block.y}
                fontSize={block.fontSize}
                fill={block.fill}
                fontStyle={block.fontStyle}
                fontFamily="Arial, Helvetica, sans-serif"
                align={block.align}
                width={block.width}
                draggable
                onClick={() => setSelectedId(block.id)}
                onTap={() => setSelectedId(block.id)}
                onDragEnd={(e) => {
                  updateBlock(block.id, { x: e.target.x(), y: e.target.y() })
                }}
                onTransformEnd={(e) => {
                  const node = e.target
                  const scaleX = node.scaleX()
                  updateBlock(block.id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(50, node.width() * scaleX),
                    fontSize: Math.max(16, block.fontSize * node.scaleY()),
                  })
                  node.scaleX(1)
                  node.scaleY(1)
                }}
              />
            ))}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(_, newBox) => ({
                ...newBox,
                width: Math.max(30, newBox.width),
                height: Math.max(30, newBox.height),
              })}
              enabledAnchors={["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right"]}
            />
          </Layer>
        </Stage>
      </div>

      {/* Add text button */}
      <Button onClick={addTextBlock} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1.5" />
        Add Text
      </Button>

      {/* Selected text controls */}
      {selectedBlock && (
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
          {/* Text input */}
          <Input
            value={selectedBlock.text}
            onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
            placeholder="Enter text..."
            className="text-sm"
          />

          {/* Font size */}
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="range"
              min={24}
              max={160}
              value={selectedBlock.fontSize}
              onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{Math.round(selectedBlock.fontSize)}</span>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateBlock(selectedBlock.id, { fill: color })}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  selectedBlock.fill === color ? "border-blue-500 scale-110" : "border-neutral-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={selectedBlock.fill}
              onChange={(e) => updateBlock(selectedBlock.id, { fill: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer"
            />
          </div>

          {/* Bold + Alignment */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                updateBlock(selectedBlock.id, {
                  fontStyle: selectedBlock.fontStyle === "bold" ? "normal" : "bold",
                })
              }
              className={`p-1.5 rounded ${
                selectedBlock.fontStyle === "bold" ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            {(["left", "center", "right"] as const).map((align) => {
              const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight
              return (
                <button
                  key={align}
                  onClick={() => updateBlock(selectedBlock.id, { align })}
                  className={`p-1.5 rounded ${
                    selectedBlock.align === align ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              )
            })}
            <div className="flex-1" />
            <button
              onClick={() => deleteBlock(selectedBlock.id)}
              className="p-1.5 rounded text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Export / Cancel */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          className="flex-1 bg-[#0095f6] hover:bg-[#1877f2] text-white"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Apply Text
        </Button>
      </div>
    </div>
  )
}
