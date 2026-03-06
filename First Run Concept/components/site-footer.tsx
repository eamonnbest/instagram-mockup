import Link from "next/link"

interface SiteFooterProps {
  logoUrl?: string
}

export function SiteFooter({ logoUrl = "/logo.png" }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Logo column */}
          <div>
            <span className="font-[family-name:var(--font-logo)] text-[24px] tracking-[-0.02em] leading-none block mb-4">
              FIRST RUN
            </span>
            <p className="text-sm text-muted-foreground">The details are the point.</p>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs text-muted-foreground mb-4 font-mono">Products</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products/men" className="text-muted-foreground hover:text-foreground">
                  All
                </Link>
              </li>
              <li>
                <Link href="/products/men?sport=tennis" className="text-muted-foreground hover:text-foreground">
                  Tennis
                </Link>
              </li>
              <li>
                <Link href="/products/men?sport=running" className="text-muted-foreground hover:text-foreground">
                  Running
                </Link>
              </li>
              <li>
                <Link href="/products/men?sport=golf" className="text-muted-foreground hover:text-foreground">
                  Golf
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <p className="text-xs text-muted-foreground mb-4 font-mono">Information</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/materials" className="text-muted-foreground hover:text-foreground">
                  Materials
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/journal" className="text-muted-foreground hover:text-foreground">
                  Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs text-muted-foreground mb-4 font-mono">Support</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground">
                  Help
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-foreground">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-foreground">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs text-muted-foreground mb-4 font-mono">Legal</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs text-muted-foreground mb-4 font-mono">Social</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/instagram" className="text-muted-foreground hover:text-foreground">
                  Instagram
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">© 2026 FIRST RUN</p>
          <p className="text-xs text-muted-foreground font-mono">For the few who notice</p>
        </div>
      </div>
    </footer>
  )
}
