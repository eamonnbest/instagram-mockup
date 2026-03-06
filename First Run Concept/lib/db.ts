import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Product, JournalEntry } from "@/lib/types"

// All functions in this module are Server Actions
// This module cannot be imported by client components

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching products:", error)
    return []
  }

  return data || []
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single()

  if (error) {
    console.error("[v0] Error fetching product:", error)
    return null
  }

  return data
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching journal entries:", error)
    return []
  }

  return data || []
}

export async function getJournalEntry(slug: string): Promise<JournalEntry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (error) {
    console.error("[v0] Error fetching journal entry:", error)
    return null
  }

  return data
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("site_settings").select("*")

  if (error) {
    console.error("[v0] Error fetching site settings:", error)
    return {}
  }

  const settings: Record<string, string> = {}
  data?.forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value
  })

  return settings
}
