import { getSiteSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "How It Works — FIRST RUN",
  description: "Core collection and experiments. Two tracks, one standard.",
}

export default async function HowItWorksPage() {
  const settings = await getSiteSettings()
  const logoUrl = settings.logo_url || "/logo.png"

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-mono text-muted-foreground mb-4">Two tracks</p>
            <h1 className="text-2xl font-medium mb-4">The core is earned. Every piece starts as an experiment.</h1>
            <p className="text-muted-foreground leading-relaxed">
              FIRST RUN runs two tracks: proven performers ship now, experiments ship when the community commits.
              Winners graduate. Losers never get made. Zero waste, community-driven curation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border mb-24">
            {/* Core track */}
            <div className="bg-background p-8 md:p-12">
              <div className="inline-block bg-green-100 text-green-800 px-2 py-1 text-xs font-mono mb-6">In stock</div>
              <h2 className="text-xl font-medium mb-4">The core</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Styles that have proven themselves through multiple threshold campaigns. Now in permanent stock, ready
                to ship within 3–5 days.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>Ships within 3–5 business days</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>Standard checkout flow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>30-day return policy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>Earned through threshold success</span>
                </li>
              </ul>
            </div>

            {/* Experiments track */}
            <div className="bg-background p-8 md:p-12">
              <div className="inline-block bg-neutral-100 text-neutral-700 px-2 py-1 text-xs font-mono mb-6">
                Made to order
              </div>
              <h2 className="text-xl font-medium mb-4">Experiments</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                New styles and colorways. Production triggered only when 20 orders are confirmed within a 30-day window.
                You decide what gets made.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>20-unit minimum to trigger production</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>Refundable until threshold is met</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>4–6 week lead time once funded</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                  <span>Winners graduate to the core</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-24">
            <p className="text-xs font-mono text-muted-foreground mb-8">How experiments work</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border">
              {[
                {
                  num: "01",
                  title: "Commit",
                  desc: "Select size and colorway. Payment confirms your reservation in the production run.",
                  detail: "Refundable until threshold",
                },
                {
                  num: "02",
                  title: "Threshold",
                  desc: "Each style requires 20 confirmed orders. Progress is visible on the product page.",
                  detail: "30-day campaign window",
                },
                {
                  num: "03",
                  title: "Production",
                  desc: "Once funded, the batch enters production with our manufacturing partners.",
                  detail: "Small-batch manufacturing",
                },
                {
                  num: "04",
                  title: "Delivery",
                  desc: "Orders ship within 4–6 weeks of threshold being met. Tracking provided at dispatch.",
                  detail: "UK + EU launch markets",
                },
              ].map((step) => (
                <div key={step.num} className="bg-background p-6 md:p-8">
                  <span className="text-xs font-mono text-muted-foreground">{step.num}</span>
                  <h2 className="text-lg font-medium mt-2 mb-3">{step.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-16 mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-4">Graduation</p>
                <h2 className="text-xl font-medium mb-4">How experiments become core</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    When a style hits threshold 2–3 times consecutively, it's proven demand. At that point, we move it
                    to the core collection with permanent stock.
                  </p>
                  <p>
                    This creates natural seasonality without forced "drops". The community decides what becomes
                    permanent. Popular experiments graduate. Niche experiments stay limited.
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F8F6] p-8">
                <h3 className="font-medium mb-4">The logic</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>First threshold = validated interest</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Second threshold = confirmed demand</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Third threshold = core candidate</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Core = reliable + in stock</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-16 mb-24">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-12">What happens if...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                {
                  q: "The threshold isn't reached?",
                  a: "Orders are automatically refunded in full when the 30-day campaign closes. No action required from you.",
                },
                {
                  q: "I want to cancel my experiment order?",
                  a: "Experiment orders can be cancelled and refunded any time before the threshold is reached. Once in production, orders are final.",
                },
                {
                  q: "I want to return a core item?",
                  a: "Core items follow standard returns — 30 days from delivery for unworn items in original condition. We cover return shipping for UK orders.",
                },
                {
                  q: "A style I like is an experiment?",
                  a: "Commit early. The sooner you order, the sooner it reaches threshold. Share with friends who'd want it too.",
                },
                {
                  q: "Why are some items in stock and others not?",
                  a: "Core items have proven demand through multiple successful threshold campaigns. Experiments are still being validated.",
                },
                {
                  q: "I have questions about materials or fit?",
                  a: "Email hello@firstrun.club. We respond within 24 hours with specific information — composition, measurements, or construction details.",
                },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-medium mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide mb-8">Why this model</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Traditional sportswear brands forecast demand, produce inventory, and discount unsold stock. This
                    creates pressure to cut material costs and inflate margins.
                  </p>
                  <p>
                    Our hybrid model gives you both: reliability for proven performers, innovation for new ideas. Core
                    items ship immediately. Experiments let you shape what comes next.
                  </p>
                  <p>
                    The trade-off is transparency. You see exactly how each experiment is performing. You decide with
                    your wallet what deserves to exist.
                  </p>
                </div>
              </div>
              <div className="bg-[#F8F8F6] p-8">
                <h3 className="font-medium mb-4">Benefits</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Premium materials without inventory markup</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Immediate shipping for proven pieces</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Community-driven product development</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                    <span>Zero inventory waste</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-xl font-medium mb-4">Browse Season 01.</h2>
            <Link
              href="/products/men"
              className="inline-block bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Shop the collection
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
