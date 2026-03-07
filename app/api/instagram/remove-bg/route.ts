import { NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

let falConfigured = false
function ensureFalConfig() {
  if (falConfigured) return
  if (!process.env.FAL_KEY) {
    throw new Error("Missing FAL_KEY environment variable")
  }
  fal.config({ credentials: process.env.FAL_KEY })
  falConfigured = true
}

export async function POST(request: Request) {
  try {
    ensureFalConfig()
    const { image_url } = await request.json()

    if (!image_url || typeof image_url !== "string" || !image_url.startsWith("https://")) {
      return NextResponse.json({ error: "image_url must be a valid HTTPS URL" }, { status: 400 })
    }

    const result = await fal.subscribe("fal-ai/birefnet/v2", {
      input: {
        image_url,
        model: "General Use (Light)",
        output_format: "png",
        refine_foreground: true,
      },
    })

    const outputUrl = result.data?.image?.url
    if (!outputUrl) {
      throw new Error("No image returned from background removal")
    }

    return NextResponse.json({ success: true, imageUrl: outputUrl })
  } catch (error) {
    console.error("Background removal error:", error)
    return NextResponse.json(
      { error: "Background removal failed" },
      { status: 500 }
    )
  }
}
