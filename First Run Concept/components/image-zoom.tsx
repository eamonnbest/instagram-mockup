"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"

interface ImageZoomProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageZoom({ src, alt, isOpen, onClose }: ImageZoomProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    setScale((prev) => Math.min(Math.max(prev + delta, 1), 4))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2.5)
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-foreground/10 hover:bg-foreground/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-foreground/10 backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={() => setScale((prev) => Math.max(prev - 0.5, 1))}
          className="text-sm font-medium hover:opacity-70 transition-opacity"
          disabled={scale <= 1}
        >
          −
        </button>
        <span className="text-sm font-medium min-w-[4rem] text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((prev) => Math.min(prev + 0.5, 4))}
          className="text-sm font-medium hover:opacity-70 transition-opacity"
          disabled={scale >= 4}
        >
          +
        </button>
      </div>

      {/* Hint text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-sm text-muted-foreground">
        Double-click to zoom • Scroll to adjust • Drag to pan
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "zoom-in" }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            width={800}
            height={1000}
            className="max-h-[85vh] w-auto object-contain select-none"
            draggable={false}
            priority
          />
        </div>
      </div>
    </div>
  )
}
