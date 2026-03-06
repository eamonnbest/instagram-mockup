import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keysParam = searchParams.get("keys")

  let query = supabase.from("site_settings").select("*")

  // Filter by specific keys if provided
  if (keysParam) {
    const keys = keysParam.split(",")
    query = query.in("key", keys)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert array to key-value object
  const settings: Record<string, string> = {}
  data?.forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value
  })

  return NextResponse.json({ settings })
}

export async function POST(request: NextRequest) {
  const { key, value } = await request.json()

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
