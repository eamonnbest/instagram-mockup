"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Loader2, Sparkles, RefreshCw, Wand2, Upload, Type,
  Link2, ExternalLink,
} from "lucide-react"
import dynamic from "next/dynamic"
import type { CanvasBlock, TextOverlayEditorHandle } from "@/components/text-overlay-editor"
import { templates, hydrateTemplate } from "@/lib/templates"
import { TemplateThumbnail } from "@/components/template-thumbnail"

const TextOverlayEditor = dynamic(
  () => import("@/components/text-overlay-editor").then((m) => m.TextOverlayEditor),
  { ssr: false },
)
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const PLACEMENTS = [
  { value: "feed", label: "Feed", ratios: ["1:1", "4:5"] },
  { value: "stories", label: "Stories", ratios: ["9:16"] },
  { value: "reels", label: "Reels", ratios: ["9:16"] },
] as const

const ASPECT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "9:16": { w: 1080, h: 1920 },
}

const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "WATCH_MORE", label: "Watch More" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "SUBSCRIBE", label: "Subscribe" },
] as const

export default function NewAdPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}>
      <NewAdPage />
    </Suspense>
  )
}

function NewAdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editAdId = searchParams.get("edit")
  const editorRef = useRef<TextOverlayEditorHandle>(null)
  const editorExportResolveRef = useRef<(() => void) | null>(null)
  const exportedImageUrlRef = useRef<string | null>(null)

  // Image state
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"generate" | "upload" | "url" | "template">("generate")
  const [imageModel, setImageModel] = useState("fal-ai/nano-banana-2")
  const [editingOverlay, setEditingOverlay] = useState(false)
  const [overlayBlocks, setOverlayBlocks] = useState<CanvasBlock[]>([])
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [exportingOverlay, setExportingOverlay] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState(false)

  // Ad-specific state
  const [placement, setPlacement] = useState("feed")
  const [aspectRatio, setAspectRatio] = useState("4:5")
  const [primaryText, setPrimaryText] = useState("")
  const [headline, setHeadline] = useState("")
  const [description, setDescription] = useState("")
  const [ctaType, setCtaType] = useState("LEARN_MORE")
  const [destinationUrl, setDestinationUrl] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [status, setStatus] = useState("draft")
  const [notes, setNotes] = useState("")

  // UI state
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editAdId)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  // Load existing ad in edit mode
  useEffect(() => {
    if (!editAdId) return
    async function loadAd() {
      try {
        const res = await fetch("/api/instagram/ads")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        const ad = data.ads?.find((a: { id: string }) => a.id === editAdId)
        if (ad) {
          setSelectedImage(ad.image_url)
          setPlacement(ad.placement || "feed")
          setAspectRatio(ad.aspect_ratio || "4:5")
          setPrimaryText(ad.primary_text || "")
          setHeadline(ad.headline || "")
          setDescription(ad.description || "")
          setCtaType(ad.cta_type || "LEARN_MORE")
          setDestinationUrl(ad.destination_url || "")
          setCampaignName(ad.campaign_name || "")
          setStatus(ad.status || "draft")
          setNotes(ad.notes || "")
          if (ad.overlay_blocks?.length) {
            setOverlayBlocks(ad.overlay_blocks)
          }
          if (ad.original_image_url) {
            setOriginalImageUrl(ad.original_image_url)
          }
        } else {
          setSaveError("Ad not found. It may have been deleted.")
        }
      } catch (error) {
        console.error("Failed to load ad:", error)
        setSaveError("Failed to load ad for editing.")
      } finally {
        setLoadingEdit(false)
      }
    }
    loadAd()
  }, [editAdId])

  // When placement changes, auto-pick first valid aspect ratio
  function handlePlacementChange(newPlacement: string) {
    setPlacement(newPlacement)
    const placementConfig = PLACEMENTS.find((p) => p.value === newPlacement)
    if (placementConfig && !(placementConfig.ratios as readonly string[]).includes(aspectRatio)) {
      setAspectRatio(placementConfig.ratios[0])
    }
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
        } catch { /* not JSON */ }
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

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/instagram/upload", { method: "POST", body: formData })
      if (!res.ok) {
        let message = "Upload failed"
        try {
          const errData = await res.json()
          message = errData.error || message
        } catch { /* not JSON */ }
        throw new Error(message)
      }
      const data = await res.json()
      setSelectedImage(data.imageUrl)
    } catch (error) {
      console.error("Failed to upload:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function useImageUrl() {
    const trimmed = imageUrl.trim()
    if (!trimmed) return
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://")
      return
    }
    setUrlError(null)
    setSelectedImage(trimmed)
    setImageUrl("")
  }

  function useGeneratedImage() {
    if (!generatedImage) return
    setSelectedImage(generatedImage)
    setGeneratedImage(null)
  }

  async function applyTemplateBlocks(blocks: CanvasBlock[]) {
    if (!selectedImage) {
      // Create blank canvas
      const dims = ASPECT_DIMENSIONS[aspectRatio] || { w: 1080, h: 1350 }
      const canvas = document.createElement("canvas")
      canvas.width = dims.w
      canvas.height = dims.h
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, dims.w, dims.h)
      const blankDataUrl = canvas.toDataURL("image/png")
      const blob = await (await fetch(blankDataUrl)).blob()
      const file = new File([blob], "blank.png", { type: "image/png" })
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/instagram/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Failed to create canvas")
      const uploadData = await uploadRes.json()
      setSelectedImage(uploadData.imageUrl)
    }
    setOverlayBlocks(blocks)
    setEditingOverlay(true)
  }

  async function applyPresetTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    try {
      await applyTemplateBlocks(hydrateTemplate(tpl))
    } catch (error) {
      console.error("Failed to apply template:", error)
      alert("Failed to apply template")
    }
  }

  async function generateTemplate() {
    if (!customPrompt.trim()) return
    setGeneratingTemplate(true)
    try {
      const res = await fetch("/api/instagram/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt }),
      })
      if (!res.ok) {
        let message = "Template generation failed"
        try {
          const errData = await res.json()
          message = errData.error || message
        } catch { /* not JSON */ }
        throw new Error(message)
      }
      const data = await res.json()
      if (data.blocks?.length) {
        await applyTemplateBlocks(data.blocks)
      }
    } catch (error) {
      console.error("Failed to generate template:", error)
      alert(error instanceof Error ? error.message : "Failed to generate template")
    } finally {
      setGeneratingTemplate(false)
    }
  }

  async function saveAd() {
    setSaving(true)
    setSaveError(null)
    try {
      // Auto-export overlay if editor is open
      exportedImageUrlRef.current = null
      if (editingOverlay && editorRef.current) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            editorExportResolveRef.current = null
            resolve()
          }, 15000)
          editorExportResolveRef.current = () => {
            clearTimeout(timeout)
            resolve()
          }
          editorRef.current!.triggerExport()
        })
      }

      const finalImageUrl = exportedImageUrlRef.current || selectedImage
      const isEdit = !!editAdId

      const payload = {
        ...(isEdit ? { id: editAdId } : {}),
        placement,
        aspect_ratio: aspectRatio,
        image_url: finalImageUrl,
        original_image_url: originalImageUrl,
        primary_text: primaryText || null,
        headline: headline || null,
        description: description || null,
        cta_type: ctaType,
        destination_url: destinationUrl || null,
        campaign_name: campaignName || null,
        status,
        overlay_blocks: overlayBlocks.filter((b) => b.type !== "image"),
        notes: notes || null,
      }

      const res = await fetch("/api/instagram/ads", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push("/ads")
      } else {
        const errData = await res.json().catch(() => null)
        setSaveError(errData?.error || `Failed to ${isEdit ? "update" : "create"} ad.`)
      }
    } catch (error) {
      console.error("Failed to save ad:", error)
      setSaveError(`Failed to ${editAdId ? "update" : "create"} ad.`)
    } finally {
      setSaving(false)
    }
  }

  const currentPlacement = PLACEMENTS.find((p) => p.value === placement)
  const dims = ASPECT_DIMENSIONS[aspectRatio] || { w: 1080, h: 1350 }
  // Preview scale: fit preview into max 400px wide
  const previewScale = Math.min(400 / dims.w, 500 / dims.h)
  const previewW = Math.round(dims.w * previewScale)
  const previewH = Math.round(dims.h * previewScale)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link href="/ads" className="flex items-center gap-2 text-sm">
          <ChevronLeft className="w-5 h-5" />
          <span>Ads</span>
        </Link>
        <span className="font-semibold">{editAdId ? "Edit Ad" : "New Ad"}</span>
        <div className="w-16" />
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {loadingEdit ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Image + overlay editor */}
          <div>
            {/* Placement & Aspect Ratio */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Placement</label>
                <div className="flex gap-2 mt-1">
                  {PLACEMENTS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => handlePlacementChange(p.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        placement === p.value
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Aspect Ratio</label>
                <div className="flex gap-2 mt-1">
                  {currentPlacement?.ratios.map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        aspectRatio === r
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      {r} <span className="text-xs opacity-60">({ASPECT_DIMENSIONS[r].w}x{ASPECT_DIMENSIONS[r].h})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image area */}
            {selectedImage && !editingOverlay ? (
              <div className="mb-4">
                <div
                  className="relative mx-auto bg-zinc-100 rounded-lg overflow-hidden"
                  style={{ width: previewW, height: previewH }}
                >
                  <Image
                    src={selectedImage}
                    alt="Ad creative"
                    fill
                    className="object-cover"
                    sizes={`${previewW}px`}
                  />
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setSelectedImage(null)}>
                    Change Image
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingOverlay(true)}>
                    <Type className="w-3.5 h-3.5" />
                    Edit Overlay
                  </Button>
                </div>
              </div>
            ) : editingOverlay && selectedImage ? (
              <div className="mb-4">
                <TextOverlayEditor
                  ref={editorRef}
                  imageUrl={originalImageUrl || selectedImage}
                  initialBlocks={overlayBlocks}
                  onExport={async (dataUrl, blocks) => {
                    setExportingOverlay(true)
                    try {
                      if (!originalImageUrl) {
                        setOriginalImageUrl(selectedImage)
                      }
                      const persistableBlocks = blocks.filter((b) => b.type !== "image")
                      setOverlayBlocks(persistableBlocks)

                      const res = await fetch(dataUrl)
                      const blob = await res.blob()
                      const file = new File([blob], "ad-overlay.png", { type: "image/png" })
                      const formData = new FormData()
                      formData.append("file", file)
                      const uploadRes = await fetch("/api/instagram/upload", {
                        method: "POST",
                        body: formData,
                      })
                      if (!uploadRes.ok) throw new Error("Upload failed")
                      const data = await uploadRes.json()
                      setSelectedImage(data.imageUrl)
                      exportedImageUrlRef.current = data.imageUrl
                      setEditingOverlay(false)
                    } catch (error) {
                      console.error("Failed to export overlay:", error)
                      alert("Failed to save overlay")
                    } finally {
                      setExportingOverlay(false)
                      if (editorExportResolveRef.current) {
                        editorExportResolveRef.current()
                        editorExportResolveRef.current = null
                      }
                    }
                  }}
                />
                {exportingOverlay && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting overlay...
                  </div>
                )}
              </div>
            ) : (
              /* Image source tabs */
              <div className="mb-4">
                <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 mb-4">
                  {(["generate", "upload", "url", "template"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 text-xs py-2 px-2 rounded-md capitalize transition-colors ${
                        activeTab === tab ? "bg-white shadow-sm font-medium" : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {tab === "generate" ? "AI Generate" : tab === "url" ? "URL" : tab}
                    </button>
                  ))}
                </div>

                {activeTab === "generate" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Model</label>
                      <select
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value)}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="fal-ai/nano-banana-2">Nano Banana 2 (fast)</option>
                        <option value="fal-ai/gpt-image-1.5">GPT Image 1.5</option>
                        <option value="fal-ai/flux-2-pro">FLUX 2 Pro</option>
                      </select>
                    </div>
                    <Textarea
                      placeholder="Describe the ad image you want..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={generateImage} disabled={generating || !customPrompt.trim()} className="gap-1.5">
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={generateTemplate}
                        disabled={generatingTemplate || !customPrompt.trim()}
                        className="gap-1.5"
                      >
                        {generatingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        AI Template
                      </Button>
                    </div>
                    {generatedImage && (
                      <div className="relative">
                        <div
                          className="relative mx-auto bg-zinc-100 rounded-lg overflow-hidden"
                          style={{ width: previewW, height: previewH }}
                        >
                          <Image src={generatedImage} alt="Generated" fill className="object-cover" sizes={`${previewW}px`} />
                        </div>
                        <div className="flex gap-2 mt-2 justify-center">
                          <Button size="sm" onClick={useGeneratedImage} className="gap-1">
                            Use This
                          </Button>
                          <Button size="sm" variant="outline" onClick={generateImage} disabled={generating}>
                            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "upload" && (
                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg p-8 cursor-pointer hover:border-neutral-400 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                          <span className="text-sm text-neutral-500">Click to upload image</span>
                          <span className="text-xs text-neutral-400 mt-1">PNG, JPG, WebP up to 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                      />
                    </label>
                  </div>
                )}

                {activeTab === "url" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setUrlError(null) }}
                        onKeyDown={(e) => e.key === "Enter" && useImageUrl()}
                      />
                      <Button onClick={useImageUrl} variant="outline" className="shrink-0">
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                  </div>
                )}

                {activeTab === "template" && (
                  <div className="grid grid-cols-4 gap-2">
                    {templates.map((t) => (
                      <button key={t.id} onClick={() => applyPresetTemplate(t.id)} className="text-center group">
                        <div className="rounded-lg overflow-hidden border group-hover:border-zinc-400 transition-colors">
                          <TemplateThumbnail blocks={t.blocks} size={80} />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 block truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column: Ad copy + settings */}
          <div className="space-y-5">
            {/* Campaign */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Campaign</label>
              <Input
                placeholder="e.g. Spring Launch, Brand Awareness"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Primary Text */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Primary Text</label>
                <span className={`text-xs ${primaryText.length > 125 ? "text-amber-500" : "text-zinc-400"}`}>
                  {primaryText.length}/125
                </span>
              </div>
              <Textarea
                placeholder="The main body text that appears below the ad image..."
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>

            {/* Headline */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Headline</label>
                <span className={`text-xs ${headline.length > 40 ? "text-amber-500" : "text-zinc-400"}`}>
                  {headline.length}/40
                </span>
              </div>
              <Input
                placeholder="Bold text below image"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description <span className="text-zinc-400 normal-case">(optional)</span></label>
              <Input
                placeholder="Additional supporting text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* CTA + Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">CTA Button</label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {CTA_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Destination URL</label>
                <div className="relative mt-1">
                  <Input
                    placeholder="https://..."
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="pr-8"
                  />
                  {destinationUrl && (
                    <ExternalLink className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</label>
              <div className="flex gap-2 mt-1">
                {(["draft", "ready", "exported"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 text-sm rounded-full border capitalize transition-colors ${
                      status === s
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Internal Notes <span className="text-zinc-400 normal-case">(optional)</span></label>
              <Textarea
                placeholder="Notes for yourself..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-[60px]"
              />
            </div>

            {/* Ad Preview Card */}
            {selectedImage && (
              <div className="border rounded-xl p-4 bg-zinc-50">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Ad Preview</p>
                <div className="bg-white rounded-lg border overflow-hidden">
                  {/* Sponsored header */}
                  <div className="px-3 py-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-200" />
                    <div>
                      <p className="text-xs font-semibold">lattify</p>
                      <p className="text-[10px] text-zinc-400">Sponsored</p>
                    </div>
                  </div>
                  {/* Image */}
                  <div className="relative w-full bg-zinc-100" style={{ aspectRatio: `${dims.w}/${dims.h}` }}>
                    <Image src={selectedImage} alt="Preview" fill className="object-cover" sizes="400px" />
                  </div>
                  {/* CTA button */}
                  <div className="px-3 py-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        {headline && <p className="text-xs font-semibold truncate">{headline}</p>}
                        {description && <p className="text-[10px] text-zinc-500 truncate">{description}</p>}
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase shrink-0">
                        {CTA_OPTIONS.find((c) => c.value === ctaType)?.label || "Learn More"}
                      </span>
                    </div>
                  </div>
                  {/* Primary text */}
                  {primaryText && (
                    <div className="px-3 pb-2">
                      <p className="text-xs text-zinc-700 line-clamp-2">{primaryText}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save */}
            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}
            <Button onClick={saveAd} disabled={saving || !selectedImage} className="w-full gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editAdId ? "Update Ad" : "Create Ad"}
            </Button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
