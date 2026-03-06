import { getSiteSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "About — FIRST RUN",
  description: "Classic athletic silhouettes. Obsessive finishing. For people who notice.",
}

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const logoUrl = settings.logo_url || "/logo.png"

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <section className="max-w-[1120px] mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-mono text-muted-foreground mb-6">About</p>
            <h1 className="text-3xl md:text-4xl font-medium leading-tight mb-8 text-balance">
              Proven forms, rebuilt with the attention usually reserved for watches and leather goods.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The tennis training top. The track jacket. The golf polo. These shapes exist because they work. Everything
              underneath changes — materials, construction, finishing. Hidden details you know are there.
            </p>
          </div>
        </section>

        <section className="border-y border-border">
          <div className="max-w-[1120px] mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-6">The work</p>
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>Hidden seam tape. Internal facings. Bartacks in colors you notice when you look.</p>
                  <p>Tartan linings inside collars. Brushed metal hardware. Micro-suede tapes.</p>
                  <p>Every detail considered.</p>
                </div>
              </div>
              <div className="space-y-8">
                {[
                  {
                    label: "Silhouette",
                    text: "Classic forms. The training top, the track jacket, the polo. Shapes proven over decades.",
                  },
                  {
                    label: "Material",
                    text: "Technical fabrics with premium handfeel. Listed by composition and structure.",
                  },
                  {
                    label: "Finishing",
                    text: "The details that never show. You know they're there.",
                  },
                  {
                    label: "Branding",
                    text: "Micro only. 25–30mm marks in accent thread.",
                  },
                ].map((item) => (
                  <div key={item.label} className="border-l-2 border-border pl-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1120px] mx-auto px-6 py-16 md:py-24">
          <p className="text-xs font-mono text-muted-foreground mb-8">Season 01</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                discipline: "Tennis",
                pieces: "Training Top, Short, Track Jacket (Restomod)",
                focus: "The court classics, rebuilt. Breathability, movement, quiet confidence.",
              },
              {
                discipline: "Running",
                pieces: "Half-Tight, 3L Shell",
                focus: "Compression and protection. Engineered for the long run.",
              },
              {
                discipline: "Golf",
                pieces: "Knit Polo",
                focus: "The polo, perfected. Hidden collar facings, considered finishing.",
              },
            ].map((cat) => (
              <div key={cat.discipline} className="p-6 bg-[#F8F8F6]">
                <h3 className="font-medium mb-2">{cat.discipline}</h3>
                <p className="text-sm text-muted-foreground mb-4">{cat.pieces}</p>
                <p className="text-xs text-muted-foreground">{cat.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="max-w-[1120px] mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm opacity-60 mb-4 font-mono">Contact</p>
                <h2 className="text-2xl font-medium mb-4">hello@firstrun.club</h2>
                <p className="text-background/70 leading-relaxed">
                  Questions about materials, fit, or construction details. We respond within 24 hours.
                </p>
              </div>
              <div className="text-right">
                <Link
                  href="/products/men"
                  className="inline-block bg-background text-foreground px-8 py-4 text-sm font-medium hover:bg-background/90 transition-colors"
                >
                  Shop Season 01
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
