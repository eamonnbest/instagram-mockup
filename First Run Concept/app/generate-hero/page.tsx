"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import Link from "next/link"

const PROMPT_VERSION = "v2-loro-piana"

const DEFAULT_PROMPT = `Editorial fashion photograph, grass tennis court at private members club, misty early morning. Athletic male model STANDING STILL, three-quarter view, face cropped at mouth. CHALK technical track jacket with twin micro-suede chest tapes — collar slightly open showing hidden tartan facing inside. The jacket fits PERFECTLY — no bunching, precise shoulder line, clean drape. You can see the texture of the technical double-knit fabric. Soft diffused morning light. Shot on medium format, shallow depth of field. The garment is clearly expensive — precision tailoring, considered details. Loro Piana campaign aesthetic.`

const DEFAULT_NEGATIVE = `No obvious logos, no flashy colors, no text overlays, no props, no harsh flash, no busy backgrounds, no generic sportswear aesthetic, no action poses, no full-body distant shots, no cheap fabric appearance, no walking, no motion blur, no boxy fit.`

export default function GenerateHeroPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [currentHero, setCurrentHero] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [usingSaved, setUsingSaved] = useState(false)

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.hero_image_url) {
          setCurrentHero(data.hero_image_url)
        }
        if (data.hero_prompt_version === PROMPT_VERSION && data.hero_prompt) {
          setPrompt(data.hero_prompt)
          setUsingSaved(true)
        }
        if (data.hero_prompt_version === PROMPT_VERSION && data.hero_negative_prompt) {
          setNegativePrompt(data.hero_negative_prompt)
        }
      })
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setSaved(false)

    try {
      await Promise.all([
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "hero_prompt", value: prompt }),
        }),
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "hero_negative_prompt", value: negativePrompt }),
        }),
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "hero_prompt_version", value: PROMPT_VERSION }),
        }),
      ])
      setUsingSaved(true)

      const res = await fetch("/api/generate-hero-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt: prompt, negativePrompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Generation failed")
      }

      setImageUrl(data.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT)
    setNegativePrompt(DEFAULT_NEGATIVE)
    setUsingSaved(false)
  }

  const handleSaveToHomepage = async () => {
    if (!imageUrl) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_image_url", value: imageUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Save failed")
      }

      setSaved(true)
      setCurrentHero(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium">Generate Hero Image</h1>
            <p className="text-muted-foreground text-sm mt-1">The details are the point</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/generate-products" className="text-sm text-muted-foreground hover:text-foreground">
              Products
            </Link>
            <Link href="/generate-logo" className="text-sm text-muted-foreground hover:text-foreground">
              Logo
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
        </div>

        {currentHero && (
          <div className="mb-8 p-4 border rounded bg-muted/30">
            <p className="text-xs font-mono text-muted-foreground mb-2">Current homepage hero</p>
            <div className="aspect-[21/9] relative rounded overflow-hidden">
              <Image src={currentHero || "/placeholder.svg"} alt="Current hero" fill className="object-cover" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Prompt</label>
                {usingSaved && <span className="text-xs text-muted-foreground">Using saved prompt</span>}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
                placeholder="Enter image generation prompt..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Negative prompt</label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="min-h-[80px] font-mono text-xs"
                placeholder="What to avoid..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? "Generating..." : "Generate Hero Image"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}

            {imageUrl && (
              <div className="p-3 bg-muted text-sm rounded space-y-3">
                <p className="font-medium">Generated successfully!</p>
                <p className="text-xs text-muted-foreground break-all font-mono">{imageUrl}</p>
                <Button
                  onClick={handleSaveToHomepage}
                  disabled={saving || saved}
                  variant={saved ? "outline" : "default"}
                  className="w-full"
                >
                  {saving ? "Saving..." : saved ? "Saved to homepage!" : "Use as homepage hero"}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium mb-2 block">Preview (16:9 banner)</label>
            <div className="aspect-[16/9] bg-[#F4F4F2] relative overflow-hidden rounded border">
              {imageUrl ? (
                <Image src={imageUrl || "/placeholder.svg"} alt="Generated hero" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-sm">No image generated yet</p>
                    <p className="text-xs opacity-60 mt-1">Click generate to create a hero image</p>
                  </div>
                </div>
              )}
            </div>

            {imageUrl && (
              <div className="border rounded overflow-hidden">
                <p className="text-xs text-muted-foreground p-3 border-b font-mono">Full-width banner preview</p>
                <div className="relative aspect-[21/9] bg-[#F4F4F2]">
                  <Image src={imageUrl || "/placeholder.svg"} alt="Hero preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 text-white max-w-xl">
                    <p className="text-xs opacity-60 font-mono mb-2">Season 01</p>
                    <p className="text-2xl font-medium leading-tight mb-2">Every detail considered.</p>
                    <p className="text-sm opacity-80">Classic athletic silhouettes. Obsessive finishing.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <h2 className="text-sm font-medium mb-4">Alternative hero concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Grass courts — standing (default)",
                prompt: DEFAULT_PROMPT,
                negative: DEFAULT_NEGATIVE,
              },
              {
                name: "Grass courts — walking",
                prompt: `Editorial fashion photograph, grass tennis court at private members club, misty early morning. Athletic male model walking with purpose, face cropped at chin. CHALK technical track jacket with twin micro-suede chest tapes. Premium technical double-knit fabric texture visible. Soft diffused morning light. Medium format clarity, shallow depth of field. Loro Piana campaign aesthetic.`,
                negative: `No obvious logos, no flashy colors, no text overlays, no props, no harsh flash, no busy backgrounds, no generic sportswear aesthetic, no full-body distant shots.`,
              },
              {
                name: "Detail focus — visible tartan",
                prompt: `Editorial fashion photograph, tight crop shoulder to waist. Technical track jacket in CHALK with collar open — hidden tartan facing CLEARLY VISIBLE inside collar edge. Twin micro-suede chest tapes. You can see fabric texture, seam precision, the quality of construction. Soft natural light. The hidden detail revealed. Medium format, shallow focus. Clearly expensive.`,
                negative: `No obvious logos, no text, no busy backgrounds, no full body, no face above chin.`,
              },
              {
                name: "Extreme macro — tape detail",
                prompt: `Extreme close-up product photograph. Technical track jacket chest tape: micro-suede texture against matte double-knit body. You can count the fibers, see the precision of the edge finishing, the way materials meet. Hidden tartan facing barely visible at collar edge. Natural studio light, razor-sharp focus on construction detail. The obsession made visible. Medium format clarity.`,
                negative: `No figure, no face, no background distractions, no logos, no text, no wide shots.`,
              },
            ].map((alt) => (
              <button
                key={alt.name}
                onClick={() => {
                  setPrompt(alt.prompt)
                  setNegativePrompt(alt.negative)
                  setUsingSaved(false)
                }}
                className="text-left p-4 border rounded hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium mb-1">{alt.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{alt.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
