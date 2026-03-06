import Image from "next/image"
import Link from "next/link"

interface StudioNoteProps {
  title?: string
  content: string
  image: string
  link: { href: string; label: string }
}

export function StudioNote({ title = "STUDIO NOTE", content, image, link }: StudioNoteProps) {
  return (
    <section className="max-w-[1120px] mx-auto px-6 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-6">{title}</h2>
          <p className="text-lg leading-relaxed mb-6">{content}</p>
          <Link
            href={link.href}
            className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            {link.label} →
          </Link>
        </div>
        <div className="aspect-[4/3] relative bg-secondary/50 overflow-hidden">
          <Image src={image || "/placeholder.svg"} alt="Studio" fill className="object-cover" />
        </div>
      </div>
    </section>
  )
}
