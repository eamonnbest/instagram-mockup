import Link from "next/link"

export const metadata = {
  title: "Terms — FIRST RUN",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        <nav className="mb-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FIRST RUN
          </Link>
        </nav>

        <article className="space-y-12">
          <h1 className="text-xl font-medium tracking-tight">Terms</h1>

          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide">General</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>All prices are in GBP. Shipping is calculated at checkout.</p>
              <p>Delivery estimates are provided in good faith. Manufacturing delays may occur.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide">Core items (in stock)</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Core items are in stock and ship within 3–5 business days.</p>
              <p>Returns are accepted within 30 days of delivery for unworn items in original condition.</p>
              <p>We cover return shipping for UK orders. International returns are at customer expense.</p>
              <p>Defective items are replaced or refunded. Contact us within 14 days of delivery.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide">Experiments (made to order)</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Experiment items require a 20-unit threshold to trigger production.</p>
              <p>Orders are refundable in full until the threshold is reached.</p>
              <p>If thresholds are not reached within 30 days, orders are automatically refunded.</p>
              <p>Once production begins, orders cannot be cancelled or modified.</p>
              <p>Delivery is typically 4–6 weeks from threshold being met.</p>
              <p>
                Returns for experiment items are accepted for defective items only. Contact us within 14 days of
                delivery.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide">Policies</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>We reserve the right to cancel orders suspected of fraud or resale.</p>
              <p>Product images are representative. Minor variations may occur between batches.</p>
              <p>These terms are governed by the laws of England and Wales.</p>
            </div>
          </section>
        </article>

        <footer className="mt-24 pt-12 border-t border-border">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
