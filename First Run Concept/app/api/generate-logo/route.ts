import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { createClient } from "@supabase/supabase-js"

fal.config({
  credentials: process.env.FAL_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    const logoPrompt =
      prompt ||
      `Bold condensed typography logo wordmark "FIRST RUN" in heavy compressed black sans-serif font, tight letter spacing, clean modern design, pure white background, centered, no icons no symbols no decoration, professional minimalist brand identity`

    console.log("[v0] Generating logo with prompt:", logoPrompt)

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: logoPrompt,
        image_size: "landscape_16_9",
        num_images: 1,
      },
    })

    const generatedImageUrl = result.data?.images?.[0]?.url
    if (!generatedImageUrl) {
      throw new Error("No image generated from fal")
    }

    console.log("[v0] Generated logo URL:", generatedImageUrl)

    console.log("[v0] Removing background...")
    const bgRemovalResult = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: generatedImageUrl,
      },
    })

    const transparentImageUrl = bgRemovalResult.data?.image?.url
    if (!transparentImageUrl) {
      console.log("[v0] Background removal failed, using original")
    }

    const finalImageUrl = transparentImageUrl || generatedImageUrl

    // Fetch and upload to Supabase Storage
    const imageResponse = await fetch(finalImageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()

    const fileName = `logo-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    })

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrlData.publicUrl,
      tempUrl: generatedImageUrl,
    })
  } catch (error) {
    console.error("[v0] Logo generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate logo" },
      { status: 500 },
    )
  }
}
