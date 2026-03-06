import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    console.log("[v0] Received prompt:", prompt)
    console.log("[v0] FAL_KEY exists:", !!process.env.FAL_KEY)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Calling fal.subscribe with fal-ai/flux/schnell...")

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        num_images: 1,
      },
    })

    console.log("[v0] Fal result:", JSON.stringify(result, null, 2))

    const imageUrl = result.data?.images?.[0]?.url

    if (!imageUrl) {
      console.log("[v0] No image URL in result")
      throw new Error("No image generated")
    }

    console.log("[v0] Generated image URL:", imageUrl)
    return NextResponse.json({ image: imageUrl })
  } catch (error) {
    console.error("[v0] Fal image generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}
