"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { formatPrice } from "@/lib/utils/format"

interface Colorway {
  code: string
  hex: string
  accentThread: string
  images: Record<string, string | null>
  accents?: Record<string, string>
}

interface ProductBuyModuleProps {
  product: Product
  selectedColorway?: Colorway | null
  onColorwayChange?: (index: number) => void
  colorways?: Colorway[]
}

const sizes = ["S", "M", "L", "XL"]

export function ProductBuyModule({
  product,
  selectedColorway,
  onColorwayChange,
  colorways = [],
}: ProductBuyModuleProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const isCore = product.status === "core"
  const isExperiment = product.status === "threshold"
  const isAvailable = isCore || isExperiment || product.status === "in_production"
  const progress = (product.confirmed_orders / product.threshold) * 100
  const remaining = product.threshold - product.confirmed_orders

  const canOrder = isAvailable && selectedSize && (colorways.length === 0 || selectedColorway)

  const sku = product.specs?.sku as string
  const season = product.specs?.season as string
  const material = product.specs?.material as { name: string; composition: string } | undefined

  const getColorDisplayName = (cw: Colorway) => cw.code.replace(/_/g, " / ")

  return (
    <div className="space-y-6">
      {/* SKU + Season */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
        <span>{sku}</span>
        <span>·</span>
        <span>{season}</span>
        {isCore && (
          <>
            <span>·</span>
            <span className="text-green-700">In stock</span>
          </>
        )}
      </div>

      {/* Title + Price */}
      <div>
        <h1 className="text-xl font-medium tracking-tight mb-2">{product.name}</h1>
        <p className="text-lg">{formatPrice(product.price, product.currency)}</p>
      </div>

      {/* Material headline */}
      {material && <p className="text-sm text-muted-foreground">{material.name}</p>}

      {isExperiment && (
        <div className="space-y-2 py-4 border-y border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Production threshold</span>
            <span>
              {product.confirmed_orders} / {product.threshold} orders
            </span>
          </div>
          <div className="h-1 bg-secondary overflow-hidden">
            <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress >= 100 ? "Threshold met — production begins soon" : `${remaining} more orders needed`}
          </p>
        </div>
      )}

      {isCore && (
        <div className="py-4 border-y border-border">
          <p className="text-sm text-green-700 font-medium">Ready to ship</p>
          <p className="text-xs text-muted-foreground mt-1">
            This style earned its place through the threshold. Now in permanent stock.
          </p>
        </div>
      )}

      {colorways.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">Colorway</p>
            {selectedColorway && (
              <p className="text-sm">
                <span className="font-medium">{getColorDisplayName(selectedColorway)}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colorways.map((colorway, index) => {
              const isSelected = selectedColorway?.code === colorway.code

              return (
                <button
                  key={colorway.code}
                  onClick={() => onColorwayChange?.(index)}
                  className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                    isSelected ? "border-foreground scale-110" : "border-border hover:border-foreground/50"
                  }`}
                  style={{ backgroundColor: colorway.hex }}
                  title={`${colorway.code} + ${colorway.accentThread}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm">Size</p>
          <button className="text-xs text-muted-foreground underline underline-offset-4">Size guide</button>
        </div>
        <div className="flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`flex-1 h-12 border text-sm font-medium transition-colors ${
                selectedSize === size
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!canOrder}
        className="hidden md:block w-full bg-foreground text-background py-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
      >
        {!canOrder
          ? "Select options"
          : isCore
            ? `ADD TO BAG — ${getColorDisplayName(selectedColorway!)} / ${selectedSize}`
            : `COMMIT TO ORDER — ${getColorDisplayName(selectedColorway!)} / ${selectedSize}`}
      </button>

      <div className="text-xs text-muted-foreground space-y-1">
        {isCore ? (
          <p>Ships within 3–5 business days.</p>
        ) : (
          <>
            <p>
              Made to order. Delivery {product.delivery_weeks || 5}–{(product.delivery_weeks || 5) + 1} weeks from
              threshold.
            </p>
            <p>If threshold is not met within 30 days, your order is refunded automatically.</p>
          </>
        )}
      </div>
    </div>
  )
}
