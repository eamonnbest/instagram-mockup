import { getSiteSettings, getProducts } from "@/lib/db"
import { formatPrice } from "@/lib/utils/format"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"

interface Colorway {
  code: string
  hex: string
  accentThread: string
  images: Record<string, string | null>
}

export default async function HomePage() {
  const [settings, products] = await Promise.all([getSiteSettings(), getProducts()])
  const logoUrl = settings.logo_url || "/logo.png"
  const heroImage = settings.hero_image_url || null

  const coreProducts = products.filter((p) => p.status === "core")
  const experimentProducts = products.filter((p) => p.status === "threshold")

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main>
        {/* Hero section */}
        <section className="relative min-h-[70vh] flex items-end border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-[#F4F4F2]">
            {heroImage ? (
              <Image
                src={heroImage || "/placeholder.svg"}
                alt="FIRST RUN Season 01"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Link
                href="/generate-hero"
                className="absolute inset-0 flex items-center justify-center hover:bg-[#EFEFED] transition-colors"
              >
                <div className="text-center text-muted-foreground">
                  <p className="text-sm font-mono mb-2">No hero image</p>
                  <p className="text-xs opacity-60">Click to generate →</p>
                </div>
              </Link>
            )}
          </div>
          {heroImage && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
          <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-16 w-full">
            <div className={heroImage ? "text-white" : "text-foreground"}>
              <p className="text-sm opacity-60 mb-4 font-mono">Season 01</p>
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.1] tracking-tight mb-6 max-w-2xl">
                Every detail considered.
              </h1>
              <p
                className={`text-lg max-w-xl leading-relaxed mb-8 ${heroImage ? "opacity-80" : "text-muted-foreground"}`}
              >
                Classic athletic silhouettes. Obsessive finishing.
              </p>
              {/* end brand philosophy copy */}
              <div className="flex gap-6">
                <Link
                  href="/products/men"
                  className={`text-sm font-medium underline underline-offset-8 decoration-2 ${heroImage ? "decoration-white/50 hover:decoration-white" : "hover:decoration-muted-foreground"} transition-colors`}
                >
                  Shop Season 01
                </Link>
                <Link
                  href="/how-it-works"
                  className={`text-sm ${heroImage ? "opacity-70 hover:opacity-100" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                >
                  How it works →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {coreProducts.length > 0 && (
          <section className="border-b border-border">
            <div className="max-w-[1400px] mx-auto px-6 py-16">
              <div className="flex items-baseline justify-between mb-12">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-mono">The core</p>
                  <h2 className="text-2xl font-medium">Proven. Ships now.</h2>
                  <p className="text-sm text-muted-foreground mt-2">Pieces that earned their place. Permanent stock.</p>
                </div>
                <Link href="/products/men?filter=core" className="text-sm text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                {coreProducts.map((product) => {
                  const colorways = product.specs?.colorways as Colorway[] | undefined
                  const firstColorway = colorways?.[0]
                  const imageUrl = firstColorway?.images?.hero || product.image_url
                  const sku = product.specs?.sku as string
                  const material = product.specs?.material as { name: string } | undefined

                  return (
                    <Link key={product.id} href={`/products/men/${product.slug}`} className="group bg-[#F8F8F6] p-4">
                      <div className="aspect-square mb-4 overflow-hidden relative bg-[#EFEFED]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No image
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1">
                          <span className="text-[10px] font-mono text-green-700">In stock</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-muted-foreground font-mono">{sku}</p>
                          {colorways && (
                            <div className="flex gap-1">
                              {colorways.slice(0, 4).map((c) => (
                                <div
                                  key={c.code}
                                  className="w-3 h-3 rounded-full border border-neutral-300"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.code}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
                        {material && <p className="text-xs text-muted-foreground">{material.name}</p>}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ready to ship</span>
                          <span>{formatPrice(product.price, product.currency)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {experimentProducts.length > 0 && (
          <section className="border-b border-border">
            <div className="max-w-[1400px] mx-auto px-6 py-16">
              <div className="flex items-baseline justify-between mb-12">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-mono">Experiments</p>
                  <h2 className="text-2xl font-medium">In development. You decide.</h2>
                  <p className="text-sm text-muted-foreground mt-2">Made when 20 commit. Winners join the core.</p>
                </div>
                <Link
                  href="/products/men?filter=experiments"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {experimentProducts.map((product) => {
                  const colorways = product.specs?.colorways as Colorway[] | undefined
                  const firstColorway = colorways?.[0]
                  const imageUrl = firstColorway?.images?.hero || product.image_url
                  const progress = Math.round((product.confirmed_orders / product.threshold) * 100)
                  const sku = product.specs?.sku as string
                  const material = product.specs?.material as { name: string } | undefined
                  const remaining = product.threshold - product.confirmed_orders

                  return (
                    <Link key={product.id} href={`/products/men/${product.slug}`} className="group bg-[#F8F8F6] p-4">
                      <div className="aspect-square mb-4 overflow-hidden relative bg-[#EFEFED]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No image
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1">
                          <span className="text-[10px] font-mono">{remaining} more needed</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-muted-foreground font-mono">
                            {sku} · {progress}% funded
                          </p>
                          {colorways && (
                            <div className="flex gap-1">
                              {colorways.slice(0, 4).map((c) => (
                                <div
                                  key={c.code}
                                  className="w-3 h-3 rounded-full border border-neutral-300"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.code}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
                        {material && <p className="text-xs text-muted-foreground">{material.name}</p>}
                        <div className="h-px bg-border relative">
                          <div
                            className="absolute left-0 top-0 h-full bg-foreground"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {product.confirmed_orders} of {product.threshold}
                          </span>
                          <span>{formatPrice(product.price, product.currency)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Philosophy section */}
        <section className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 py-24">
            <p className="text-sm text-muted-foreground mb-6 font-mono">The approach</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-medium leading-tight mb-8">
                  Proven forms.
                  <br />
                  Obsessive finishing.
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The tennis training top. The track jacket. The golf polo. These shapes exist because they work. We
                  rebuild everything underneath — materials, construction, finishing — with the attention usually
                  reserved for watches and leather goods.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Hidden tartan facings. Considered bartacks. Seam tape you'll never see. Details you know are there.
                </p>
                <Link href="/about" className="text-sm font-medium underline underline-offset-8 decoration-2">
                  Read more
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 content-start">
                {[
                  { num: "20", label: "unit minimum" },
                  { num: "6", label: "products" },
                  { num: "4–6", label: "week lead time" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#F8F8F6] p-6 aspect-square flex flex-col justify-end">
                    <p className="text-3xl md:text-4xl font-medium mb-2">{stat.num}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="max-w-[1400px] mx-auto px-6 py-24">
            <div className="max-w-2xl">
              <p className="text-sm opacity-60 mb-6 font-mono">Updates</p>
              <h2 className="text-3xl font-medium mb-4">For the few who notice.</h2>
              <p className="text-background/70 mb-8">
                New pieces, threshold updates, and the occasional detail worth sharing.
              </p>
              <form className="flex gap-2 max-w-md">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 bg-transparent border border-background/30 px-4 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:border-background"
                />
                <button type="submit" className="bg-background text-foreground px-6 py-3 text-sm font-medium">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
