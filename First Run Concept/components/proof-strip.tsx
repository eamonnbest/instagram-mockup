"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageZoom } from "./image-zoom"

interface ProofImage {
  type: "on_body" | "macro" | "detail"
  src: string
  alt: string
}

interface ProofStripProps {
  images: ProofImage[]
}

const typeLabels: Record<string, string> = {
  on_body: "ON-BODY",
  macro: "MACRO",
  detail: "DETAIL",
}

export function ProofStrip({ images }: ProofStripProps) {
  const [selectedImage, setSelectedImage] = useState<ProofImage | null>(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detail Views</h3>
        <div className="grid grid-cols-3 gap-3">
          {images.map((image) => (
            <button
              key={image.type}
              onClick={() => setSelectedImage(image)}
              className="group relative aspect-square bg-secondary/50 overflow-hidden"
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wide bg-background/90 px-2 py-1">
                {typeLabels[image.type] || image.type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <ImageZoom
          src={selectedImage.src || "/placeholder.svg"}
          alt={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}
