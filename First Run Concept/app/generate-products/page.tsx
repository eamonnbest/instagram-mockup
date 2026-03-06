"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import type { Product } from "@/lib/types"

interface Colorway {
  code: string
  hex: string
  accentThread: string
  images: Record<string, string | null>
}

export default function GenerateProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const addLog = (msg: string) => {
    setDebugLog((prev) => [...prev.slice(-50), `${new Date().toISOString().slice(11, 19)} - ${msg}`])
  }

  const refreshProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: true })
    if (data) {
      setProducts(data)
    }
    return data
  }

  useEffect(() => {
    async function fetchProducts() {
      const data = await refreshProducts()
      if (data && data.length > 0) {
        setExpandedProducts({ [data[0].id]: true })
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const generateSlotImage = async (product: Product, slotName: string, colorwayCode: string) => {
    const key = `${product.id}-${slotName}-${colorwayCode}`
    setGenerating((prev) => ({ ...prev, [key]: true }))

    const colorways = product.specs.colorways as Colorway[]
    const colorway = colorways?.find((c) => c.code === colorwayCode)

    if (!colorway) {
      addLog(`Error: Colorway ${colorwayCode} not found`)
      setGenerating((prev) => ({ ...prev, [key]: false }))
      return false
    }

    addLog(`Generating ${product.specs.sku} / ${slotName} / ${colorwayCode}...`)

    try {
      const response = await fetch("/api/generate-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          slotName,
          colorwayCode,
          negativePrompt: product.specs.negativePrompt,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      addLog(`✓ ${slotName} / ${colorwayCode} saved`)
      await refreshProducts()
      return true
    } catch (error) {
      addLog(`✗ Error: ${(error as Error).message}`)
      return false
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const countMissingImages = (product: Product) => {
    const imageSlots = product.specs.imageSlots as string[] | undefined
    const colorways = product.specs.colorways as Colorway[] | undefined
    if (!imageSlots || !colorways) return 0

    let missing = 0
    for (const slot of imageSlots) {
      for (const colorway of colorways) {
        if (!colorway.images?.[slot]) missing++
      }
    }
    return missing
  }

  const countTotalImages = (product: Product) => {
    const imageSlots = product.specs.imageSlots as string[] | undefined
    const colorways = product.specs.colorways as Colorway[] | undefined
    if (!imageSlots || !colorways) return 0
    return imageSlots.length * colorways.length
  }

  const totalMissing = products.reduce((acc, p) => acc + countMissingImages(p), 0)
  const totalImages = products.reduce((acc, p) => acc + countTotalImages(p), 0)
  const totalColorways = products.reduce((acc, p) => acc + ((p.specs.colorways as Colorway[])?.length || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-8 flex items-center justify-center">
        <p className="text-neutral-500">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-neutral-200">
          <div>
            <h1 className="text-xl font-medium tracking-tight">Season 01 — Image Generation</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {totalImages - totalMissing}/{totalImages} images · {products.length} products · {totalColorways}{" "}
              colorways
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/generate-hero" className="text-sm text-neutral-500 hover:text-neutral-900">
              Hero
            </Link>
            <Link href="/generate-logo" className="text-sm text-neutral-500 hover:text-neutral-900">
              Logo
            </Link>
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
              ← Back
            </Link>
          </div>
        </div>

        {/* Debug log */}
        {debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-neutral-100 font-mono text-xs max-h-40 overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i} className="text-neutral-600">
                {log}
              </div>
            ))}
            <button onClick={() => setDebugLog([])} className="mt-2 text-neutral-400 hover:text-neutral-600">
              Clear
            </button>
          </div>
        )}

        {/* Products */}
        <div className="space-y-4">
          {products.map((product) => {
            const imageSlots = product.specs.imageSlots as string[] | undefined
            const colorways = product.specs.colorways as Colorway[] | undefined
            const missing = countMissingImages(product)
            const total = countTotalImages(product)
            const isExpanded = expandedProducts[product.id]
            const sku = product.specs.sku as string
            const discipline = product.specs.discipline as string
            const productType = product.specs.type as string
            const material = product.specs.material as { name: string; composition: string } | undefined

            return (
              <div key={product.id} className="border border-neutral-200 bg-white">
                {/* Product header */}
                <button
                  onClick={() => setExpandedProducts((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs font-mono text-neutral-400 mb-1">{sku}</p>
                      <h2 className="font-medium">{product.name}</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {discipline} · {productType}
                      </p>
                    </div>
                    {colorways && (
                      <div className="flex gap-1">
                        {colorways.map((c) => (
                          <div
                            key={c.code}
                            className="w-5 h-5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: c.hex }}
                            title={`${c.code} + ${c.accentThread}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${missing === 0 ? "text-green-600" : "text-neutral-500"}`}>
                      {total - missing}/{total} images
                    </span>
                    <span className="text-neutral-400 text-lg">{isExpanded ? "−" : "+"}</span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && imageSlots && colorways && (
                  <div className="border-t border-neutral-200">
                    {/* Product info bar */}
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                      <p className="text-sm text-neutral-600">
                        {missing === 0 ? "All images generated" : `${missing} images remaining`}
                      </p>
                      <p className="text-xs text-neutral-400 font-mono">{material?.composition}</p>
                    </div>

                    {/* Image slots grid - 3 columns for 3 slots */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {imageSlots.map((slotName) => (
                        <div key={slotName} className="border border-neutral-200 p-3">
                          {/* Slot header */}
                          <div className="mb-3">
                            <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">{slotName}</p>
                          </div>

                          {/* Colorway images - vertical stack */}
                          <div className="space-y-2">
                            {colorways.map((colorway) => {
                              const genKey = `${product.id}-${slotName}-${colorway.code}`
                              const imageUrl = colorway.images?.[slotName]
                              const isGen = generating[genKey]

                              return (
                                <div key={colorway.code} className="border border-neutral-100">
                                  <div className="flex items-center gap-2 p-2 border-b border-neutral-100 bg-neutral-50">
                                    <div
                                      className="w-3 h-3 rounded-full border border-neutral-300"
                                      style={{ backgroundColor: colorway.hex }}
                                    />
                                    <span className="text-xs font-medium">{colorway.code}</span>
                                    <span className="text-[10px] text-blue-500 ml-auto">{colorway.accentThread}</span>
                                  </div>

                                  {/* Image preview */}
                                  <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={`${product.name} - ${slotName} - ${colorway.code}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs text-neutral-400">{isGen ? "..." : "—"}</span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => generateSlotImage(product, slotName, colorway.code)}
                                    disabled={isGen}
                                    className="w-full text-[10px] bg-neutral-900 text-white py-1.5 disabled:opacity-30"
                                  >
                                    {isGen ? "..." : imageUrl ? "Redo" : "Gen"}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
