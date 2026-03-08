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

export async function GET() {
  const { data: ads, error } = await getSupabase()
    .from("instagram_ads")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch ads:", error)
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 })
  }

  return NextResponse.json({ ads })
}

const VALID_PLACEMENTS = ["feed", "stories", "reels"] as const
const VALID_ASPECT_RATIOS = ["1:1", "4:5", "9:16"] as const
const VALID_CTA_TYPES = ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "BOOK_NOW", "CONTACT_US", "DOWNLOAD", "GET_QUOTE", "WATCH_MORE", "APPLY_NOW", "SUBSCRIBE"] as const
const VALID_STATUSES = ["draft", "ready", "exported"] as const

function validateEnums(fields: Record<string, unknown>): string | null {
  if (fields.placement !== undefined && !VALID_PLACEMENTS.includes(fields.placement as typeof VALID_PLACEMENTS[number])) {
    return `Invalid placement. Must be one of: ${VALID_PLACEMENTS.join(", ")}`
  }
  if (fields.aspect_ratio !== undefined && !VALID_ASPECT_RATIOS.includes(fields.aspect_ratio as typeof VALID_ASPECT_RATIOS[number])) {
    return `Invalid aspect_ratio. Must be one of: ${VALID_ASPECT_RATIOS.join(", ")}`
  }
  if (fields.cta_type !== undefined && !VALID_CTA_TYPES.includes(fields.cta_type as typeof VALID_CTA_TYPES[number])) {
    return `Invalid cta_type. Must be one of: ${VALID_CTA_TYPES.join(", ")}`
  }
  if (fields.status !== undefined && !VALID_STATUSES.includes(fields.status as typeof VALID_STATUSES[number])) {
    return `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
  }
  return null
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const {
    placement = "feed",
    aspect_ratio = "4:5",
    image_url,
    original_image_url,
    primary_text,
    headline,
    description,
    cta_type = "LEARN_MORE",
    destination_url,
    campaign_name,
    status = "draft",
    overlay_blocks = [],
    notes,
    tags = [],
  } = body

  const enumError = validateEnums({ placement, aspect_ratio, cta_type, status })
  if (enumError) {
    return NextResponse.json({ error: enumError }, { status: 400 })
  }

  const { data: ad, error } = await getSupabase()
    .from("instagram_ads")
    .insert({
      placement,
      aspect_ratio,
      image_url,
      original_image_url,
      primary_text,
      headline,
      description,
      cta_type,
      destination_url,
      campaign_name,
      status,
      overlay_blocks,
      notes,
      tags,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create ad:", error)
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 })
  }

  return NextResponse.json({ ad })
}

export async function PATCH(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id, ...fields } = body

  if (!id) {
    return NextResponse.json({ error: "Missing ad ID" }, { status: 400 })
  }

  const allowedFields = [
    "placement", "aspect_ratio", "image_url", "original_image_url",
    "primary_text", "headline", "description", "cta_type",
    "destination_url", "campaign_name", "status", "overlay_blocks",
    "notes", "tags",
  ]

  const enumError = validateEnums(fields)
  if (enumError) {
    return NextResponse.json({ error: enumError }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      updates[field] = fields[field]
    }
  }

  const { data: ad, error } = await getSupabase()
    .from("instagram_ads")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update ad:", error)
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 })
  }

  return NextResponse.json({ ad })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing ad ID" }, { status: 400 })
  }

  const { error } = await getSupabase().from("instagram_ads").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete ad:", error)
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
