import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { createClient } from "@supabase/supabase-js"

fal.config({
  credentials: process.env.FAL_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const colorDescriptions: Record<string, string> = {
  INK: "near-black navy (#0B0F14)",
  CHALK: "warm off-white (#F3F1EA)",
  STONE: "warm grey-beige (#BEB7AA)",
  GRAPHITE: "dark charcoal (#2B2F36)",
  COBALT: "bright cobalt blue (#0047AB)",
  FOREST: "deep forest green (#1A3A2F)",
  BONE: "warm cream (#E8E4DC)",
  BLACK: "true black (#0A0A0A)",
  OXBLOOD: "deep burgundy (#4A1C23)",
  MARIGOLD: "warm golden yellow (#E8A317)",
  ACID: "muted yellow-green (#C5C77E)",
  PLUM: "deep aubergine purple (#4A2040)",
  ELECTRIC: "vivid electric blue (#0066FF)",
  TOXIC: "bright toxic yellow-green (#CCFF00)",
}

function buildColorContext(colorway: any): string {
  const baseColorName = colorway.code.split("_")[0]
  const baseDesc = colorDescriptions[baseColorName] || `${baseColorName} (${colorway.hex})`

  let context = `COLOR REFERENCE: Base color ${baseColorName} is ${baseDesc}.`

  if (colorway.accents && Object.keys(colorway.accents).length > 0) {
    const accentParts = Object.entries(colorway.accents).map(([name, hex]) => {
      const desc = colorDescriptions[name] || `${name}`
      return `${name} is ${desc}`
    })
    context += ` Accents: ${accentParts.join("; ")}.`
  } else if (colorway.accentThread) {
    const accentDesc = colorDescriptions[colorway.accentThread] || colorway.accentThread
    context += ` Accent ${colorway.accentThread} is ${accentDesc}.`
  }

  return context
}

function buildPrompt(product: any, colorway: any, slotName: string): string {
  const type = product.specs.type as string
  const material = product.specs.material as { name: string; composition: string; handfeel: string }
  const signature = product.specs.signature as string[]
  const discipline = product.specs.discipline as string

  const colorCode = colorway.code
  const colorHex = colorway.hex
  const accent = colorway.accentThread

  const accents = colorway.accents as Record<string, string> | undefined

  const baseColorName = colorCode.split("_")[0]
  const colorDesc = colorDescriptions[baseColorName] || colorDescriptions[colorCode] || `${colorCode} (${colorHex})`

  let accentContext = ""
  if (accents && Object.keys(accents).length > 0) {
    const accentDescriptions = Object.entries(accents).map(([name, hex]) => {
      const desc = colorDescriptions[name] || `${name} (${hex})`
      return `${name} ${desc}`
    })
    accentContext = `Accent colors: ${accentDescriptions.join(" and ")}. These accents should be visible on construction details like zipper tape, bartacks, and labels.`
  } else {
    const accentDesc = colorDescriptions[accent] || accent
    accentContext = `Accent thread: ${accent} ${accentDesc}.`
  }

  const context = `Premium technical ${type} for ${discipline.toLowerCase()}. ${material.name} (${material.composition}), ${material.handfeel}.`
  const colorContext = `Base color: ${baseColorName} ${colorDesc}. ${accentContext}`
  const signatureContext = signature?.slice(0, 2).join(". ") || ""

  const slotPrompts: Record<string, string> = {
    hero: `Professional product photography flat-lay. ${context} Colorway: ${colorContext} ${signatureContext}. Garment laid perfectly flat on neutral light-grey background. Centered composition, soft diffused studio lighting, subtle shadow, ultra high resolution, texture-forward. Show fabric quality and construction details. Make accent colors clearly visible on zipper, bartacks, or labels.`,
    onBody: `High-end studio editorial photo of athlete wearing ${type}. ${context} Colorway: ${colorContext} Neutral grey seamless background, soft diffused lighting, restrained editorial styling. Face cropped at nose level. Show fit, drape, and construction clearly. Accent colors visible on construction details. Premium sportswear aesthetic.`,
    macroDetail: `Macro studio close-up of signature detail on ${type}. ${context} Colorway: ${colorContext} Show construction quality: seams, bartacks, or branding detail. ${signatureContext}. Accent colors prominently visible. Neutral grey background, extreme detail, premium quality emphasis.`,
  }

  return slotPrompts[slotName] || slotPrompts.hero
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
        console.log(`[v0] Rate limited, retrying in ${delayMs}ms... (attempt ${i + 2}/${maxRetries})`)
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
    const { productId, slotName, colorwayCode, customPrompt, negativePrompt } = await request.json()

    if (!productId || !slotName || !colorwayCode) {
      return NextResponse.json({ error: "productId, slotName, and colorwayCode are required" }, { status: 400 })
    }

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const colorways = product.specs.colorways || []
    const colorwayIndex = colorways.findIndex((c: { code: string }) => c.code === colorwayCode)
    const colorway = colorways[colorwayIndex]

    if (!colorway || colorwayIndex === -1) {
      console.log(
        `[v0] Debug: colorways=${JSON.stringify(colorways.map((c: any) => c.code))}, looking for=${colorwayCode}`,
      )
      return NextResponse.json({ error: "Colorway not found" }, { status: 404 })
    }

    console.log(`[v0] Generating: ${product.name} / ${slotName} / ${colorwayCode}`)

    const colorContext = buildColorContext(colorway)

    let basePrompt: string
    if (customPrompt) {
      basePrompt = `${colorContext}\n\n${customPrompt}`
    } else if (colorway.prompts && colorway.prompts[slotName]) {
      basePrompt = `${colorContext}\n\n${colorway.prompts[slotName]}`
      console.log(`[v0] Using custom prompt from COLORWAY for ${slotName} with color injection`)
    } else if (product.specs.prompts && product.specs.prompts[slotName]) {
      basePrompt = `${colorContext}\n\n${product.specs.prompts[slotName]}`
      console.log(`[v0] Using custom prompt from product specs for ${slotName} with color injection`)
    } else {
      basePrompt = buildPrompt(product, colorway, slotName)
      console.log(`[v0] Using generated prompt for ${slotName}`)
    }

    const negative = negativePrompt || colorway.negativePrompt || product.specs.negativePrompt || ""
    const fullPrompt = negative ? `${basePrompt}\n\nAvoid: ${negative}` : basePrompt

    console.log(`[v0] Prompt: ${fullPrompt.slice(0, 200)}...`)

    const result = await withRetry(async () => {
      return await fal.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt: fullPrompt,
          aspect_ratio: "1:1",
          resolution: "1K",
        },
      })
    })

    const generatedImageUrl = result.data?.images?.[0]?.url
    if (!generatedImageUrl) {
      throw new Error("No image generated from fal")
    }

    console.log(`[v0] Generated: ${generatedImageUrl}`)

    const updatedColorways = [...colorways]
    updatedColorways[colorwayIndex] = {
      ...updatedColorways[colorwayIndex],
      images: {
        ...updatedColorways[colorwayIndex].images,
        [slotName]: generatedImageUrl,
      },
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        specs: { ...product.specs, colorways: updatedColorways },
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      productId,
      slotName,
      colorwayCode,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}
