import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import Anthropic from "@anthropic-ai/sdk"

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

    if ((!prompt || !prompt.trim()) && !referenceImageUrl) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }
    const finalPrompt = prompt?.trim() || "Edit this image"

    // Image-to-image mode
    if (referenceImageUrl) {
      if (typeof referenceImageUrl !== "string" || !referenceImageUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Reference image must be a valid HTTPS URL" }, { status: 400 })
      }
      const allowedImg2Img = ["fal-ai/gpt-image-1.5", "fal-ai/nano-banana-2"]
      const img2imgModel = allowedImg2Img.includes(model) ? model : allowedImg2Img[0]

      // Map preset to model-specific params
      const preset = typeof referenceStrength === "string" ? referenceStrength : "inspired"

      let result
      if (img2imgModel === "fal-ai/gpt-image-1.5" && preset === "same-vibe") {
        // GPT Image "Same vibe": use /edit with low fidelity + divergence instruction
        const sameVibePrefix = "Generate a new, original image inspired by the reference. Change the people, their clothing, specific objects, and small details. Keep the same general setting, mood, lighting, and composition."
        const sameVibePrompt = finalPrompt !== "Edit this image"
          ? `${sameVibePrefix}\n\nAdditional direction: ${finalPrompt}`
          : sameVibePrefix
        result = await withRetry(async () => {
          return await fal.subscribe("fal-ai/gpt-image-1.5/edit", {
            input: {
              prompt: sameVibePrompt,
              image_urls: [referenceImageUrl],
              image_size: "1024x1024",
              input_fidelity: "low",
            },
          })
        })
      } else if (img2imgModel === "fal-ai/gpt-image-1.5") {
        // GPT Image "Close match": /edit with high fidelity
        result = await withRetry(async () => {
          return await fal.subscribe("fal-ai/gpt-image-1.5/edit", {
            input: {
              prompt: finalPrompt,
              image_urls: [referenceImageUrl],
              image_size: "1024x1024",
              input_fidelity: "high",
            },
          })
        })
      } else if (img2imgModel === "fal-ai/nano-banana-2" && preset === "same-vibe") {
        // "Same vibe": describe the image with vision, then generate from text only
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("Missing ANTHROPIC_API_KEY for image description")
        }
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const description = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: referenceImageUrl } },
              { type: "text", text: "Describe this image in detail for an AI image generator. Include: setting/location, lighting, mood/atmosphere, people (poses, clothing, age range — but not identifiable features), objects, colors, composition, camera angle. Be specific but describe the *type* of scene, not the exact image. Write it as a generation prompt." },
            ],
          }],
        })
        const descBlock = description.content.find((b) => b.type === "text")
        const imageDescription = descBlock && descBlock.type === "text" ? descBlock.text : ""
        const combinedPrompt = finalPrompt !== "Edit this image"
          ? `${imageDescription}\n\nAdditional direction: ${finalPrompt}`
          : imageDescription

        result = await withRetry(async () => {
          return await fal.subscribe("fal-ai/nano-banana-2", {
            input: { prompt: combinedPrompt, resolution: "1K" },
          })
        })
      } else {
        // Nano Banana 2 — "Close match": actual img2img via /edit
        result = await withRetry(async () => {
          return await fal.subscribe("fal-ai/nano-banana-2/edit", {
            input: {
              prompt: finalPrompt,
              image_urls: [referenceImageUrl],
              resolution: "1K",
            },
          })
        })
      }

      const generatedImageUrl = result.data?.images?.[0]?.url
      if (!generatedImageUrl) {
        throw new Error("No image generated from fal")
      }

      return NextResponse.json({ success: true, imageUrl: generatedImageUrl })
    }

    // Text-to-image mode
    const allowedModels = ["fal-ai/nano-banana-2", "fal-ai/gpt-image-1.5", "fal-ai/bytedance/seedream/v4.5/text-to-image", "fal-ai/recraft/v3/text-to-image"]
    const selectedModel = allowedModels.includes(model) ? model : allowedModels[0]

    // Nano Banana 2 uses resolution, not image_size
    if (selectedModel === "fal-ai/nano-banana-2") {
      const result = await withRetry(async () => {
        return await fal.subscribe(selectedModel, {
          input: { prompt: finalPrompt, resolution: "1K" },
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
            prompt: finalPrompt,
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
      "fal-ai/bytedance/seedream/v4.5/text-to-image": "square",
    }

    const result = await withRetry(async () => {
      return await fal.subscribe(selectedModel, {
        input: {
          prompt: finalPrompt,
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
