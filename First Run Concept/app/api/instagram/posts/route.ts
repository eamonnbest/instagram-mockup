import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("posted_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch posts:", error)
    return NextResponse.json({ posts: [] })
  }

  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { image_url, caption, likes_count = 0, comments_count = 0 } = body

  // Get current max display_order
  const { data: maxOrder } = await supabase
    .from("instagram_posts")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data: post, error } = await supabase
    .from("instagram_posts")
    .insert({
      image_url,
      caption,
      likes_count,
      comments_count,
      display_order: newOrder,
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
  const supabase = await createClient()
  const body = await request.json()

  const { id, caption, likes_count, comments_count, display_order } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (caption !== undefined) updates.caption = caption
  if (likes_count !== undefined) updates.likes_count = likes_count
  if (comments_count !== undefined) updates.comments_count = comments_count
  if (display_order !== undefined) updates.display_order = display_order

  const { data: post, error } = await supabase.from("instagram_posts").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Failed to update post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }

  return NextResponse.json({ post })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing post ID" }, { status: 400 })
  }

  const { error } = await supabase.from("instagram_posts").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
