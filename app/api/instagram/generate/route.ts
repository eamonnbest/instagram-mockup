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
    const { prompt, negativePrompt, model } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const allowedModels = ["fal-ai/nano-banana-2", "fal-ai/gpt-image-1.5", "fal-ai/flux-2-pro"]
    const selectedModel = allowedModels.includes(model) ? model : allowedModels[0]

    const fullPrompt = negativePrompt ? `${prompt}\n\nAvoid: ${negativePrompt}` : prompt

    // Each model uses different image_size formats
    const sizeMap: Record<string, string> = {
      "fal-ai/nano-banana-2": "1K",
      "fal-ai/gpt-image-1.5": "1024x1024",
      "fal-ai/flux-2-pro": "square",
    }

    const result = await withRetry(async () => {
      return await fal.subscribe(selectedModel, {
        input: {
          prompt: fullPrompt,
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
