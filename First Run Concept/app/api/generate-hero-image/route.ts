import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { customPrompt, negativePrompt: customNegative } = await request.json()

    const defaultPrompt = `High-end editorial sportswear photograph, wide cinematic banner. Location: Tokyo early morning, quiet crosswalk beside minimalist concrete-and-glass building, soft foggy light. Single athlete walking with intent (post-training), face cropped at nose level. Outfit: TENNIS / MATCH TEE 02 in INK under RUN SHELL 02 in STONE (unzipped slightly), TENNIS / SHORT 03 in GRAPHITE. Tiny COBALT micro embroidery on sleeve cuff visible, plus one COBALT bartack detail. Palette is muted and controlled: ink, graphite, stone, chalk, one cobalt accent. Composition: heavy negative space, precise alignment with building lines, minimal signage. Lux technical feel, Veilance-level restraint, premium texture clarity, medium format look.`

    const defaultNegative = `No obvious Japanese clichés, no neon signage, no anime, no flashy streetwear, no big logos, no text overlays, no props, no umbrellas, no crowded street, no harsh flash.`

    const prompt = customPrompt || defaultPrompt
    const negative = customNegative || defaultNegative

    const fullPrompt = `${prompt}\n\nAvoid: ${negative}`

    console.log(`[v0] Generating hero image with Nano Banana Pro 2K...`)

    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: fullPrompt,
        resolution: "2K",
        aspect_ratio: "16:9",
      },
    })

    const generatedImageUrl = result.data?.images?.[0]?.url
    if (!generatedImageUrl) {
      throw new Error("No image generated from fal")
    }

    console.log(`[v0] Generated hero: ${generatedImageUrl}`)

    // Fal CDN URLs are persistent and rate limits the fetch requests
    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
    })
  } catch (error) {
    console.error("[v0] Hero generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}
