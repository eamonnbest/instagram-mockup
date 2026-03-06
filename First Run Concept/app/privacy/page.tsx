import Link from "next/link"

export const metadata = {
  title: "Privacy — BEST",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        <nav className="mb-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            BEST
          </Link>
        </nav>

        <article className="space-y-8">
          <h1 className="text-xl font-medium tracking-tight">Privacy</h1>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              We collect only what is necessary to process your order: name, email, shipping address, and payment
              information.
            </p>
            <p>Payment processing is handled by Stripe. We do not store your card details.</p>
            <p>We do not sell your data. We do not use tracking pixels. We do not run retargeting ads.</p>
            <p>Your email is used for order updates only. No newsletter unless you opt in.</p>
          </div>
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
