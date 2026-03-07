"use client"

import { useRef, useEffect } from "react"
import type { CanvasBlock } from "@/components/text-overlay-editor"

const SOURCE_SIZE = 1080
const THUMB_SIZE = 160

interface TemplateThumbnailProps {
  blocks: CanvasBlock[]
  size?: number
}

// Warm café-style gradient as placeholder background
function drawPlaceholderBg(ctx: CanvasRenderingContext2D, size: number) {
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, "#8B7355")
  gradient.addColorStop(0.5, "#6B5B45")
  gradient.addColorStop(1, "#4A3F35")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Subtle noise/texture feel with some shapes
  ctx.globalAlpha = 0.08
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(size * 0.7, size * 0.3, size * 0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(size * 0.2, size * 0.7, size * 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

export function TemplateThumbnail({ blocks, size = THUMB_SIZE }: TemplateThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = 2
    const renderSize = size * dpr
    const scale = renderSize / SOURCE_SIZE
    canvas.width = renderSize
    canvas.height = renderSize

    drawPlaceholderBg(ctx, renderSize)

    for (const block of blocks) {
      ctx.save()

      if (block.type === "rect") {
        ctx.globalAlpha = block.opacity
        ctx.fillStyle = block.fill
        const x = block.x * scale
        const y = block.y * scale
        const w = block.width * scale
        const h = block.height * scale
        const r = block.cornerRadius * scale
        if (r > 0) {
          ctx.beginPath()
          ctx.roundRect(x, y, w, h, r)
          ctx.fill()
        } else {
          ctx.fillRect(x, y, w, h)
        }
        if (block.strokeEnabled) {
          ctx.strokeStyle = block.strokeColor
          ctx.lineWidth = block.strokeWidth * scale
          ctx.strokeRect(x, y, w, h)
        }
      }

      if (block.type === "ellipse") {
        ctx.globalAlpha = block.opacity
        ctx.fillStyle = block.fill
        ctx.beginPath()
        ctx.ellipse(
          block.x * scale,
          block.y * scale,
          block.radiusX * scale,
          block.radiusY * scale,
          0, 0, Math.PI * 2,
        )
        ctx.fill()
        if (block.strokeEnabled) {
          ctx.strokeStyle = block.strokeColor
          ctx.lineWidth = block.strokeWidth * scale
          ctx.stroke()
        }
      }

      if (block.type === "text") {
        ctx.globalAlpha = block.opacity
        const fontSize = Math.max(4, block.fontSize * scale)
        const fontStyle = block.fontStyle.includes("italic") ? "italic " : ""
        const fontWeight = block.fontStyle.includes("bold") ? "bold " : ""
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${block.fontFamily}`

        // Text background
        if (block.bgEnabled) {
          ctx.save()
          ctx.globalAlpha = block.bgOpacity
          ctx.fillStyle = block.bgColor
          const padding = block.bgPadding * scale
          const textWidth = block.width * scale
          const lines = wrapText(ctx, block.text, textWidth)
          const lineH = fontSize * block.lineHeight
          const totalH = lines.length * lineH
          const bgR = block.bgCornerRadius * scale
          ctx.beginPath()
          ctx.roundRect(
            block.x * scale - padding,
            block.y * scale - padding,
            textWidth + padding * 2,
            totalH + padding * 2,
            bgR,
          )
          ctx.fill()
          ctx.restore()
          // Reset font after restore
          ctx.globalAlpha = block.opacity
          ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${block.fontFamily}`
        }

        // Text stroke
        if (block.strokeEnabled) {
          ctx.strokeStyle = block.strokeColor
          ctx.lineWidth = block.strokeWidth * scale
        }

        ctx.fillStyle = block.fill === "transparent" ? "rgba(0,0,0,0)" : block.fill
        ctx.textBaseline = "top"

        const textWidth = block.width * scale
        const lines = wrapText(ctx, block.text, textWidth)
        const lineH = fontSize * block.lineHeight

        lines.forEach((line, i) => {
          let x = block.x * scale
          if (block.align === "center") {
            const w = ctx.measureText(line).width
            x += (textWidth - w) / 2
          } else if (block.align === "right") {
            const w = ctx.measureText(line).width
            x += textWidth - w
          }
          const y = block.y * scale + i * lineH

          if (block.strokeEnabled && block.fill !== "transparent") {
            ctx.strokeText(line, x, y)
          }
          if (block.fill !== "transparent") {
            ctx.fillText(line, x, y)
          } else if (block.strokeEnabled) {
            ctx.strokeText(line, x, y)
          }
        })
      }

      if (block.type === "line") {
        ctx.globalAlpha = block.opacity
        ctx.strokeStyle = block.stroke
        ctx.lineWidth = block.strokeWidth * scale
        const pts = block.points
        if (pts.length >= 4) {
          ctx.beginPath()
          ctx.moveTo((block.x + pts[0]) * scale, (block.y + pts[1]) * scale)
          for (let i = 2; i < pts.length; i += 2) {
            ctx.lineTo((block.x + pts[i]) * scale, (block.y + pts[i + 1]) * scale)
          }
          ctx.stroke()

          // Arrow head
          if (block.arrowEnd && pts.length >= 4) {
            const lastX = (block.x + pts[pts.length - 2]) * scale
            const lastY = (block.y + pts[pts.length - 1]) * scale
            const prevX = (block.x + pts[pts.length - 4]) * scale
            const prevY = (block.y + pts[pts.length - 3]) * scale
            const angle = Math.atan2(lastY - prevY, lastX - prevX)
            const headLen = 8 * scale
            ctx.beginPath()
            ctx.moveTo(lastX, lastY)
            ctx.lineTo(lastX - headLen * Math.cos(angle - 0.4), lastY - headLen * Math.sin(angle - 0.4))
            ctx.moveTo(lastX, lastY)
            ctx.lineTo(lastX - headLen * Math.cos(angle + 0.4), lastY - headLen * Math.sin(angle + 0.4))
            ctx.stroke()
          }
        }
      }

      ctx.restore()
    }
  }, [blocks, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full rounded"
      style={{ imageRendering: "auto" }}
    />
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ")
    let current = ""
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines.length ? lines : [""]
}
