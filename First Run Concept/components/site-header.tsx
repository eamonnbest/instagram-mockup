"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingBag, Menu, X, ChevronLeft } from "lucide-react"

export function SiteHeader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isSubPage = pathname !== "/" && pathname !== ""

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.logo_url) {
          setLogoUrl(data.logo_url)
        }
      })
      .catch(() => {})
  }, [])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            {isSubPage && (
              <button
                onClick={() => router.back()}
                className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Link href="/" className="shrink-0">
              {logoUrl ? (
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="FIRST RUN"
                  width={200}
                  height={56}
                  className="h-14 w-auto"
                  unoptimized
                />
              ) : (
                <span className="font-[family-name:var(--font-logo)] text-[32px] tracking-[-0.02em] leading-none">
                  FIRST RUN
                </span>
              )}
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/products/men"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <Link href="/materials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Materials
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/instagram" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Instagram
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
            <Link
              href="/cart"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>
            <button
              className="p-2 md:hidden text-muted-foreground hover:text-foreground transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col px-6 py-4 gap-4">
            <Link
              href="/products/men"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Products
            </Link>
            <Link
              href="/materials"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Materials
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link
              href="/instagram"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Instagram
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
