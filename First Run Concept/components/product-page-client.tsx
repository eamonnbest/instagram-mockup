"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { ProductBuyModule } from "@/components/product-buy-module"
import { ImageZoom } from "@/components/image-zoom"

interface Colorway {
  code: string
  hex: string
  accentThread: string
  images: Record<string, string | null>
  accents?: Record<string, string>
}

interface Material {
  name: string
  composition: string
  handfeel: string
  performance: string[]
}

interface Restomod {
  reference: string
  preserved: string[]
  upgraded: string[]
}

interface ProductPageClientProps {
  product: Product
  logoUrl?: string | null
  showHeader?: boolean
}

export function ProductPageClient({ product, logoUrl, showHeader = true }: ProductPageClientProps) {
  const colorways: Colorway[] = product.specs?.colorways || []

  const [selectedColorwayIndex, setSelectedColorwayIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [zoomImage, setZoomImage] = useState("")

  const selectedColorway = colorways[selectedColorwayIndex]

  const heroImage = selectedColorway?.images?.hero || product.image_url
  const onBodyImage = selectedColorway?.images?.onBody
  const macroDetailImage = selectedColorway?.images?.macroDetail

  // Product specs from new data model
  const sku = product.specs?.sku as string
  const discipline = product.specs?.discipline as string
  const material = product.specs?.material as Material | undefined
  const signatureDetail = product.specs?.signatureDetail as string | undefined
  const description = product.specs?.description as string | undefined
  const restomod = product.specs?.restomod as Restomod | undefined

  const openZoom = (src: string) => {
    setZoomImage(src)
    setIsZoomOpen(true)
  }

  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        {showHeader && (
          <header className="mb-12 md:mb-16">
            <Link href="/" className="block">
              <Image
                src={logoUrl || "/logo.png"}
                alt="First Run"
                width={180}
                height={40}
                className="h-8 w-auto mb-2"
                unoptimized
              />
            </Link>
          </header>
        )}

        {/* Breadcrumb */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground font-mono">
            <Link href="/products/men" className="hover:text-foreground">
              Shop
            </Link>
            {" / "}
            <Link href={`/products/men?sport=${discipline?.toLowerCase()}`} className="hover:text-foreground">
              {discipline}
            </Link>
            {" / "}
            <span>{sku}</span>
          </p>
        </div>

        {/* Main Grid: Images + Buy Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Left: Images (8 cols) */}
          <div className="lg:col-span-8 space-y-2">
            {/* Hero image */}
            <button
              onClick={() => heroImage && openZoom(heroImage)}
              className="w-full bg-[#F4F4F2] aspect-[4/5] flex items-center justify-center cursor-zoom-in group overflow-hidden relative"
            >
              {heroImage ? (
                <Image
                  src={heroImage || "/placeholder.svg"}
                  alt={`${product.name} - ${selectedColorway?.code}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-sm text-muted-foreground">No image</span>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              {onBodyImage && (
                <button
                  onClick={() => openZoom(onBodyImage)}
                  className="aspect-square bg-[#F4F4F2] overflow-hidden cursor-zoom-in relative"
                >
                  <Image src={onBodyImage || "/placeholder.svg"} alt="On body" fill className="object-cover" />
                </button>
              )}
              {macroDetailImage && (
                <button
                  onClick={() => openZoom(macroDetailImage)}
                  className="aspect-square bg-[#F4F4F2] overflow-hidden cursor-zoom-in relative"
                >
                  <Image src={macroDetailImage || "/placeholder.svg"} alt="Detail" fill className="object-cover" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Buy Module (4 cols) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <ProductBuyModule
                product={product}
                selectedColorway={selectedColorway}
                onColorwayChange={(index) => setSelectedColorwayIndex(index)}
                colorways={colorways}
              />
            </div>
          </div>
        </div>

        {/* Evidence Sections */}
        <div className="space-y-16">
          {/* Restomod Section */}
          {restomod && (
            <section className="border-t border-border pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Restomod</p>
                  <h3 className="text-xl font-medium">{restomod.reference}</h3>
                  {description && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{description}</p>}
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">Preserved</p>
                    <ul className="text-sm space-y-2">
                      {restomod.preserved?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">Upgraded</p>
                    <ul className="text-sm space-y-2">
                      {restomod.upgraded?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Material Section */}
          {material && (
            <section className="border-t border-border pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Material</p>
                  <h3 className="text-xl font-medium">{material.name}</h3>
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Composition</p>
                    <p className="text-sm">{material.composition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Handfeel</p>
                    <p className="text-sm">{material.handfeel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Performance</p>
                    <ul className="text-sm space-y-1">
                      {material.performance?.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {signatureDetail && (
            <section className="border-t border-border pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Hidden Details
                  </p>
                  <h3 className="text-xl font-medium">{signatureDetail}</h3>
                </div>
                <div className="lg:col-span-8">
                  {macroDetailImage && (
                    <button
                      onClick={() => openZoom(macroDetailImage)}
                      className="aspect-[16/9] w-full max-w-md bg-[#F4F4F2] overflow-hidden cursor-zoom-in relative"
                    >
                      <Image
                        src={macroDetailImage || "/placeholder.svg"}
                        alt="Hidden detail"
                        fill
                        className="object-cover"
                      />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Colorways Section */}
          {colorways.length > 1 && (
            <section className="border-t border-border pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Colorways</p>
                  <h3 className="text-xl font-medium">{colorways.length} options</h3>
                </div>
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {colorways.map((cw, i) => (
                      <button
                        key={cw.code}
                        onClick={() => setSelectedColorwayIndex(i)}
                        className={`p-4 border ${selectedColorwayIndex === i ? "border-foreground" : "border-border"} text-left`}
                      >
                        <div className="flex gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded-full border border-neutral-300"
                            style={{ backgroundColor: cw.hex }}
                          />
                        </div>
                        <p className="text-sm font-medium">{cw.code.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{cw.accentThread} accent</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {showHeader && (
          <footer className="pt-16 mt-16 border-t border-border">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </footer>
        )}
      </div>

      {/* Mobile fixed buy button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:hidden">
        <button className="w-full bg-foreground text-background py-4 text-sm font-medium">
          ORDER{selectedColorway ? ` — ${selectedColorway.code.replace(/_/g, " ")}` : ""}
        </button>
      </div>

      <ImageZoom
        src={zoomImage || "/placeholder.svg"}
        alt={product.name}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </main>
  )
}
