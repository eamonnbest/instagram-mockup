import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { createClient } from "@supabase/supabase-js"

fal.config({
  credentials: process.env.FAL_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prompt, fileName, category, updateJournalId } = await request.json()

    if (!prompt || !fileName) {
      return NextResponse.json({ error: "Prompt and fileName are required" }, { status: 400 })
    }

    console.log("[v0] Generating editorial image:", fileName)
    console.log("[v0] Prompt:", prompt.slice(0, 100) + "...")

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_images: 1,
      },
    })

    const generatedImageUrl = result.data?.images?.[0]?.url
    if (!generatedImageUrl) {
      console.error("[v0] No image in result:", result)
      throw new Error("No image generated from fal")
    }

    console.log("[v0] Generated image URL:", generatedImageUrl)

    // Fetch the generated image
    const imageResponse = await fetch(generatedImageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()

    // Upload to editorial-images bucket
    const { error: uploadError } = await supabase.storage.from("editorial-images").upload(fileName, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("editorial-images").getPublicUrl(fileName)
    const publicUrl = publicUrlData.publicUrl
    console.log("[v0] Public URL:", publicUrl)

    // If this is for a journal entry, update its cover_image
    if (updateJournalId) {
      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({ cover_image: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", updateJournalId)

      if (updateError) {
        console.error("[v0] Update error:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName,
      category,
    })
  } catch (error) {
    console.error("[v0] Editorial image generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}
