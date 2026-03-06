import { getJournalEntries, getSiteSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Journal — BEST",
  description: "Thoughts on materials, process, and the pursuit of less.",
}

export default async function JournalPage() {
  const [entries, settings] = await Promise.all([getJournalEntries(), getSiteSettings()])
  const logoUrl = settings.logo_url || "/logo.png"

  const [featured, ...rest] = entries

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16">
          {/* Page header */}
          <div className="mb-16">
            <h1 className="text-2xl font-medium mb-2">Journal</h1>
            <p className="text-muted-foreground">Thoughts on materials, process, and the pursuit of less.</p>
          </div>

          {/* Featured entry */}
          {featured && (
            <Link href={`/journal/${featured.slug}`} className="group block mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="aspect-[4/3] bg-secondary/50 overflow-hidden">
                  <Image
                    src={
                      featured.cover_image ||
                      `/placeholder.svg?height=400&width=533&query=${encodeURIComponent(featured.title + " minimal editorial") || "/placeholder.svg"}`
                    }
                    alt={featured.title}
                    width={533}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    {featured.category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-medium mb-4 group-hover:text-muted-foreground transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">{featured.excerpt}</p>
                  <span className="text-sm font-medium underline underline-offset-4">Read More →</span>
                </div>
              </div>
            </Link>
          )}

          {/* Entry grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((entry) => (
                <Link key={entry.id} href={`/journal/${entry.slug}`} className="group">
                  <div className="aspect-[4/3] bg-secondary/50 mb-4 overflow-hidden">
                    <Image
                      src={
                        entry.cover_image ||
                        `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(entry.title + " minimal editorial") || "/placeholder.svg"}`
                      }
                      alt={entry.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                    {entry.category}
                  </span>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-muted-foreground transition-colors">
                    {entry.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.excerpt}</p>
                </Link>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              <p>No journal entries yet.</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
