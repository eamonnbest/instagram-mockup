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
  const threadId = searchParams.get("thread_id")

  if (!threadId) {
    return NextResponse.json({ error: "Missing thread_id" }, { status: 400 })
  }

  const { data: messages, error } = await getSupabase()
    .from("dm_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to fetch DM messages:", error)
    return NextResponse.json({ error: "Failed to fetch DM messages" }, { status: 500 })
  }

  return NextResponse.json({ messages })
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { thread_id, sender = "me", content, tone } = body

  if (!thread_id || !content) {
    return NextResponse.json({ error: "Missing thread_id or content" }, { status: 400 })
  }

  const { data: message, error } = await getSupabase()
    .from("dm_messages")
    .insert({
      thread_id,
      sender,
      content,
      tone: tone || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create DM message:", error)
    return NextResponse.json({ error: "Failed to create DM message" }, { status: 500 })
  }

  // Update thread's updated_at timestamp
  await getSupabase()
    .from("dm_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", thread_id)

  return NextResponse.json({ message })
}

export async function PATCH(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id, content } = body

  if (!id || !content) {
    return NextResponse.json({ error: "Missing message ID or content" }, { status: 400 })
  }

  const { data: message, error } = await getSupabase()
    .from("dm_messages")
    .update({ content })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update DM message:", error)
    return NextResponse.json({ error: "Failed to update DM message" }, { status: 500 })
  }

  return NextResponse.json({ message })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing message ID" }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from("dm_messages")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Failed to delete DM message:", error)
    return NextResponse.json({ error: "Failed to delete DM message" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
