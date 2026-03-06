"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, ImageIcon, Loader2, Sparkles, RefreshCw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface ProductImage {
  slug: string
  name: string
  colorway: string
  imageType: string
  url: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [step, setStep] = useState<"select" | "caption">("select")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<"products" | "generate">("products")
  const [loadingImages, setLoadingImages] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    loadProductImages()
  }, [])

  async function loadProductImages() {
    setLoadingImages(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/products")
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      const images: ProductImage[] = []

      for (const product of data.products || []) {
        const colorways = product.specs?.colorways || []
        for (const colorway of colorways) {
          const imgs = colorway.images || {}
          for (const [type, url] of Object.entries(imgs)) {
            if (url && typeof url === "string" && url.startsWith("http")) {
              images.push({
                slug: product.slug,
                name: product.name,
                colorway: colorway.code,
                imageType: type,
                url: url,
              })
            }
          }
        }
      }

      setProductImages(images)
    } catch (error) {
      console.error("Failed to load product images:", error)
      setLoadError(error instanceof Error ? error.message : "Failed to load")
    } finally {
      setLoadingImages(false)
    }
  }

  async function generateImage() {
    if (!customPrompt.trim()) return

    setGenerating(true)
    setGeneratedImage(null) // Clear previous
    try {
      const res = await fetch("/api/instagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customPrompt,
          negativePrompt: "No logos, no text, no watermarks, no props, no Nike, no Adidas, no brand marks",
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Generation failed")
      }

      const data = await res.json()
      setGeneratedImage(data.imageUrl)
      // Don't auto-select, let user decide
    } catch (error) {
      console.error("Failed to generate image:", error)
      alert(error instanceof Error ? error.message : "Failed to generate image")
    } finally {
      setGenerating(false)
    }
  }

  function useGeneratedImage() {
    if (generatedImage) {
      setSelectedImage(generatedImage)
      setGeneratedImage(null) // Clear the generate preview
      setActiveTab("products") // Switch back to products tab to show the selected image clearly
    }
  }

  async function createPost() {
    if (!selectedImage) return

    setPosting(true)
    try {
      const res = await fetch("/api/instagram/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: selectedImage,
          caption,
          likes_count: Math.floor(Math.random() * 300) + 100,
          comments_count: Math.floor(Math.random() * 20) + 5,
        }),
      })

      if (res.ok) {
        router.push("/instagram")
      }
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link href="/instagram" className="flex items-center gap-2 text-sm">
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <span className="font-semibold">New Post</span>
        {step === "select" ? (
          <Button size="sm" disabled={!selectedImage} onClick={() => setStep("caption")}>
            Next
          </Button>
        ) : (
          <Button size="sm" disabled={posting} onClick={createPost}>
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
          </Button>
        )}
      </header>

      {step === "select" ? (
        <div className="max-w-4xl mx-auto p-4">
          {/* Selected Image Preview - only show if we have one and NOT in generate mode with a generated image */}
          {selectedImage && !(activeTab === "generate" && generatedImage) && (
            <div className="mb-6">
              <p className="text-sm text-neutral-500 mb-2 text-center">Selected for post:</p>
              <div className="aspect-square max-w-md mx-auto relative bg-neutral-100 rounded-lg overflow-hidden">
                <Image src={selectedImage || "/placeholder.svg"} alt="Selected" fill className="object-cover" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("products")}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Product Images
            </Button>
            <Button
              variant={activeTab === "generate" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("generate")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>

          {activeTab === "products" ? (
            <div>
              <p className="text-sm text-neutral-500 mb-3">Select from existing product images</p>
              {loadingImages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : loadError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2">Failed to load images</p>
                  <Button variant="outline" size="sm" onClick={loadProductImages}>
                    Retry
                  </Button>
                </div>
              ) : productImages.length === 0 ? (
                <p className="text-neutral-400 text-center py-8">
                  No product images found. Generate some first in the product generator.
                </p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {productImages.map((img, i) => (
                    <button
                      key={`${img.slug}-${img.colorway}-${img.imageType}-${i}`}
                      onClick={() => setSelectedImage(img.url)}
                      className={`aspect-square relative rounded overflow-hidden border-2 ${
                        selectedImage === img.url ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      <Image
                        src={img.url || "/placeholder.svg"}
                        alt={`${img.name} ${img.colorway}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Generate tab - show either the prompt input OR the generated result */}
              {!generatedImage ? (
                <>
                  <p className="text-sm text-neutral-500 mb-3">Generate a new image with AI</p>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="mb-3 min-h-[120px]"
                  />
                  <Button onClick={generateImage} disabled={generating || !customPrompt.trim()} className="w-full">
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Generated image preview with action buttons */}
                  <div className="aspect-square max-w-md mx-auto relative bg-neutral-100 rounded-lg overflow-hidden mb-4">
                    <Image src={generatedImage || "/placeholder.svg"} alt="Generated" fill className="object-cover" />
                  </div>

                  <div className="flex gap-3 max-w-md mx-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedImage(null)
                        // Keep the prompt so they can regenerate
                      }}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button onClick={useGeneratedImage} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      Use This Image
                    </Button>
                  </div>

                  <p className="text-xs text-neutral-400 text-center mt-3">
                    Prompt: {customPrompt.slice(0, 100)}
                    {customPrompt.length > 100 ? "..." : ""}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-4">
          <div className="flex gap-4">
            {/* Image preview */}
            <div className="w-20 h-20 relative flex-shrink-0 bg-neutral-100 rounded overflow-hidden">
              {selectedImage && (
                <Image src={selectedImage || "/placeholder.svg"} alt="Post" fill className="object-cover" />
              )}
            </div>

            {/* Caption */}
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="flex-1 min-h-[120px] border-0 focus-visible:ring-0 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
