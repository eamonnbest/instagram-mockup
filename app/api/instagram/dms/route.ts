import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null
function getSupabase() {
  if (_supabase) return _supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  return _supabase
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const { data: thread, error } = await getSupabase()
      .from("dm_threads")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Failed to fetch DM thread:", error)
      return NextResponse.json({ error: "Failed to fetch DM thread" }, { status: 500 })
    }

    return NextResponse.json({ thread })
  }

  const { data: threads, error } = await getSupabase()
    .from("dm_threads")
    .select("*, dm_messages(id, sender, content, created_at)")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch DM threads:", error)
    return NextResponse.json({ error: "Failed to fetch DM threads" }, { status: 500 })
  }

  return NextResponse.json({ threads })
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { business_name, business_type, template } = body

  if (!business_name) {
    return NextResponse.json({ error: "Missing business_name" }, { status: 400 })
  }

  const { data: thread, error } = await getSupabase()
    .from("dm_threads")
    .insert({
      business_name,
      business_type: business_type || null,
      template: template || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create DM thread:", error)
    return NextResponse.json({ error: "Failed to create DM thread" }, { status: 500 })
  }

  return NextResponse.json({ thread })
}

export async function PATCH(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id, business_name, business_type, status } = body

  if (!id) {
    return NextResponse.json({ error: "Missing thread ID" }, { status: 400 })
  }

  const VALID_STATUSES = ["drafted", "sent", "replied", "follow_up"]
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (business_name !== undefined) updates.business_name = business_name
  if (business_type !== undefined) updates.business_type = business_type
  if (status !== undefined) updates.status = status

  const { data: thread, error } = await getSupabase()
    .from("dm_threads")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update DM thread:", error)
    return NextResponse.json({ error: "Failed to update DM thread" }, { status: 500 })
  }

  return NextResponse.json({ thread })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing thread ID" }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from("dm_threads")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Failed to delete DM thread:", error)
    return NextResponse.json({ error: "Failed to delete DM thread" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
