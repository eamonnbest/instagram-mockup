import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (_supabase) return _supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  return _supabase
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keysParam = searchParams.get("keys")

  let query = getSupabase().from("site_settings").select("*")

  if (keysParam) {
    const keys = keysParam.split(",")
    query = query.in("key", keys)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  const { error } = await getSupabase()
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
