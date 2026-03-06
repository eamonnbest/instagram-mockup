"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { formatPrice } from "@/lib/utils/format"
import { SpecCard } from "./spec-card"
import { X } from "lucide-react"

interface QuickViewModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

const sizes = ["XS", "S", "M", "L", "XL"]

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  if (!isOpen) return null

  const variants = product.specs?.variants as Array<{ name: string; hex: string; image_url?: string }> | undefined
  const firstVariantWithImage = variants?.find((v) => v.image_url)
  const imageUrl = firstVariantWithImage?.image_url || product.image_url
  const progress = (product.confirmed_orders / product.threshold) * 100

  // Extract spec card data
  const specCard = {
    fabric: product.specs?.fabric as string,
    weight: product.specs?.weight as string,
    construction: product.specs?.construction as string,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative bg-background max-w-3xl w-full max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 hover:bg-secondary/50 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-secondary/30 relative">
            <Image
              src={imageUrl || `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(product.name)}`}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-1">{product.name}</h2>
              <p className="text-base">{formatPrice(product.price, product.currency)}</p>
            </div>

            {/* Sizes row */}
            <div className="flex gap-2">
              {sizes.map((size) => (
                <span key={size} className="text-xs text-muted-foreground border border-border px-2 py-1">
                  {size}
                </span>
              ))}
            </div>

            {/* Condensed Spec Card */}
            <SpecCard {...specCard} condensed />

            {/* Status + Progress */}
            {product.status === "threshold" && (
              <div className="space-y-2">
                <div className="h-1 bg-secondary overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {product.confirmed_orders} / {product.threshold} confirmed
                </p>
              </div>
            )}

            {product.status === "in_production" && <span className="text-xs text-muted-foreground">IN PRODUCTION</span>}

            {/* CTA */}
            <Link
              href={`/products/men/${product.slug}`}
              className="block w-full bg-foreground text-background py-4 text-sm font-medium text-center hover:bg-foreground/90 transition-colors"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
