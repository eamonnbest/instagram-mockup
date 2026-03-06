"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, Link2, Loader2, Sparkles, RefreshCw, Check, Wand2, Plus, X, ChevronLeftIcon, ChevronRight, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function NewPostPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [addingMore, setAddingMore] = useState(false)
  const [caption, setCaption] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<"url" | "generate">("generate")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [postError, setPostError] = useState<string | null>(null)
  const [captionStyle, setCaptionStyle] = useState<"casual" | "professional" | "witty" | "minimal">("casual")
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([])
  const [generatingCaptions, setGeneratingCaptions] = useState(false)
  const [showCaptionAssist, setShowCaptionAssist] = useState(false)
  const [imageModel, setImageModel] = useState("fal-ai/nano-banana-2")

  function useImageUrl() {
    const trimmed = imageUrl.trim()
    if (!trimmed) return
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://")
      return
    }
    setUrlError(null)
    if (addingMore) {
      setCarouselImages((prev) => [...prev, trimmed])
      setCarouselIndex(carouselImages.length)
      setAddingMore(false)
    } else {
      setSelectedImage(trimmed)
      setCarouselImages([trimmed])
      setCarouselIndex(0)
    }
    setImageUrl("")
  }

  async function generateImage() {
    if (!customPrompt.trim()) return

    setGenerating(true)
    setGeneratedImage(null)
    try {
      const res = await fetch("/api/instagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt, model: imageModel }),
      })

      if (!res.ok) {
        let message = "Generation failed"
        try {
          const errData = await res.json()
          message = errData.error || message
        } catch {
          // Response wasn't JSON
        }
        throw new Error(message)
      }

      const data = await res.json()
      setGeneratedImage(data.imageUrl)
    } catch (error) {
      console.error("Failed to generate image:", error)
      alert(error instanceof Error ? error.message : "Failed to generate image")
    } finally {
      setGenerating(false)
    }
  }

  function useGeneratedImage() {
    if (!generatedImage) return
    if (addingMore) {
      setCarouselImages((prev) => [...prev, generatedImage])
      setCarouselIndex(carouselImages.length)
      setAddingMore(false)
    } else {
      setSelectedImage(generatedImage)
      setCarouselImages([generatedImage])
      setCarouselIndex(0)
    }
    setGeneratedImage(null)
  }

  function removeCarouselImage(index: number) {
    const updated = carouselImages.filter((_, i) => i !== index)
    setCarouselImages(updated)
    if (updated.length === 0) {
      setSelectedImage(null)
      setCarouselIndex(0)
    } else {
      setSelectedImage(updated[0])
      setCarouselIndex(Math.min(carouselIndex, updated.length - 1))
    }
  }

  async function generateCaptions() {
    const context = customPrompt.trim() || caption.trim() || "a photo for our coffee brand Lattify"
    setGeneratingCaptions(true)
    setSuggestedCaptions([])
    try {
      const res = await fetch("/api/instagram/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: context, style: captionStyle }),
      })
      if (!res.ok) {
        let message = "Caption generation failed"
        try {
          const errData = await res.json()
          message = errData.error || message
        } catch {
          // not JSON
        }
        throw new Error(message)
      }
      const data = await res.json()
      setSuggestedCaptions(data.captions)
    } catch (error) {
      console.error("Failed to generate captions:", error)
      alert(error instanceof Error ? error.message : "Failed to generate captions")
    } finally {
      setGeneratingCaptions(false)
    }
  }

  async function createPost() {
    if (!selectedImage) return

    setPosting(true)
    setPostError(null)
    try {
      const res = await fetch("/api/instagram/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: carouselImages[0] || selectedImage,
          caption,
          likes_count: Math.floor(Math.random() * 300) + 100,
          comments_count: Math.floor(Math.random() * 20) + 5,
          carousel_images: carouselImages.length > 1 ? carouselImages : [],
        }),
      })

      if (res.ok) {
        router.push("/")
      } else {
        setPostError("Failed to create post. Please try again.")
      }
    } catch (error) {
      console.error("Failed to create post:", error)
      setPostError("Failed to create post. Please try again.")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <span className="font-semibold">New Post</span>
        <div className="w-16" />
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Selected image preview + caption */}
        {selectedImage && !addingMore && (
          <div className="mb-6">
            {/* Carousel viewer */}
            <div className="aspect-square max-w-md mx-auto relative bg-neutral-100 rounded-lg overflow-hidden">
              <Image src={carouselImages[carouselIndex] || selectedImage} alt="Selected" fill className="object-cover" unoptimized />
              {carouselImages.length > 1 && (
                <>
                  {carouselIndex > 0 && (
                    <button
                      onClick={() => setCarouselIndex(carouselIndex - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                  )}
                  {carouselIndex < carouselImages.length - 1 && (
                    <button
                      onClick={() => setCarouselIndex(carouselIndex + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {carouselImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === carouselIndex ? "bg-[#0095f6]" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Image count badge */}
              {carouselImages.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  <Copy className="w-3 h-3 inline mr-1" />
                  {carouselIndex + 1}/{carouselImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="max-w-md mx-auto mt-3 flex gap-2 items-center">
              {carouselImages.map((img, i) => (
                <div key={i} className="relative group">
                  <button
                    onClick={() => setCarouselIndex(i)}
                    className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                      i === carouselIndex ? "border-[#0095f6]" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  </button>
                  <button
                    onClick={() => removeCarouselImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {carouselImages.length < 10 && (
                <button
                  onClick={() => setAddingMore(true)}
                  className="w-14 h-14 rounded-md border-2 border-dashed border-neutral-300 flex items-center justify-center hover:border-neutral-400 transition-colors"
                >
                  <Plus className="w-5 h-5 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="max-w-md mx-auto mt-4">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="min-h-[100px] resize-none"
              />

              {/* Caption AI Assist */}
              <div className="mt-3">
                <button
                  onClick={() => setShowCaptionAssist(!showCaptionAssist)}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {showCaptionAssist ? "Hide caption assist" : "Suggest captions with AI"}
                </button>

                {showCaptionAssist && (
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    {/* Style picker */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(["casual", "professional", "witty", "minimal"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setCaptionStyle(style)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            captionStyle === style
                              ? "bg-neutral-900 text-white"
                              : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
                          }`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      onClick={generateCaptions}
                      disabled={generatingCaptions}
                      className="w-full"
                    >
                      {generatingCaptions ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Generate Captions
                        </>
                      )}
                    </Button>

                    {/* Suggestions */}
                    {suggestedCaptions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {suggestedCaptions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCaption(suggestion)
                              setSuggestedCaptions([])
                              setShowCaptionAssist(false)
                            }}
                            className="w-full text-left p-2.5 bg-white rounded-md border border-neutral-200 hover:border-neutral-400 transition-colors"
                          >
                            <p className="text-sm whitespace-pre-line">{suggestion}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={createPost}
                disabled={posting}
                className="w-full mt-3 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold"
              >
                {posting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share"
                )}
              </Button>
              {postError && <p className="text-sm text-red-500 mt-2 text-center">{postError}</p>}

              <button
                onClick={() => {
                  setSelectedImage(null)
                  setCarouselImages([])
                  setCarouselIndex(0)
                }}
                className="w-full mt-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Image source — show when no image selected or adding more to carousel */}
        {(!selectedImage || addingMore) && (
          <>
            {addingMore && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Add another image to carousel</p>
                <Button size="sm" variant="ghost" onClick={() => setAddingMore(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "generate" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("generate")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
              <Button
                variant={activeTab === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("url")}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Image URL
              </Button>
            </div>

            {activeTab === "url" ? (
              <div>
                <p className="text-sm text-neutral-500 mb-3">Paste an image URL</p>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setUrlError(null)
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button onClick={useImageUrl} disabled={!imageUrl.trim()}>
                    Use
                  </Button>
                </div>
                {urlError && <p className="text-sm text-red-500 mt-2">{urlError}</p>}
              </div>
            ) : (
              <div>
                {!generatedImage ? (
                  <>
                    <p className="text-sm text-neutral-500 mb-3">Describe the image you want</p>
                    <select
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full mb-3 px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white"
                    >
                      <option value="fal-ai/nano-banana-2">Nano Banana 2</option>
                      <option value="fal-ai/gpt-image-1.5">GPT Image 1.5</option>
                      <option value="fal-ai/flux-2-pro">Flux 2 Pro</option>
                    </select>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="A flat white coffee on a marble counter, morning light, minimal aesthetic..."
                      className="mb-3 min-h-[100px]"
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
                    <div className="aspect-square max-w-md mx-auto relative bg-neutral-100 rounded-lg overflow-hidden mb-4">
                      <Image src={generatedImage} alt="Generated" fill className="object-cover" unoptimized />
                    </div>

                    <div className="flex gap-3 max-w-md mx-auto">
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedImage(null)}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button
                        onClick={useGeneratedImage}
                        className="flex-1 bg-[#0095f6] hover:bg-[#1877f2] text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                      </Button>
                    </div>

                    <p className="text-xs text-neutral-400 text-center mt-3">
                      {customPrompt.slice(0, 100)}
                      {customPrompt.length > 100 ? "..." : ""}
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
