import { getSiteSettings, getProducts } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Materials — FIRST RUN",
  description: "Technical fabrics selected for performance, feel, and longevity.",
}

export default async function MaterialsPage() {
  const [settings, products] = await Promise.all([getSiteSettings(), getProducts()])
  const logoUrl = settings.logo_url || "/logo.png"

  const materialsFromProducts = products.map((product) => {
    const material = product.specs?.material as
      | {
          name: string
          composition: string
          handfeel: string
          performance: string[]
        }
      | undefined

    const colorways = product.specs?.colorways as Array<{ code: string; accentThread: string }> | undefined
    const accents = colorways?.map((c) => c.accentThread).filter((v, i, a) => a.indexOf(v) === i) || []

    return {
      name: material?.name || "Technical Fabric",
      composition: material?.composition || "",
      handfeel: material?.handfeel || "",
      performance: material?.performance || [],
      accents,
      product: {
        name: product.name,
        slug: product.slug,
        sku: product.specs?.sku as string,
        type: product.specs?.type as string,
      },
    }
  })

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16">
          <div className="mb-16">
            <p className="text-xs font-mono text-muted-foreground mb-4">Materials</p>
            <h1 className="text-2xl font-medium mb-4">Listed by composition and structure.</h1>
            <p className="text-muted-foreground max-w-xl">
              Technical fabrics selected for performance, feel, and longevity. The obsession is in the detail —
              handfeel, stretch recovery, how it ages. Things you notice over time.
            </p>
          </div>

          <div className="space-y-16">
            {materialsFromProducts.map((material, index) => (
              <div
                key={index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-border last:border-0"
              >
                <div className="lg:col-span-4">
                  <p className="text-xs font-mono text-muted-foreground mb-2">{material.product.sku}</p>
                  <h2 className="text-lg font-medium mb-1">{material.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{material.product.type}</p>
                  <Link
                    href={`/products/men/${material.product.slug}`}
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    {material.product.name} →
                  </Link>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Composition</p>
                    <p className="text-sm">{material.composition || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Handfeel</p>
                    <p className="text-sm">{material.handfeel || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Performance</p>
                    {material.performance.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {material.performance.slice(0, 4).map((prop, i) => (
                          <li key={i} className="text-muted-foreground">
                            {prop}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm">—</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 pt-16 border-t border-border">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <h2 className="text-lg font-medium mb-2">Hidden details</h2>
                <p className="text-muted-foreground text-sm">
                  Each colorway features accent details — bartacks, binding, hardware — in a single considered color.
                  Quiet. Intentional. Details you know are there.
                </p>
              </div>
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "PLUM", hex: "#4A1942", desc: "Deep purple" },
                    { name: "SAFFRON", hex: "#D4A422", desc: "Golden yellow" },
                    { name: "FOREST", hex: "#1A3A2F", desc: "Deep green" },
                    { name: "SLATE", hex: "#6B7280", desc: "Cool grey" },
                  ].map((color) => (
                    <div key={color.name} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <p className="text-sm font-medium">{color.name}</p>
                        <p className="text-xs text-muted-foreground">{color.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-border">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-8">Season 01 Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: "CHALK", hex: "#F3F1EA", desc: "Off-white, warm" },
                { name: "INK", hex: "#0B0F14", desc: "Near-black navy" },
                { name: "STONE", hex: "#BEB7AA", desc: "Warm beige-grey" },
                { name: "OLIVE", hex: "#4A4A38", desc: "Dark olive" },
                { name: "NAVY", hex: "#0B1A2E", desc: "Deep navy" },
                { name: "FOREST", hex: "#1A3A2F", desc: "Deep green" },
                { name: "GRAPHITE", hex: "#2A2D32", desc: "Charcoal" },
                { name: "BLACK", hex: "#0A0A0A", desc: "True black" },
              ].map((color) => (
                <div key={color.name}>
                  <div className="aspect-square mb-3 border border-border" style={{ backgroundColor: color.hex }} />
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
