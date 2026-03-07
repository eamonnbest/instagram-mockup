import { type NextRequest, NextResponse } from "next/server"
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

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 2000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("rate") || error.message.includes("Request"))

      if (isRateLimit && i < maxRetries - 1) {
        console.log(`Rate limited, retrying in ${delayMs}ms... (attempt ${i + 2}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error("Max retries exceeded")
}

export async function POST(request: NextRequest) {
  try {
    ensureFalConfig()
    const { prompt, model, referenceImageUrl, referenceStrength } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Image-to-image mode
    if (referenceImageUrl) {
      if (typeof referenceImageUrl !== "string" || !referenceImageUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Reference image must be a valid HTTPS URL" }, { status: 400 })
      }
      const allowedImg2Img = ["fal-ai/flux/krea/image-to-image"]
      const img2imgModel = allowedImg2Img.includes(model) ? model : allowedImg2Img[0]

      const strength = typeof referenceStrength === "number" ? Math.max(0.05, Math.min(1, referenceStrength)) : 0.3
      const input: Record<string, unknown> = { prompt, image_url: referenceImageUrl }
      // Krea's strength is inverted: high = more deviation. Flip so slider "Exact" = low deviation.
      input.strength = Math.max(0.05, 1 - strength + 0.05)

      const result = await withRetry(async () => {
        return await fal.subscribe(img2imgModel, { input })
      })

      const generatedImageUrl = result.data?.images?.[0]?.url
      if (!generatedImageUrl) {
        throw new Error("No image generated from fal")
      }

      return NextResponse.json({ success: true, imageUrl: generatedImageUrl })
    }

    // Text-to-image mode
    const allowedModels = ["fal-ai/nano-banana-2", "fal-ai/gpt-image-1.5", "fal-ai/flux/krea", "fal-ai/bytedance/seedream/v4.5/text-to-image", "fal-ai/recraft/v3/text-to-image"]
    const selectedModel = allowedModels.includes(model) ? model : allowedModels[0]

    // Nano Banana 2 uses resolution, not image_size
    if (selectedModel === "fal-ai/nano-banana-2") {
      const result = await withRetry(async () => {
        return await fal.subscribe(selectedModel, {
          input: { prompt, resolution: "1K" },
        })
      })
      const generatedImageUrl = result.data?.images?.[0]?.url
      if (!generatedImageUrl) throw new Error("No image generated from fal")
      return NextResponse.json({ success: true, imageUrl: generatedImageUrl })
    }

    // Recraft uses style param
    if (selectedModel === "fal-ai/recraft/v3/text-to-image") {
      const result = await withRetry(async () => {
        return await fal.subscribe(selectedModel, {
          input: {
            prompt,
            image_size: "square_hd",
            style: "realistic_image",
          },
        })
      })
      const generatedImageUrl = result.data?.images?.[0]?.url
      if (!generatedImageUrl) throw new Error("No image generated from fal")
      return NextResponse.json({ success: true, imageUrl: generatedImageUrl })
    }

    // Standard models use image_size
    const sizeMap: Record<string, string> = {
      "fal-ai/gpt-image-1.5": "1024x1024",
      "fal-ai/flux/krea": "square",
      "fal-ai/bytedance/seedream/v4.5/text-to-image": "square",
    }

    const result = await withRetry(async () => {
      return await fal.subscribe(selectedModel, {
        input: {
          prompt,
          image_size: sizeMap[selectedModel] || "square",
        },
      })
    })

    const generatedImageUrl = result.data?.images?.[0]?.url
    if (!generatedImageUrl) {
      throw new Error("No image generated from fal")
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
    })
  } catch (error) {
    console.error("Instagram generate error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}
