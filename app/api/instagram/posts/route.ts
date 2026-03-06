import { NextResponse } from "next/server"
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

export async function GET() {
  const { data: posts, error } = await getSupabase()
    .from("instagram_posts")
    .select("*")
    .order("posted_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }

  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { image_url, caption, likes_count = 0, comments_count = 0, notes, tags, carousel_images, scheduled_for } = body

  const { data: maxOrder } = await getSupabase()
    .from("instagram_posts")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data: post, error } = await getSupabase()
    .from("instagram_posts")
    .insert({
      image_url,
      caption,
      likes_count,
      comments_count,
      display_order: newOrder,
      notes: notes || null,
      tags: tags || [],
      carousel_images: carousel_images || [],
      scheduled_for: scheduled_for || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }

  return NextResponse.json({ post })
}

export async function PATCH(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id, caption, likes_count, comments_count, display_order, notes, tags, carousel_images, scheduled_for } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (caption !== undefined) updates.caption = caption
  if (likes_count !== undefined) updates.likes_count = likes_count
  if (comments_count !== undefined) updates.comments_count = comments_count
  if (display_order !== undefined) updates.display_order = display_order
  if (notes !== undefined) updates.notes = notes
  if (tags !== undefined) updates.tags = tags
  if (carousel_images !== undefined) updates.carousel_images = carousel_images
  if (scheduled_for !== undefined) updates.scheduled_for = scheduled_for

  const { data: post, error } = await getSupabase().from("instagram_posts").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Failed to update post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }

  return NextResponse.json({ post })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing post ID" }, { status: 400 })
  }

  const { error } = await getSupabase().from("instagram_posts").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
