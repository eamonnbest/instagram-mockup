export type ProductStatus = "threshold" | "in-production" | "closed" | "killed"

export type Sport = "tennis" | "golf" | "running"

export interface Product {
  id: string
  slug: string
  name: string
  sport: Sport
  price: number
  currency: string
  status: ProductStatus
  threshold: number
  currentOrders: number
  estimatedDeliveryWeeks: string
  sizes: string[]
  image: string
  specs: {
    fabric: string[]
    cut: string[]
    construction: string[]
    use: string[]
    care: string[]
  }
}

export const products: Product[] = [
  {
    id: "tennis-training-top-01",
    slug: "tennis-training-top-01",
    name: "TENNIS / TRAINING TOP 01",
    sport: "tennis",
    price: 145,
    currency: "GBP",
    status: "threshold",
    threshold: 20,
    currentOrders: 7,
    estimatedDeliveryWeeks: "4–6",
    sizes: ["S", "M", "L", "XL"],
    image: "/products/tennis-training-top-01.jpg",
    specs: {
      fabric: ["High-performance knit", "Hydrophobic yarn construction", "Fast dry under saturation"],
      cut: ["Athletic fit", "Close without compression"],
      construction: ["Minimal seam layout", "Seams placed for movement only"],
      use: ["Tennis training and match play", "High-output sessions"],
      care: ["Machine wash cold", "Do not tumble dry"],
    },
  },
  {
    id: "golf-polo-01",
    slug: "golf-polo-01",
    name: "GOLF / POLO 01",
    sport: "golf",
    price: 165,
    currency: "GBP",
    status: "threshold",
    threshold: 15,
    currentOrders: 11,
    estimatedDeliveryWeeks: "4–6",
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "/products/golf-polo-01.jpg",
    specs: {
      fabric: ["Mercerised cotton piqué", "Natural stretch", "Refined hand feel"],
      cut: ["Slim fit", "Elongated placket", "No chest branding"],
      construction: ["Single-needle stitching", "Reinforced collar", "Side vents"],
      use: ["18 holes", "Clubhouse", "Travel"],
      care: ["Machine wash cold", "Hang dry", "Iron low if needed"],
    },
  },
  {
    id: "running-singlet-01",
    slug: "running-singlet-01",
    name: "RUNNING / SINGLET 01",
    sport: "running",
    price: 95,
    currency: "GBP",
    status: "threshold",
    threshold: 25,
    currentOrders: 19,
    estimatedDeliveryWeeks: "4–6",
    sizes: ["XS", "S", "M", "L", "XL"],
    image: "/products/running-singlet-01.jpg",
    specs: {
      fabric: ["Ultralight mesh", "72gsm", "Laser-cut ventilation zones"],
      cut: ["Race fit", "Dropped armhole", "Extended back hem"],
      construction: ["Bonded seams", "No chafe points", "Reflective heat transfer"],
      use: ["Racing", "Tempo sessions", "Hot conditions"],
      care: ["Machine wash cold", "Hang dry"],
    },
  },
  {
    id: "golf-trouser-01",
    slug: "golf-trouser-01",
    name: "GOLF / TROUSER 01",
    sport: "golf",
    price: 195,
    currency: "GBP",
    status: "threshold",
    threshold: 15,
    currentOrders: 6,
    estimatedDeliveryWeeks: "5–7",
    sizes: ["28", "30", "32", "34", "36", "38"],
    image: "/products/golf-trouser-01.jpg",
    specs: {
      fabric: ["Technical stretch twill", "Water-resistant finish", "Wrinkle recovery"],
      cut: ["Slim-tapered leg", "Mid-rise", "No break"],
      construction: ["Hidden elastic waist", "Grip tape interior", "Welt pockets"],
      use: ["Course play", "Travel", "Business casual"],
      care: ["Machine wash cold", "Tumble dry low"],
    },
  },
  {
    id: "running-half-tight-01",
    slug: "running-half-tight-01",
    name: "RUNNING / HALF TIGHT 01",
    sport: "running",
    price: 115,
    currency: "GBP",
    status: "threshold",
    threshold: 20,
    currentOrders: 14,
    estimatedDeliveryWeeks: "4–6",
    sizes: ["XS", "S", "M", "L", "XL"],
    image: "/products/running-half-tight-01.jpg",
    specs: {
      fabric: ["Compression knit", "Four-way stretch", "Moisture-wicking finish"],
      cut: ["7-inch inseam", "High waist", "No drawcord"],
      construction: ["Flatlock seams", "Internal key pocket", "Silicone leg grip"],
      use: ["Distance running", "Track sessions", "Race day"],
      care: ["Machine wash cold", "Do not tumble dry"],
    },
  },
]

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getStatusText(product: Product): string {
  switch (product.status) {
    case "threshold":
      return `Made to order.\nProduction begins at ${product.threshold} confirmed orders.`
    case "in-production":
      return `In production.\nEstimated delivery: ${product.estimatedDeliveryWeeks} weeks.`
    case "closed":
      return "Production closed."
    case "killed":
      return "This item will not be produced."
  }
}

export function getCTAText(status: ProductStatus): string {
  switch (status) {
    case "threshold":
      return "Order"
    case "in-production":
      return "Order"
    case "closed":
      return "Closed"
    case "killed":
      return "Unavailable"
  }
}

export function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
  }
  return `${symbols[currency] || ""}${price}`
}
