import { notFound } from "next/navigation"
import { getProduct, getSiteSettings } from "@/lib/db"
import { getProductSlugs } from "@/lib/db-static"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductPageClient } from "@/components/product-page-client"

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} — FIRST RUN`,
    description: product.specs?.fabric || "Technical apparel. Minimal form.",
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProduct(slug), getSiteSettings()])

  if (!product) {
    notFound()
  }

  const logoUrl = settings.logo_url || "/logo.png"

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <ProductPageClient product={product} logoUrl={logoUrl} showHeader={false} />
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
