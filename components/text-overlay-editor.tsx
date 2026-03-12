"use client"

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { Stage, Layer, Image as KonvaImage, Text, Rect, Ellipse, Arrow, Line, Transformer, Group } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Trash2, Download, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Square, Circle, ArrowRight, ImagePlus, ChevronUp, ChevronDown, Copy, Eraser, Loader2,
  LayoutTemplate, Play, Film,
} from "lucide-react"
import { templates, hydrateTemplate } from "@/lib/templates"
import { recordCanvasToMp4, downloadBlob } from "@/lib/video-export"

interface TextBlock {
  id: string
  type: "text"
  text: string
  x: number
  y: number
  fontSize: number
  fill: string
  fontStyle: string // "normal" | "bold" | "italic" | "bold italic"
  fontFamily: string
  align: string
  width: number
  opacity: number
  rotation: number
  // Text background
  bgEnabled: boolean
  bgColor: string
  bgOpacity: number
  bgPadding: number
  bgCornerRadius: number
  // Text effects
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
  // Line height
  lineHeight: number
  letterSpacing: number
  // Animation (for video export)
  animation?: "none" | "fade-in" | "slide-up" | "slide-left" | "slide-right" | "typewriter" | "scale-in"
}

interface ShapeBlock {
  id: string
  type: "rect"
  x: number
  y: number
  width: number
  height: number
  fill: string
  opacity: number
  rotation: number
  cornerRadius: number
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
}

interface EllipseBlock {
  id: string
  type: "ellipse"
  x: number
  y: number
  radiusX: number
  radiusY: number
  fill: string
  opacity: number
  rotation: number
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
}

interface LineBlock {
  id: string
  type: "line"
  x: number
  y: number
  points: number[] // [x1, y1, x2, y2] relative to x,y
  stroke: string
  strokeWidth: number
  opacity: number
  rotation: number
  arrowEnd: boolean
  arrowStart: boolean
  dash: boolean
}

interface ImageBlock {
  id: string
  type: "image"
  x: number
  y: number
  width: number
  height: number
  opacity: number
  rotation: number
  src: string // data URL or external URL
  cornerRadius: number
}

export type CanvasBlock = TextBlock | ShapeBlock | EllipseBlock | LineBlock | ImageBlock

interface TextOverlayEditorProps {
  imageUrl: string
  onExport: (dataUrl: string, blocks: CanvasBlock[], overlayOnlyUrl?: string) => void
  initialBlocks?: CanvasBlock[]
  isVideoCover?: boolean
}

export interface TextOverlayEditorHandle {
  triggerExport: () => void
}

const CANVAS_W = 1080
const CANVAS_H = 1440 // 3:4 aspect ratio
const CANVAS_SIZE = CANVAS_W // backward compat for width references
const DISPLAY_W = 320
const DISPLAY_H = Math.round(DISPLAY_W * (CANVAS_H / CANVAS_W)) // 427
const DISPLAY_SIZE = DISPLAY_W // backward compat for width references

// Sub-component for text blocks with auto-measured background
function TextBlockGroup({
  block: tb,
  isSelected,
  onSelect,
  onUpdate,
  onStartInlineEdit,
}: {
  block: TextBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Record<string, unknown>) => void
  onStartInlineEdit: () => void
}) {
  const textRef = useRef<Konva.Text>(null)
  const [textHeight, setTextHeight] = useState(tb.fontSize * tb.lineHeight)

  useEffect(() => {
    if (textRef.current) {
      setTextHeight(textRef.current.height())
    }
  }, [tb.text, tb.fontSize, tb.fontFamily, tb.fontStyle, tb.width, tb.lineHeight, tb.letterSpacing])

  return (
    <Group
      id={tb.id}
      x={tb.x} y={tb.y}
      rotation={tb.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onStartInlineEdit}
      onDblTap={onStartInlineEdit}
      onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target
        const sx = node.scaleX()
        onUpdate({
          x: node.x(), y: node.y(),
          rotation: node.rotation(),
          width: Math.max(50, tb.width * sx),
          fontSize: Math.max(16, tb.fontSize * node.scaleY()),
        })
        node.scaleX(1); node.scaleY(1)
      }}
    >
      {tb.bgEnabled && (
        <Rect
          x={-tb.bgPadding} y={-tb.bgPadding}
          width={tb.width + tb.bgPadding * 2}
          height={textHeight + tb.bgPadding * 2}
          fill={tb.bgColor}
          opacity={tb.bgOpacity}
          cornerRadius={tb.bgCornerRadius}
          listening={false}
        />
      )}
      <Text
        ref={textRef}
        text={tb.text}
        fontSize={tb.fontSize}
        fill={tb.fill}
        opacity={tb.opacity}
        fontStyle={tb.fontStyle}
        fontFamily={tb.fontFamily}
        align={tb.align}
        width={tb.width}
        lineHeight={tb.lineHeight}
        letterSpacing={tb.letterSpacing}
        shadowEnabled={tb.shadowEnabled}
        shadowColor={tb.shadowColor}
        shadowBlur={tb.shadowBlur}
        shadowOffsetX={tb.shadowOffsetX}
        shadowOffsetY={tb.shadowOffsetY}
        stroke={tb.strokeEnabled ? tb.strokeColor : undefined}
        strokeWidth={tb.strokeEnabled ? tb.strokeWidth : 0}
      />
    </Group>
  )
}

// Sub-component for image overlay blocks
function ImageBlockNode({
  block,
  onSelect,
  onUpdate,
}: {
  block: ImageBlock
  onSelect: () => void
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const image = new window.Image()
    image.crossOrigin = "anonymous"
    image.onload = () => { if (!cancelled) setImg(image) }
    image.src = block.src
    return () => { cancelled = true }
  }, [block.src])

  if (!img) return null

  return (
    <KonvaImage
      id={block.id}
      image={img}
      x={block.x} y={block.y}
      width={block.width} height={block.height}
      rotation={block.rotation}
      opacity={block.opacity}
      cornerRadius={block.cornerRadius}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onUpdate({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target
        onUpdate({
          x: node.x(), y: node.y(),
          rotation: node.rotation(),
          width: Math.max(20, node.width() * node.scaleX()),
          height: Math.max(20, node.height() * node.scaleY()),
        })
        node.scaleX(1); node.scaleY(1)
      }}
    />
  )
}

const PRESET_COLORS = [
  "#ffffff", "#000000", "#1a1a1a", "#f5f5f5",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
]

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
]

export const TextOverlayEditor = forwardRef<TextOverlayEditorHandle, TextOverlayEditorProps>(function TextOverlayEditor({ imageUrl, onExport, initialBlocks, isVideoCover }, ref) {
  const stageRef = useRef<Konva.Stage>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [blocks, setBlocks] = useState<CanvasBlock[]>(initialBlocks || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [removingBgId, setRemovingBgId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExportingVideo, setIsExportingVideo] = useState(false)
  const [videoExportProgress, setVideoExportProgress] = useState(0)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [imgDims, setImgDims] = useState({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H })
  const [imgError, setImgError] = useState(false)
  // Start counter above any existing block IDs to avoid collisions
  const getInitialCounter = () => {
    if (!initialBlocks?.length) return 0
    let max = 0
    for (const b of initialBlocks) {
      const num = parseInt(b.id.split("-").pop() || "0", 10)
      if (num > max) max = num
    }
    return max
  }
  const idCounter = useRef(getInitialCounter())
  const nextId = (prefix: string) => `${prefix}-${++idCounter.current}`
  const overlayFileRef = useRef<HTMLInputElement>(null)
  const bgImageRef = useRef<Konva.Image>(null)
  const realismDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    grayscale: false,
    sepia: false,
    realismPreset: null as null | "phone" | "dslr" | "film" | "disposable",
    realismIntensity: 0.5,
  })

  // Load image with cover-crop
  useEffect(() => {
    let cancelled = false
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (cancelled) return
      const imgRatio = img.width / img.height
      const canvasRatio = CANVAS_W / CANVAS_H
      let w: number, h: number, x: number, y: number
      if (imgRatio > canvasRatio) {
        // Image wider than canvas — fill height, overflow width
        h = CANVAS_H; w = CANVAS_H * imgRatio
        x = -(w - CANVAS_W) / 2; y = 0
      } else {
        // Image taller than canvas — fill width, overflow height
        w = CANVAS_W; h = CANVAS_W / imgRatio
        x = 0; y = -(h - CANVAS_H) / 2
      }
      setImgDims({ x, y, w, h })
      setImage(img)
    }
    img.onerror = () => { if (!cancelled) setImgError(true) }
    img.src = imageUrl
    return () => { cancelled = true }
  }, [imageUrl])

  // Update transformer
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    if (selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId, blocks])

  // Cache Konva module reference to avoid dynamic import on every filter change (#10)
  const konvaRef = useRef<typeof Konva | null>(null)
  useEffect(() => {
    import("konva").then((m) => { konvaRef.current = m.default })
  }, [])

  // Realism preset definitions — each preset is a recipe of stacked techniques
  const REALISM_PRESETS = {
    phone: { noise: 0.25, vignette: 0.15, warmShift: 8, highlightClip: 6, barrelDistortion: 0.008, liftBlacks: 15, desaturate: 0.08, halation: 0 },
    dslr: { noise: 0.1, vignette: 0.25, warmShift: 0, highlightClip: 3, barrelDistortion: -0.003, liftBlacks: 5, desaturate: 0.05, halation: 0 },
    film: { noise: 0.4, vignette: 0.1, warmShift: 5, highlightClip: 10, barrelDistortion: 0.005, liftBlacks: 25, desaturate: 0.15, halation: 0.3 },
    disposable: { noise: 0.6, vignette: 0.5, warmShift: 15, highlightClip: 12, barrelDistortion: 0.015, liftBlacks: 30, desaturate: 0.12, halation: 0.5 },
  }

  // Combined realism filter — applies stacked techniques based on active preset
  const realismPresetRef = useRef<null | "phone" | "dslr" | "film" | "disposable">(null)
  const realismIntensityRef = useRef(0.5)
  const realismFilter = useRef((imageData: ImageData) => {
    const preset = realismPresetRef.current
    if (!preset) return
    const t = realismIntensityRef.current
    if (t === 0) return
    const cfg = REALISM_PRESETS[preset]
    const { width, height, data: d } = imageData
    const cx = width / 2, cy = height / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy)

    // For barrel/pincushion distortion we need a copy of original pixels
    const distortionAmount = cfg.barrelDistortion * t
    let srcCopy: Uint8ClampedArray | null = null
    if (distortionAmount !== 0) {
      srcCopy = new Uint8ClampedArray(d)
    }

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4

        // 1. Barrel/pincushion distortion — sample from distorted source position
        if (srcCopy && distortionAmount !== 0) {
          const nx = (px - cx) / cx  // normalized -1 to 1
          const ny = (py - cy) / cy
          const r2 = nx * nx + ny * ny
          const factor = 1 + distortionAmount * r2
          const sx = Math.round(cx + nx * factor * cx)
          const sy = Math.round(cy + ny * factor * cy)
          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const si = (sy * width + sx) * 4
            d[i] = srcCopy[si]
            d[i + 1] = srcCopy[si + 1]
            d[i + 2] = srcCopy[si + 2]
          }
        }

        const r = d[i], g = d[i + 1], b = d[i + 2]
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255 // 0-1

        // 2. Signal-dependent noise — more noise in shadows (read noise), less in highlights
        const noiseAmount = cfg.noise * t
        if (noiseAmount > 0) {
          // Read noise (Gaussian, stronger in shadows) + shot noise (proportional to brightness)
          const readNoise = (1 - luminance) * noiseAmount * 40
          const shotNoise = Math.sqrt(luminance) * noiseAmount * 20
          const totalNoise = readNoise + shotNoise
          // Box-Muller for Gaussian-distributed noise (better than uniform Math.random)
          const u1 = Math.random() || 0.0001
          const u2 = Math.random()
          const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
          const n = gaussian * totalNoise
          d[i] = Math.min(255, Math.max(0, r + n))
          d[i + 1] = Math.min(255, Math.max(0, g + n))
          d[i + 2] = Math.min(255, Math.max(0, b + n + (Math.random() - 0.5) * noiseAmount * 8)) // slight blue channel variance
        }

        // 3. White balance / warm shift
        const warmR = cfg.warmShift * t
        if (warmR > 0) {
          d[i] = Math.min(255, d[i] + warmR)
          d[i + 1] = Math.min(255, d[i + 1] + warmR * 0.3)
        }

        // 4. Highlight clipping — push near-white values to pure white
        const clipThreshold = 255 - cfg.highlightClip * t
        if (d[i] > clipThreshold) d[i] = 255
        if (d[i + 1] > clipThreshold) d[i + 1] = 255
        if (d[i + 2] > clipThreshold) d[i + 2] = 255

        // 5. Vignette — darken edges based on radial distance
        const vigAmount = cfg.vignette * t
        if (vigAmount > 0) {
          const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxDist
          const factor = 1 - dist * dist * vigAmount
          d[i] = Math.max(0, d[i] * factor)
          d[i + 1] = Math.max(0, d[i + 1] * factor)
          d[i + 2] = Math.max(0, d[i + 2] * factor)
        }

        // 6. Lift blacks (matte look) — raise the floor so darkest values become dark gray, not black
        const liftAmount = cfg.liftBlacks * t
        if (liftAmount > 0) {
          d[i] = Math.min(255, d[i] + (liftAmount * (1 - d[i] / 255)))
          d[i + 1] = Math.min(255, d[i + 1] + (liftAmount * (1 - d[i + 1] / 255)))
          d[i + 2] = Math.min(255, d[i + 2] + (liftAmount * (1 - d[i + 2] / 255)))
        }

        // 7. Desaturate — pull colors toward gray, removing the "advertisement" vibrancy
        const desat = cfg.desaturate * t
        if (desat > 0) {
          const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
          d[i] = d[i] + (gray - d[i]) * desat
          d[i + 1] = d[i + 1] + (gray - d[i + 1]) * desat
          d[i + 2] = d[i + 2] + (gray - d[i + 2]) * desat
        }

        // 8. Halation — bright pixels bleed warm glow into surroundings (applied as per-pixel approximation)
        const halAmount = cfg.halation * t
        if (halAmount > 0 && d[i] > 200) {
          // Bright pixels get a warm bloom — push red up, green slightly, blue stays
          const bloom = ((d[i] - 200) / 55) * halAmount
          d[i] = Math.min(255, d[i] + bloom * 15)
          d[i + 1] = Math.min(255, d[i + 1] + bloom * 5)
          // blue unchanged — halation is warm
        }
      }
    }
  }).current

  // Sync realism refs with state
  useEffect(() => {
    realismPresetRef.current = filters.realismPreset
    realismIntensityRef.current = filters.realismIntensity
  }, [filters.realismPreset, filters.realismIntensity])

  // Apply filters to background image
  useEffect(() => {
    const node = bgImageRef.current
    const K = konvaRef.current
    if (!node || !K) return

    const activeFilters: Array<typeof K.Filters.Brighten> = []
    if (filters.brightness !== 0) activeFilters.push(K.Filters.Brighten)
    if (filters.contrast !== 0) activeFilters.push(K.Filters.Contrast)
    if (filters.blur > 0) activeFilters.push(K.Filters.Blur)
    if (filters.grayscale) activeFilters.push(K.Filters.Grayscale)
    if (filters.saturation !== 0) activeFilters.push(K.Filters.HSL)
    if (filters.sepia) activeFilters.push(K.Filters.Sepia)
    // Realism preset filter
    if (filters.realismPreset) activeFilters.push(realismFilter as unknown as typeof K.Filters.Brighten)

    if (activeFilters.length > 0) {
      node.filters(activeFilters)
      node.brightness(filters.brightness)
      node.contrast(filters.contrast)
      node.blurRadius(filters.blur)
      if (filters.saturation !== 0) {
        node.saturation(filters.saturation)
      }
      node.cache()
    } else {
      node.filters([])
      node.clearCache()
    }
    node.getLayer()?.batchDraw()
  }, [filters, image, realismFilter])

  function addTextBlock() {
    const id = nextId("text")
    const block: TextBlock = {
      id, type: "text",
      text: "Your text here",
      x: CANVAS_W / 2 - 250, y: CANVAS_H / 2 - 50,
      fontSize: 72, fill: "#ffffff",
      fontStyle: "bold", fontFamily: "Arial",
      align: "center", width: 500,
      opacity: 1,
      bgEnabled: false, bgColor: "#000000", bgOpacity: 0.7, bgPadding: 24, bgCornerRadius: 16,
      shadowEnabled: true, shadowColor: "#000000", shadowBlur: 8, shadowOffsetX: 2, shadowOffsetY: 2,
      strokeEnabled: false, strokeColor: "#000000", strokeWidth: 2,
      rotation: 0, lineHeight: 1.2, letterSpacing: 0,
      animation: "none",
    }
    setBlocks((prev) => [...prev, block])
    setSelectedId(id)
  }

  function addShapeBlock() {
    const id = nextId("rect")
    const block: ShapeBlock = {
      id, type: "rect",
      x: CANVAS_W / 4, y: CANVAS_H / 4,
      width: CANVAS_W / 2, height: CANVAS_H / 2,
      fill: "#000000", opacity: 0.5, rotation: 0, cornerRadius: 0,
      strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 4,
    }
    setBlocks((prev) => [...prev, block])
    setSelectedId(id)
  }

  function addEllipseBlock() {
    const id = nextId("ellipse")
    const block: EllipseBlock = {
      id, type: "ellipse",
      x: CANVAS_W / 2, y: CANVAS_H / 2,
      radiusX: 200, radiusY: 200,
      fill: "#000000", opacity: 0.5, rotation: 0,
      strokeEnabled: false, strokeColor: "#ffffff", strokeWidth: 4,
    }
    setBlocks((prev) => [...prev, block])
    setSelectedId(id)
  }

  function addLineBlock() {
    const id = nextId("line")
    const block: LineBlock = {
      id, type: "line",
      x: CANVAS_W / 4, y: CANVAS_H / 2,
      points: [0, 0, CANVAS_W / 2, 0],
      stroke: "#ffffff", strokeWidth: 6, opacity: 1, rotation: 0,
      arrowEnd: true, arrowStart: false, dash: false,
    }
    setBlocks((prev) => [...prev, block])
    setSelectedId(id)
  }

  function handleOverlayFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        const id = nextId("image")
        // Scale to fit within canvas while maintaining aspect ratio
        const maxDim = CANVAS_W / 2
        const ratio = img.width / img.height
        let w: number, h: number
        if (ratio > 1) { w = maxDim; h = maxDim / ratio }
        else { h = maxDim; w = maxDim * ratio }
        const block: ImageBlock = {
          id, type: "image",
          x: (CANVAS_W - w) / 2, y: (CANVAS_H - h) / 2,
          width: w, height: h,
          opacity: 1, rotation: 0, src: dataUrl, cornerRadius: 0,
        }
        setBlocks((prev) => [...prev, block])
        setSelectedId(id)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  function duplicateBlock(id: string) {
    const block = blocks.find((b) => b.id === id)
    if (!block) return
    const newId = nextId(block.type)
    const copy = { ...block, id: newId, x: block.x + 30, y: block.y + 30 }
    // Deep copy arrays to avoid shared references
    if (copy.type === "line") {
      (copy as LineBlock).points = [...(copy as LineBlock).points]
    }
    setBlocks((prev) => [...prev, copy])
    setSelectedId(newId)
  }

  function updateBlock(id: string, updates: Record<string, unknown>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } as CanvasBlock : b)))
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function moveBlockOrder(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const newIdx = direction === "up" ? Math.min(idx + 1, prev.length - 1) : Math.max(idx - 1, 0)
      if (newIdx === idx) return prev
      const arr = [...prev]
      const [item] = arr.splice(idx, 1)
      arr.splice(newIdx, 0, item)
      return arr
    })
  }

  const handleExport = useCallback(() => {
    if (!stageRef.current || !transformerRef.current) return
    // Clear transformer handles before export
    transformerRef.current.nodes([])
    // Ensure filters are fully rendered (re-cache if filters active)
    if (bgImageRef.current && bgImageRef.current.filters()?.length) {
      bgImageRef.current.cache()
    }
    stageRef.current.draw()

    // Export overlay-only PNG (no background) for video compositing — used by both paths
    let overlayOnlyUrl: string | undefined
    if (bgImageRef.current) {
      bgImageRef.current.hide()
      stageRef.current.draw()
      overlayOnlyUrl = stageRef.current.toDataURL({
        pixelRatio: CANVAS_SIZE / DISPLAY_SIZE,
        mimeType: "image/png",
      })
      bgImageRef.current.show()
      stageRef.current.draw()
    }

    // If a realism preset is active, export via JPEG re-encode cycle to strip AI spectral fingerprints
    if (filters.realismPreset) {
      const pngUrl = stageRef.current.toDataURL({
        pixelRatio: CANVAS_SIZE / DISPLAY_SIZE,
        mimeType: "image/png",
      })
      // JPEG re-encode: render to JPEG at quality 88, then re-read as the final output
      // This destroys subtle diffusion model artifacts in the frequency domain
      const fallbackExport = () => {
        setSelectedId(null)
        onExport(pngUrl, blocks, overlayOnlyUrl)
      }
      const tempImg = new window.Image()
      tempImg.onerror = fallbackExport
      tempImg.onload = () => {
        const c = document.createElement("canvas")
        c.width = CANVAS_W; c.height = CANVAS_H
        const ctx = c.getContext("2d")
        if (!ctx) { fallbackExport(); return }
        ctx.drawImage(tempImg, 0, 0, CANVAS_W, CANVAS_H)
        // First JPEG pass
        const jpeg1 = c.toDataURL("image/jpeg", 0.88)
        const tempImg2 = new window.Image()
        tempImg2.onerror = fallbackExport
        tempImg2.onload = () => {
          ctx.drawImage(tempImg2, 0, 0, CANVAS_W, CANVAS_H)
          // Second pass back to PNG for clean output (artifacts are now baked in)
          const finalUrl = c.toDataURL("image/png")
          setSelectedId(null)
          onExport(finalUrl, blocks, overlayOnlyUrl)
        }
        tempImg2.src = jpeg1
      }
      tempImg.src = pngUrl
    } else {
      const dataUrl = stageRef.current.toDataURL({
        pixelRatio: CANVAS_SIZE / DISPLAY_SIZE,
        mimeType: "image/png",
      })
      setSelectedId(null)
      onExport(dataUrl, blocks, overlayOnlyUrl)
    }
  }, [onExport, blocks, filters.realismPreset])

  useImperativeHandle(ref, () => ({
    triggerExport: handleExport,
  }), [handleExport])

  // Track animation cleanup for unmount safety
  const animCleanupRef = useRef<(() => void) | null>(null)
  const animatingRef = useRef(false)

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animCleanupRef.current) animCleanupRef.current()
    }
  }, [])

  // Easing function: cubic ease-out
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

  // Store original blocks for animation restore
  const preAnimBlocksRef = useRef<CanvasBlock[] | null>(null)

  // Animate by updating React state (blocks) on each frame — works with react-konva
  const setupAnimations = useCallback(() => {
    const animatedBlocks = blocks.filter((b) => b.type === "text" && (b as TextBlock).animation && (b as TextBlock).animation !== "none")
    if (animatedBlocks.length === 0) return null

    // Save original block state for restore
    const originals = new Map<string, TextBlock>()
    for (const b of animatedBlocks) {
      originals.set(b.id, { ...(b as TextBlock) })
    }
    preAnimBlocksRef.current = [...blocks]

    // Compute total duration
    const tweenDurationMs = 600
    let maxTypewriterMs = 0
    for (const block of animatedBlocks) {
      const tb = block as TextBlock
      if (tb.animation === "typewriter") {
        maxTypewriterMs = Math.max(maxTypewriterMs, tb.text.length * 40)
      }
    }
    const totalDuration = Math.max(tweenDurationMs, maxTypewriterMs) + 400

    const startTime = performance.now()
    let rafId: number | null = null

    const tick = () => {
      const elapsed = performance.now() - startTime
      const tweenProgress = Math.min(elapsed / tweenDurationMs, 1)
      const easedProgress = easeOut(tweenProgress)

      setBlocks((prev) => prev.map((block) => {
        const orig = originals.get(block.id)
        if (!orig) return block
        const tb = block as TextBlock
        const anim = orig.animation || "none"

        if (anim === "fade-in") {
          return { ...tb, opacity: orig.opacity * easedProgress }
        } else if (anim === "slide-up") {
          const offsetY = 80 * (1 - easedProgress)
          return { ...tb, y: orig.y + offsetY, opacity: orig.opacity * easedProgress }
        } else if (anim === "slide-left") {
          const offsetX = 120 * (1 - easedProgress)
          return { ...tb, x: orig.x + offsetX, opacity: orig.opacity * easedProgress }
        } else if (anim === "slide-right") {
          const offsetX = -120 * (1 - easedProgress)
          return { ...tb, x: orig.x + offsetX, opacity: orig.opacity * easedProgress }
        } else if (anim === "scale-in") {
          // Scale via fontSize for text blocks (react-konva doesn't use scaleX/Y on Group)
          const scaleFactor = 0.3 + 0.7 * easedProgress
          return { ...tb, fontSize: orig.fontSize * scaleFactor, opacity: orig.opacity * easedProgress }
        } else if (anim === "typewriter") {
          const charCount = Math.floor((elapsed / 40))
          const visibleText = orig.text.slice(0, Math.min(charCount, orig.text.length))
          return { ...tb, text: visibleText }
        }
        return block
      }))

      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(tick)
      }
    }

    // Set initial state (everything hidden/offset)
    setBlocks((prev) => prev.map((block) => {
      const orig = originals.get(block.id)
      if (!orig) return block
      const anim = orig.animation || "none"
      const tb = block as TextBlock
      if (anim === "fade-in") return { ...tb, opacity: 0 }
      if (anim === "slide-up") return { ...tb, y: orig.y + 80, opacity: 0 }
      if (anim === "slide-left") return { ...tb, x: orig.x + 120, opacity: 0 }
      if (anim === "slide-right") return { ...tb, x: orig.x - 120, opacity: 0 }
      if (anim === "scale-in") return { ...tb, fontSize: orig.fontSize * 0.3, opacity: 0 }
      if (anim === "typewriter") return { ...tb, text: "" }
      return block
    }))

    // Start animation on next frame
    rafId = requestAnimationFrame(tick)

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId)
      // Restore original blocks
      if (preAnimBlocksRef.current) {
        setBlocks(preAnimBlocksRef.current)
        preAnimBlocksRef.current = null
      }
    }

    return { cleanup, totalDuration }
  }, [blocks])

  const previewAnimations = useCallback(() => {
    if (animatingRef.current) return

    animatingRef.current = true
    setIsAnimating(true)
    setSelectedId(null)

    const result = setupAnimations()
    if (!result) {
      animatingRef.current = false
      setIsAnimating(false)
      return
    }

    let cleanupTimeout: ReturnType<typeof setTimeout> | null = null

    const fullCleanup = () => {
      if (cleanupTimeout) { clearTimeout(cleanupTimeout); cleanupTimeout = null }
      result.cleanup()
      animatingRef.current = false
      setIsAnimating(false)
      animCleanupRef.current = null
    }

    animCleanupRef.current = fullCleanup
    cleanupTimeout = setTimeout(fullCleanup, result.totalDuration)
  }, [setupAnimations])

  const exportVideo = useCallback(async () => {
    const stage = stageRef.current
    const K = konvaRef.current
    if (!stage || !K || animatingRef.current) return

    animatingRef.current = true
    setIsExportingVideo(true)
    setIsAnimating(true)
    setSelectedId(null)
    setVideoExportProgress(0)

    // Temporarily resize stage to full resolution for recording
    const origWidth = stage.width()
    const origHeight = stage.height()
    const origScaleX = stage.scaleX()
    const origScaleY = stage.scaleY()
    stage.width(CANVAS_W)
    stage.height(CANVAS_H)
    stage.scaleX(1)
    stage.scaleY(1)
    stage.batchDraw()

    try {
      // Get the canvas element from the stage container
      const container = stage.container()
      const canvas = container.querySelector("canvas")
      if (!canvas) throw new Error("No canvas element found")

      // Compute duration from animation setup (dry check)
      const animatedBlocks = blocks.filter((b) => b.type === "text" && (b as TextBlock).animation && (b as TextBlock).animation !== "none")
      let maxTypewriterMs = 0
      for (const block of animatedBlocks) {
        const tb = block as TextBlock
        if (tb.animation === "typewriter") maxTypewriterMs = Math.max(maxTypewriterMs, tb.text.length * 40)
      }
      const recordDuration = Math.max(600, maxTypewriterMs) + 900

      // Record canvas — animations start via callback to avoid missing first frames
      const animResultRef: { current: { cleanup: () => void; totalDuration: number } | null } = { current: null }
      const mp4Blob = await recordCanvasToMp4(
        canvas,
        recordDuration,
        () => { animResultRef.current = setupAnimations() },
        30,
        (p) => setVideoExportProgress(p),
      )

      // Cleanup animations
      animResultRef.current?.cleanup()

      // Download the MP4
      downloadBlob(mp4Blob, `lattify-post-${Date.now()}.mp4`)
    } catch (error) {
      console.error("Video export failed:", error)
      alert("Video export failed. Please try again.")
    } finally {
      // Restore stage to display size
      stage.width(origWidth)
      stage.height(origHeight)
      stage.scaleX(origScaleX)
      stage.scaleY(origScaleY)
      stage.batchDraw()

      animatingRef.current = false
      setIsAnimating(false)
      setIsExportingVideo(false)
      setVideoExportProgress(0)
      animCleanupRef.current = null
    }
  }, [blocks, setupAnimations])

  const selectedBlock = blocks.find((b) => b.id === selectedId)
  const scale = DISPLAY_SIZE / CANVAS_SIZE

  // Inline text editing: creates an HTML textarea over the canvas on double-tap
  const startInlineEdit = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block || block.type !== "text" || !canvasContainerRef.current) return
    const tb = block as TextBlock
    setInlineEditId(blockId)
    const s = DISPLAY_SIZE / CANVAS_SIZE

    const container = canvasContainerRef.current
    const textarea = document.createElement("textarea")
    textarea.value = tb.text
    textarea.style.position = "absolute"
    textarea.style.left = `${tb.x * s}px`
    textarea.style.top = `${tb.y * s}px`
    textarea.style.width = `${tb.width * s}px`
    textarea.style.minHeight = `${tb.fontSize * s * tb.lineHeight}px`
    textarea.style.fontSize = `${Math.max(16, tb.fontSize * s)}px`
    textarea.style.lineHeight = `${tb.lineHeight}`
    textarea.style.fontFamily = tb.fontFamily
    textarea.style.fontWeight = tb.fontStyle.includes("bold") ? "bold" : "normal"
    textarea.style.fontStyle = tb.fontStyle.includes("italic") ? "italic" : "normal"
    textarea.style.textAlign = tb.align
    textarea.style.color = tb.fill
    textarea.style.background = "transparent"
    textarea.style.border = "2px solid #0095f6"
    textarea.style.borderRadius = "4px"
    textarea.style.outline = "none"
    textarea.style.resize = "none"
    textarea.style.overflow = "hidden"
    textarea.style.padding = "2px 4px"
    textarea.style.margin = "0"
    textarea.style.zIndex = "10"
    textarea.style.transformOrigin = "top left"
    if (tb.rotation) {
      textarea.style.transform = `rotate(${tb.rotation}deg)`
    }

    container.style.position = "relative"
    container.appendChild(textarea)
    textarea.focus()
    textarea.select()

    // Hide the Konva text while editing
    if (stageRef.current) {
      const node = stageRef.current.findOne(`#${blockId}`)
      if (node) { node.hide(); stageRef.current.draw() }
    }

    const finishEdit = () => {
      const newText = textarea.value
      updateBlock(blockId, { text: newText })
      textarea.remove()
      setInlineEditId(null)
      if (stageRef.current) {
        const node = stageRef.current.findOne(`#${blockId}`)
        if (node) { node.show(); stageRef.current.draw() }
      }
    }

    textarea.addEventListener("blur", finishEdit)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        textarea.blur()
      }
      if (e.key === "Escape") {
        textarea.value = tb.text // revert
        textarea.blur()
      }
    })
  }, [blocks, updateBlock])

  return (
    <div className="space-y-3 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Canvas */}
      {imgError && (
        <div className="mx-auto bg-neutral-100 rounded-lg flex items-center justify-center text-sm text-neutral-500" style={{ width: DISPLAY_W, height: DISPLAY_H }}>
          Failed to load image
        </div>
      )}
      <div
        ref={canvasContainerRef}
        className={`mx-auto bg-neutral-900 rounded-lg overflow-hidden relative ${imgError ? "hidden" : ""}`}
        style={{ width: DISPLAY_W, height: DISPLAY_H }}
      >
        <Stage
          ref={stageRef}
          width={DISPLAY_W}
          height={DISPLAY_H}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null)
            }
          }}
          onTap={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null)
            }
          }}
        >
          <Layer>
            {image && (
              <KonvaImage
                ref={bgImageRef}
                image={image}
                x={imgDims.x} y={imgDims.y}
                width={imgDims.w} height={imgDims.h}
                listening={false}
              />
            )}
            {blocks.map((block) => {
              if (block.type === "rect") {
                return (
                  <Rect
                    key={block.id}
                    id={block.id}
                    x={block.x} y={block.y}
                    width={block.width} height={block.height}
                    rotation={block.rotation}
                    fill={block.fill}
                    opacity={block.opacity}
                    cornerRadius={block.cornerRadius}
                    stroke={block.strokeEnabled ? block.strokeColor : undefined}
                    strokeWidth={block.strokeEnabled ? block.strokeWidth : 0}
                    draggable
                    onClick={() => setSelectedId(block.id)}
                    onTap={() => setSelectedId(block.id)}
                    onDragEnd={(e) => updateBlock(block.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
                      const node = e.target
                      updateBlock(block.id, {
                        x: node.x(), y: node.y(),
                        rotation: node.rotation(),
                        width: Math.max(20, node.width() * node.scaleX()),
                        height: Math.max(20, node.height() * node.scaleY()),
                      })
                      node.scaleX(1); node.scaleY(1)
                    }}
                  />
                )
              }
              if (block.type === "ellipse") {
                return (
                  <Ellipse
                    key={block.id}
                    id={block.id}
                    x={block.x} y={block.y}
                    radiusX={block.radiusX} radiusY={block.radiusY}
                    rotation={block.rotation}
                    fill={block.fill}
                    opacity={block.opacity}
                    stroke={block.strokeEnabled ? block.strokeColor : undefined}
                    strokeWidth={block.strokeEnabled ? block.strokeWidth : 0}
                    draggable
                    onClick={() => setSelectedId(block.id)}
                    onTap={() => setSelectedId(block.id)}
                    onDragEnd={(e) => updateBlock(block.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
                      const node = e.target
                      updateBlock(block.id, {
                        x: node.x(), y: node.y(),
                        rotation: node.rotation(),
                        radiusX: Math.max(10, block.radiusX * node.scaleX()),
                        radiusY: Math.max(10, block.radiusY * node.scaleY()),
                      })
                      node.scaleX(1); node.scaleY(1)
                    }}
                  />
                )
              }
              if (block.type === "line") {
                const LineComponent = (block.arrowEnd || block.arrowStart) ? Arrow : Line
                return (
                  <LineComponent
                    key={block.id}
                    id={block.id}
                    x={block.x} y={block.y}
                    points={block.points}
                    rotation={block.rotation}
                    stroke={block.stroke}
                    strokeWidth={block.strokeWidth}
                    opacity={block.opacity}
                    pointerLength={block.arrowEnd || block.arrowStart ? 20 : 0}
                    pointerWidth={block.arrowEnd || block.arrowStart ? 20 : 0}
                    pointerAtBeginning={block.arrowStart}
                    dash={block.dash ? [20, 10] : undefined}
                    draggable
                    onClick={() => setSelectedId(block.id)}
                    onTap={() => setSelectedId(block.id)}
                    onDragEnd={(e) => updateBlock(block.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
                      const node = e.target
                      const sx = node.scaleX()
                      const sy = node.scaleY()
                      updateBlock(block.id, {
                        x: node.x(), y: node.y(),
                        rotation: node.rotation(),
                        points: block.points.map((p, i) => p * (i % 2 === 0 ? sx : sy)),
                      })
                      node.scaleX(1); node.scaleY(1)
                    }}
                  />
                )
              }
              if (block.type === "image") {
                return (
                  <ImageBlockNode
                    key={block.id}
                    block={block}
                    onSelect={() => setSelectedId(block.id)}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                  />
                )
              }
              const tb = block as TextBlock
              return (
                <TextBlockGroup
                  key={tb.id}
                  block={tb}
                  isSelected={selectedId === tb.id}
                  onSelect={() => setSelectedId(tb.id)}
                  onUpdate={(updates) => updateBlock(tb.id, updates)}
                  onStartInlineEdit={() => startInlineEdit(tb.id)}
                />
              )
            })}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(_, newBox) => ({
                ...newBox,
                width: Math.max(30, newBox.width),
                height: Math.max(30, newBox.height),
              })}
            />
          </Layer>
        </Stage>
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={addTextBlock} variant="outline" size="sm" className="flex-1">
          <Type className="w-4 h-4 mr-1.5" />
          Text
        </Button>
        <Button onClick={addShapeBlock} variant="outline" size="sm" className="flex-1">
          <Square className="w-4 h-4 mr-1.5" />
          Rect
        </Button>
        <Button onClick={addEllipseBlock} variant="outline" size="sm" className="flex-1">
          <Circle className="w-4 h-4 mr-1.5" />
          Ellipse
        </Button>
        <Button onClick={addLineBlock} variant="outline" size="sm" className="flex-1">
          <ArrowRight className="w-4 h-4 mr-1.5" />
          Line
        </Button>
        <Button onClick={() => overlayFileRef.current?.click()} variant="outline" size="sm" className="flex-1">
          <ImagePlus className="w-4 h-4 mr-1.5" />
          Image
        </Button>
        <input
          ref={overlayFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleOverlayFile(file)
            e.target.value = ""
          }}
        />
      </div>

      {/* Template picker */}
      <div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <LayoutTemplate className="w-4 h-4 mr-1.5" />
          {showTemplates ? "Hide Templates" : "Templates"}
        </Button>
        {showTemplates && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  const hydrated = hydrateTemplate(tpl)
                  setBlocks((prev) => [...prev, ...hydrated])
                  setSelectedId(null)
                  setShowTemplates(false)
                }}
                className="p-2 text-left border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-xs font-medium text-neutral-800 block truncate">{tpl.name}</span>
                <span className="text-[10px] text-neutral-400">{tpl.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview + Export animation */}
      {blocks.some((b) => b.type === "text" && (b as TextBlock).animation && (b as TextBlock).animation !== "none") && (
        <div className="flex gap-2">
          <Button
            onClick={previewAnimations}
            disabled={isAnimating}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-1.5" />
            {isAnimating && !isExportingVideo ? "Playing..." : "Preview"}
          </Button>
          <Button
            onClick={exportVideo}
            disabled={isAnimating}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isExportingVideo ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                {Math.round(videoExportProgress * 100)}%
              </>
            ) : (
              <>
                <Film className="w-4 h-4 mr-1.5" />
                Export MP4
              </>
            )}
          </Button>
        </div>
      )}

      {/* Background filters — shown when nothing selected, hidden for video covers */}
      {!selectedBlock && !isVideoCover && (
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
          <span className="text-xs font-medium text-neutral-700">Background Filters</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-16">Brightness</span>
            <input
              type="range" min={-1} max={1} step={0.05}
              value={filters.brightness}
              onChange={(e) => setFilters((f) => ({ ...f, brightness: Number(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{Math.round(filters.brightness * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-16">Contrast</span>
            <input
              type="range" min={-100} max={100} step={1}
              value={filters.contrast}
              onChange={(e) => setFilters((f) => ({ ...f, contrast: Number(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{filters.contrast}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-16">Saturation</span>
            <input
              type="range" min={-2} max={2} step={0.1}
              value={filters.saturation}
              onChange={(e) => setFilters((f) => ({ ...f, saturation: Number(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{filters.saturation.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-16">Blur</span>
            <input
              type="range" min={0} max={20} step={0.5}
              value={filters.blur}
              onChange={(e) => setFilters((f) => ({ ...f, blur: Number(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{filters.blur}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
              <input
                type="checkbox" checked={filters.grayscale}
                onChange={(e) => setFilters((f) => ({ ...f, grayscale: e.target.checked }))}
              />
              Grayscale
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
              <input
                type="checkbox" checked={filters.sepia}
                onChange={(e) => setFilters((f) => ({ ...f, sepia: e.target.checked }))}
              />
              Sepia
            </label>
          </div>
          <div className="border-t border-neutral-200 pt-2 mt-2">
            <span className="text-xs font-medium text-neutral-700">De-AI Presets</span>
            <p className="text-[10px] text-neutral-400 mt-0.5">Simulates real camera characteristics</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {([
              { id: "phone" as const, label: "Phone Snap" },
              { id: "dslr" as const, label: "DSLR" },
              { id: "film" as const, label: "Film" },
              { id: "disposable" as const, label: "Disposable" },
            ]).map((p) => (
              <button
                key={p.id}
                onClick={() => setFilters((f) => ({ ...f, realismPreset: f.realismPreset === p.id ? null : p.id }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.realismPreset === p.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {filters.realismPreset && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-16">Intensity</span>
              <input
                type="range" min={0.1} max={1} step={0.05}
                value={filters.realismIntensity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  // Update display value immediately but debounce the expensive filter recomputation
                  if (realismDebounceRef.current) clearTimeout(realismDebounceRef.current)
                  realismIntensityRef.current = val
                  realismDebounceRef.current = setTimeout(() => {
                    setFilters((f) => ({ ...f, realismIntensity: val }))
                  }, 150)
                }}
                className="flex-1"
              />
              <span className="text-xs text-neutral-500 w-8 text-right">{Math.round(filters.realismIntensity * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Controls panel */}
      {selectedBlock && (
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3 max-h-[350px] overflow-y-auto">
          {/* Common: Layer order + duplicate + delete */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => moveBlockOrder(selectedBlock.id, "up")} className="p-1.5 rounded bg-white border border-neutral-200 hover:bg-neutral-100" title="Bring forward">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => moveBlockOrder(selectedBlock.id, "down")} className="p-1.5 rounded bg-white border border-neutral-200 hover:bg-neutral-100" title="Send backward">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => duplicateBlock(selectedBlock.id)} className="p-1.5 rounded bg-white border border-neutral-200 hover:bg-neutral-100" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button onClick={() => deleteBlock(selectedBlock.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-14">Opacity</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={selectedBlock.opacity}
              onChange={(e) => updateBlock(selectedBlock.id, { opacity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 w-8 text-right">{Math.round(selectedBlock.opacity * 100)}%</span>
          </div>

          {/* Color */}
          {selectedBlock.type !== "line" && selectedBlock.type !== "image" && (
            <div>
              <span className="text-xs text-neutral-500 mb-1 block">Fill color</span>
              <div className="flex items-center gap-1 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBlock(selectedBlock.id, { fill: color })}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      (selectedBlock as TextBlock | ShapeBlock | EllipseBlock).fill === color ? "border-blue-500 scale-110" : "border-neutral-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={(selectedBlock as TextBlock | ShapeBlock | EllipseBlock).fill}
                  onChange={(e) => updateBlock(selectedBlock.id, { fill: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Shape-specific controls */}
          {selectedBlock.type === "rect" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-14">Radius</span>
                <input
                  type="range" min={0} max={100}
                  value={(selectedBlock as ShapeBlock).cornerRadius}
                  onChange={(e) => updateBlock(selectedBlock.id, { cornerRadius: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-500 w-8 text-right">{(selectedBlock as ShapeBlock).cornerRadius}</span>
              </div>
              {/* Stroke */}
              <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(selectedBlock as ShapeBlock).strokeEnabled}
                  onChange={(e) => updateBlock(selectedBlock.id, { strokeEnabled: e.target.checked })}
                />
                Border
                {(selectedBlock as ShapeBlock).strokeEnabled && (
                  <>
                    <input
                      type="color"
                      value={(selectedBlock as ShapeBlock).strokeColor}
                      onChange={(e) => updateBlock(selectedBlock.id, { strokeColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <input
                      type="range" min={1} max={20}
                      value={(selectedBlock as ShapeBlock).strokeWidth}
                      onChange={(e) => updateBlock(selectedBlock.id, { strokeWidth: Number(e.target.value) })}
                      className="flex-1"
                    />
                  </>
                )}
              </label>
            </>
          )}

          {/* Ellipse-specific controls */}
          {selectedBlock.type === "ellipse" && (() => {
            const eb = selectedBlock as EllipseBlock
            return (
              <>
                <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eb.strokeEnabled}
                    onChange={(e) => updateBlock(eb.id, { strokeEnabled: e.target.checked })}
                  />
                  Border
                  {eb.strokeEnabled && (
                    <>
                      <input
                        type="color"
                        value={eb.strokeColor}
                        onChange={(e) => updateBlock(eb.id, { strokeColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                      <input
                        type="range" min={1} max={20}
                        value={eb.strokeWidth}
                        onChange={(e) => updateBlock(eb.id, { strokeWidth: Number(e.target.value) })}
                        className="flex-1"
                      />
                    </>
                  )}
                </label>
              </>
            )
          })()}

          {/* Line-specific controls */}
          {selectedBlock.type === "line" && (() => {
            const lb = selectedBlock as LineBlock
            return (
              <>
                <div>
                  <span className="text-xs text-neutral-500 mb-1 block">Stroke color</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateBlock(lb.id, { stroke: color })}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          lb.stroke === color ? "border-blue-500 scale-110" : "border-neutral-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={lb.stroke}
                      onChange={(e) => updateBlock(lb.id, { stroke: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Width</span>
                  <input
                    type="range" min={1} max={30}
                    value={lb.strokeWidth}
                    onChange={(e) => updateBlock(lb.id, { strokeWidth: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 w-8 text-right">{lb.strokeWidth}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox" checked={lb.arrowEnd}
                      onChange={(e) => updateBlock(lb.id, { arrowEnd: e.target.checked })}
                    />
                    Arrow end
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox" checked={lb.arrowStart}
                      onChange={(e) => updateBlock(lb.id, { arrowStart: e.target.checked })}
                    />
                    Arrow start
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox" checked={lb.dash}
                      onChange={(e) => updateBlock(lb.id, { dash: e.target.checked })}
                    />
                    Dashed
                  </label>
                </div>
              </>
            )
          })()}

          {/* Image-specific controls */}
          {selectedBlock.type === "image" && (() => {
            const ib = selectedBlock as ImageBlock
            return (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Radius</span>
                  <input
                    type="range" min={0} max={100}
                    value={ib.cornerRadius}
                    onChange={(e) => updateBlock(ib.id, { cornerRadius: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 w-8 text-right">{ib.cornerRadius}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={removingBgId !== null}
                  onClick={async () => {
                    if (removingBgId) return // guard against double-click
                    const blockId = ib.id
                    setRemovingBgId(blockId)
                    try {
                      // Upload the image to get a public URL (fal.ai needs a URL, not a data URL)
                      const res = await fetch(ib.src)
                      const blob = await res.blob()
                      const file = new File([blob], "overlay.png", { type: "image/png" })
                      const formData = new FormData()
                      formData.append("file", file)
                      const uploadRes = await fetch("/api/instagram/upload", { method: "POST", body: formData })
                      if (!uploadRes.ok) throw new Error("Upload failed")
                      const { imageUrl: publicUrl } = await uploadRes.json()

                      // Call background removal API
                      const bgRes = await fetch("/api/instagram/remove-bg", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image_url: publicUrl }),
                      })
                      if (!bgRes.ok) throw new Error("Background removal failed")
                      const { imageUrl: transparentUrl } = await bgRes.json()

                      // Convert to data URL to avoid CORS tainted canvas on export
                      const imgRes = await fetch(transparentUrl)
                      const imgBlob = await imgRes.blob()
                      const reader = new FileReader()
                      const dataUrl = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(imgBlob)
                      })

                      updateBlock(blockId, { src: dataUrl })
                    } catch (error) {
                      console.error("Remove background failed:", error)
                      alert("Failed to remove background. Please try again.")
                    } finally {
                      setRemovingBgId(null)
                    }
                  }}
                >
                  {removingBgId === ib.id ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Removing...</>
                  ) : (
                    <><Eraser className="w-3.5 h-3.5 mr-1.5" />Remove Background</>
                  )}
                </Button>
              </>
            )
          })()}

          {/* Text-specific controls */}
          {selectedBlock.type === "text" && (() => {
            const tb = selectedBlock as TextBlock
            return (
              <>
                {/* Text content */}
                <Textarea
                  value={tb.text}
                  onChange={(e) => updateBlock(tb.id, { text: e.target.value })}
                  placeholder="Enter text..."
                  className="text-base min-h-[60px] resize-none"
                />

                {/* Font family */}
                <select
                  value={tb.fontFamily}
                  onChange={(e) => updateBlock(tb.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                {/* Font size */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Size</span>
                  <input
                    type="range" min={16} max={200}
                    value={tb.fontSize}
                    onChange={(e) => updateBlock(tb.id, { fontSize: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 w-8 text-right">{Math.round(tb.fontSize)}</span>
                </div>

                {/* Line height */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Leading</span>
                  <input
                    type="range" min={0.8} max={2.5} step={0.05}
                    value={tb.lineHeight}
                    onChange={(e) => updateBlock(tb.id, { lineHeight: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 w-8 text-right">{tb.lineHeight.toFixed(1)}</span>
                </div>

                {/* Letter spacing */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Tracking</span>
                  <input
                    type="range" min={-5} max={20} step={0.5}
                    value={tb.letterSpacing}
                    onChange={(e) => updateBlock(tb.id, { letterSpacing: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-neutral-500 w-8 text-right">{tb.letterSpacing}</span>
                </div>

                {/* Bold + Italic + Alignment */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const isBold = tb.fontStyle.includes("bold")
                      const isItalic = tb.fontStyle.includes("italic")
                      const newBold = !isBold
                      updateBlock(tb.id, {
                        fontStyle: [newBold ? "bold" : "", isItalic ? "italic" : ""].filter(Boolean).join(" ") || "normal",
                      })
                    }}
                    className={`p-1.5 rounded ${tb.fontStyle.includes("bold") ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"}`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const isBold = tb.fontStyle.includes("bold")
                      const isItalic = tb.fontStyle.includes("italic")
                      const newItalic = !isItalic
                      updateBlock(tb.id, {
                        fontStyle: [isBold ? "bold" : "", newItalic ? "italic" : ""].filter(Boolean).join(" ") || "normal",
                      })
                    }}
                    className={`p-1.5 rounded ${tb.fontStyle.includes("italic") ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"}`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-5 bg-neutral-200 mx-0.5" />
                  {(["left", "center", "right"] as const).map((align) => {
                    const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight
                    return (
                      <button
                        key={align}
                        onClick={() => updateBlock(tb.id, { align })}
                        className={`p-1.5 rounded ${tb.align === align ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    )
                  })}
                </div>

                {/* Text background */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tb.bgEnabled}
                      onChange={(e) => updateBlock(tb.id, { bgEnabled: e.target.checked })}
                    />
                    Text background
                  </label>
                  {tb.bgEnabled && (
                    <div className="pl-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color" value={tb.bgColor}
                          onChange={(e) => updateBlock(tb.id, { bgColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                        <span className="text-xs text-neutral-500 w-14">Opacity</span>
                        <input
                          type="range" min={0} max={1} step={0.05} value={tb.bgOpacity}
                          onChange={(e) => updateBlock(tb.id, { bgOpacity: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-14">Padding</span>
                        <input
                          type="range" min={0} max={60} value={tb.bgPadding}
                          onChange={(e) => updateBlock(tb.id, { bgPadding: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-14">Radius</span>
                        <input
                          type="range" min={0} max={40} value={tb.bgCornerRadius}
                          onChange={(e) => updateBlock(tb.id, { bgCornerRadius: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Drop shadow */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tb.shadowEnabled}
                      onChange={(e) => updateBlock(tb.id, { shadowEnabled: e.target.checked })}
                    />
                    Drop shadow
                  </label>
                  {tb.shadowEnabled && (
                    <div className="pl-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color" value={tb.shadowColor}
                          onChange={(e) => updateBlock(tb.id, { shadowColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                        <span className="text-xs text-neutral-500 w-10">Blur</span>
                        <input
                          type="range" min={0} max={30} value={tb.shadowBlur}
                          onChange={(e) => updateBlock(tb.id, { shadowBlur: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-10">X</span>
                        <input
                          type="range" min={-20} max={20} value={tb.shadowOffsetX}
                          onChange={(e) => updateBlock(tb.id, { shadowOffsetX: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-neutral-500 w-10">Y</span>
                        <input
                          type="range" min={-20} max={20} value={tb.shadowOffsetY}
                          onChange={(e) => updateBlock(tb.id, { shadowOffsetY: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Text stroke */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tb.strokeEnabled}
                      onChange={(e) => updateBlock(tb.id, { strokeEnabled: e.target.checked })}
                    />
                    Text outline
                  </label>
                  {tb.strokeEnabled && (
                    <div className="pl-5 flex items-center gap-2">
                      <input
                        type="color" value={tb.strokeColor}
                        onChange={(e) => updateBlock(tb.id, { strokeColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                      <span className="text-xs text-neutral-500 w-10">Width</span>
                      <input
                        type="range" min={1} max={10} value={tb.strokeWidth}
                        onChange={(e) => updateBlock(tb.id, { strokeWidth: Number(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>

                {/* Animation */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 w-14">Animate</span>
                  <select
                    value={tb.animation || "none"}
                    onChange={(e) => updateBlock(tb.id, { animation: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white"
                  >
                    <option value="none">None</option>
                    <option value="fade-in">Fade In</option>
                    <option value="slide-up">Slide Up</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="scale-in">Scale In</option>
                  </select>
                </div>
              </>
            )
          })()}
        </div>
      )}

    </div>
  )
})
