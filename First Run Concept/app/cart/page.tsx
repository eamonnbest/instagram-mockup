import { getSiteSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Cart — BEST",
  description: "Your shopping cart.",
}

export default async function CartPage() {
  const settings = await getSiteSettings()
  const logoUrl = settings.logo_url || "/logo.png"

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <div className="max-w-[720px] mx-auto px-6 py-12 md:py-16">
          <h1 className="text-2xl font-medium mb-8">Cart</h1>

          {/* Empty state */}
          <div className="text-center py-24 border border-dashed border-border">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link
              href="/products/men"
              className="inline-block bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
