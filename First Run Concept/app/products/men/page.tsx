import { getProducts, getSiteSettings } from "@/lib/db"
import { formatPrice } from "@/lib/utils/format"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "All Products — BEST SPORT",
}

export default async function MenProductsPage() {
  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()])
  const logoUrl = settings.logo_url || "/logo.png"

  const coreProducts = products.filter((p) => p.status === "core")
  const experimentProducts = products.filter((p) => p.status === "threshold")

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="flex items-baseline justify-between mb-8 pb-8 border-b border-border">
            <div>
              <h1 className="text-sm font-medium mb-1">All products</h1>
              <p className="text-sm text-muted-foreground">
                {coreProducts.length} in stock · {experimentProducts.length} experiments
              </p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button className="hover:text-foreground">Filter</button>
              <button className="hover:text-foreground">Sort</button>
            </div>
          </div>

          {coreProducts.length > 0 && (
            <div className="mb-16">
              <div className="mb-6">
                <h2 className="text-xs font-mono text-muted-foreground mb-1">The core</h2>
                <p className="text-sm text-muted-foreground">Ready to ship</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                {coreProducts.map((product) => {
                  const colorways = product.specs?.colorways as
                    | Array<{ code: string; hex: string; images?: Record<string, string> }>
                    | undefined
                  const firstColorwayWithImage = colorways?.find((c) => c.images?.hero)
                  const imageUrl = firstColorwayWithImage?.images?.hero || product.image_url

                  return (
                    <Link key={product.id} href={`/products/men/${product.slug}`} className="group">
                      <div className="aspect-[3/4] bg-[#F5F5F3] mb-3 overflow-hidden relative">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-mono">IMG</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1">
                          <span className="text-[10px] font-mono text-green-700">In stock</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h2 className="text-sm leading-tight">{product.name}</h2>
                          <span className="text-sm shrink-0">{formatPrice(product.price, product.currency)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.sport}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {experimentProducts.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xs font-mono text-muted-foreground mb-1">Experiments</h2>
                <p className="text-sm text-muted-foreground">Made-to-order when threshold is met</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-8">
                {experimentProducts.map((product) => {
                  const colorways = product.specs?.colorways as
                    | Array<{ code: string; hex: string; images?: Record<string, string> }>
                    | undefined
                  const firstColorwayWithImage = colorways?.find((c) => c.images?.hero)
                  const imageUrl = firstColorwayWithImage?.images?.hero || product.image_url
                  const progress = Math.round((product.confirmed_orders / product.threshold) * 100)
                  const remaining = product.threshold - product.confirmed_orders

                  return (
                    <Link key={product.id} href={`/products/men/${product.slug}`} className="group">
                      <div className="aspect-[3/4] bg-[#F5F5F3] mb-3 overflow-hidden relative">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-mono">IMG</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1">
                          <span className="text-[10px] font-mono">{remaining} more needed</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h2 className="text-sm leading-tight">{product.name}</h2>
                          <span className="text-sm shrink-0">{formatPrice(product.price, product.currency)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.sport}</p>

                        <div className="pt-2">
                          <div className="h-px bg-border">
                            <div className="h-full bg-foreground" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                            {product.confirmed_orders}/{product.threshold} confirmed
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
