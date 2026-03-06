export interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency?: string
  status: "threshold" | "in_production" | "closed" | "killed"
  threshold: number
  confirmed_orders: number
  delivery_weeks: string
  sport: "tennis" | "golf" | "running"
  image_url: string | null
  specs: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  product_id: string
  size: "S" | "M" | "L" | "XL"
  customer_email: string
  status: "pending" | "confirmed" | "refunded" | "shipped"
  stripe_payment_intent: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}
