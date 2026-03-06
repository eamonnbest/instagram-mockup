import Link from "next/link"
import Image from "next/image"
import { type Product, getStatusText, formatPrice } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const statusLines = getStatusText(product).split("\n")

  return (
    <Link href={`/product/${product.slug}`} className="block group">
      <article className="space-y-6">
        <div className="aspect-[4/5] relative bg-secondary/30">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 800px) 100vw, 800px"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-medium tracking-tight">{product.name}</h2>

          <p className="text-base">{formatPrice(product.price, product.currency)}</p>

          <div className="text-sm text-muted-foreground">
            {statusLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}
