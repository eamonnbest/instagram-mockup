import type React from "react"
import { notFound } from "next/navigation"
import { getJournalEntry, getSiteSettings } from "@/lib/db"
import { getJournalSlugs } from "@/lib/db-static"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import Image from "next/image"

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getJournalSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await getJournalEntry(slug)

  if (!entry) {
    return { title: "Entry Not Found" }
  }

  return {
    title: `${entry.title} — FIRST RUN Journal`,
    description: entry.excerpt || "FIRST RUN Journal",
  }
}

// Simple markdown-like content renderer
function renderContent(content: string) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-3xl md:text-4xl font-medium mb-8 mt-12 first:mt-0">
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-xl md:text-2xl font-medium mb-4 mt-10">
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={index} className="text-muted-foreground ml-4 mb-2">
          {line.slice(2)}
        </li>,
      )
    } else if (line.trim() === "") {
      elements.push(<div key={index} className="h-4" />)
    } else {
      elements.push(
        <p key={index} className="text-muted-foreground leading-relaxed mb-4">
          {line}
        </p>,
      )
    }
  })

  return elements
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [entry, settings] = await Promise.all([getJournalEntry(slug), getSiteSettings()])

  if (!entry) {
    notFound()
  }

  const logoUrl = settings.logo_url || "/logo.png"

  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main className="min-h-screen">
        {/* Hero image */}
        {entry.cover_image && (
          <div className="w-full aspect-[21/9] relative bg-secondary/50">
            <Image
              src={entry.cover_image || "/placeholder.svg"}
              alt={entry.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <article className="max-w-[720px] mx-auto px-6 py-12 md:py-16">
          {/* Meta */}
          <div className="mb-8">
            <Link
              href="/journal"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 block"
            >
              ← Back to Journal
            </Link>
            <span className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">{entry.category}</span>
            <h1 className="text-3xl md:text-4xl font-medium mb-4">{entry.title}</h1>
            {entry.published_at && (
              <time className="text-sm text-muted-foreground">
                {new Date(entry.published_at).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>

          {/* Content */}
          <div className="prose-custom">{entry.content && renderContent(entry.content)}</div>
        </article>
      </main>
      <SiteFooter logoUrl={logoUrl} />
    </>
  )
}
