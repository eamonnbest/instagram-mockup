// Database functions for build-time operations (generateStaticParams)
// These don't use cookies and are safe to call during static generation

import { createClient } from "@supabase/supabase-js"

// Create a simple Supabase client without cookie handling for build-time use
function getStaticClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function getProductSlugs(): Promise<string[]> {
  const supabase = getStaticClient()
  const { data, error } = await supabase.from("products").select("slug")

  if (error) {
    console.error("[v0] Error fetching product slugs:", error)
    return []
  }

  return data?.map((p) => p.slug) || []
}

export async function getJournalSlugs(): Promise<string[]> {
  const supabase = getStaticClient()
  const { data, error } = await supabase.from("journal_entries").select("slug").eq("published", true)

  if (error) {
    console.error("[v0] Error fetching journal slugs:", error)
    return []
  }

  return data?.map((e) => e.slug) || []
}
