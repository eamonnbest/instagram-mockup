import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: products, error } = await supabase.from("products").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ products: [] })
  }

  return NextResponse.json({ products })
}
