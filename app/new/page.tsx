"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Link2, Loader2, Sparkles, RefreshCw, Check, Wand2, Plus, X, ChevronLeftIcon, ChevronRight, Copy, Upload, Type, Play, Music, Trash2, Scissors, Crop } from "lucide-react"
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
import { uploadViaSigned } from "@/lib/upload-signed"
import { AudioTrimmer } from "@/components/audio-trimmer"
import { generateVideoThumbnail } from "@/lib/generate-thumbnail"
import { ImageCropper } from "@/components/image-cropper"

export default function NewPostPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}>
      <NewPostPage />
    </Suspense>
  )
}

const REALISM_CHIPS = [
  { id: "real-people", label: "Real people", prompt: "person should look like a real everyday person, not a model, average attractiveness, natural skin texture with visible pores and imperfections, do not smooth or beautify" },
  { id: "unposed", label: "Unposed", prompt: "natural candid posture and expression, not posed like a model, natural eye direction" },
  { id: "phone-snap", label: "Phone snap", prompt: "natural photo, do not enhance or beautify, keep original lighting and skin texture, slight camera imperfections" },
  { id: "disposable", label: "Disposable", prompt: "subtle film texture, slightly muted colors, do not over-stylize or add heavy grain" },
  { id: "raw-photo", label: "Raw photo", prompt: "do not color correct, do not enhance lighting, do not sharpen, keep the image as-is with natural imperfections" },
] as const

const MUSIC_STYLES = [
  { id: "indie", label: "Indie", prompt: "indie rock, raw guitar tones, slightly lo-fi production, authentic and unpolished feel, not corporate or stock-music sounding" },
  { id: "lo-fi", label: "Lo-fi", prompt: "lo-fi hip hop, warm vinyl crackle, mellow piano chords, relaxed dusty beats, bedroom producer aesthetic" },
  { id: "acoustic", label: "Acoustic", prompt: "acoustic guitar, intimate and stripped back, fingerpicked, warm and natural recording, singer-songwriter feel" },
  { id: "electronic", label: "Electronic", prompt: "electronic, warm analog synths, textured pads, subtle glitch elements, not generic EDM, more like Tycho or Bonobo" },
  { id: "cinematic", label: "Cinematic", prompt: "cinematic ambient, slow build, atmospheric textures, emotional piano, not cheesy trailer music, more like Olafur Arnalds" },
  { id: "punk", label: "Punk/Raw", prompt: "punk energy, raw distorted guitars, fast drums, DIY recording quality, aggressive and authentic" },
  { id: "soul", label: "Soul/R&B", prompt: "neo-soul, warm keys, smooth bass, organic drums, vintage feel, like a late night session recording" },
  { id: "ambient", label: "Ambient", prompt: "ambient, slow evolving textures, reverb-drenched, spacious and meditative, not new age, more like Brian Eno" },
] as const

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") ||
    lower.includes(".mp4?") || lower.includes(".mov?") || lower.includes(".webm?")
}

function NewPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editPostId = searchParams.get("edit")
  const editorRef = useRef<TextOverlayEditorHandle>(null)
  const editorExportResolveRef = useRef<(() => void) | null>(null)
  const exportedImageUrlRef = useRef<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [addingMore, setAddingMore] = useState(false)
  const [caption, setCaption] = useState("")
  const [loadingEdit, setLoadingEdit] = useState(!!editPostId)
  const [imageUrl, setImageUrl] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<"url" | "generate" | "upload" | "template">("generate")
  const [uploading, setUploading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [postError, setPostError] = useState<string | null>(null)
  const [captionStyle, setCaptionStyle] = useState<"casual" | "professional" | "witty" | "minimal">("casual")
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([])
  const [generatingCaptions, setGeneratingCaptions] = useState(false)
  const [showCaptionAssist, setShowCaptionAssist] = useState(false)
  const [captionContext, setCaptionContext] = useState("")
  const [imageModel, setImageModel] = useState("fal-ai/nano-banana-2")
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null)
  const [exportingOverlay, setExportingOverlay] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [uploadingReference, setUploadingReference] = useState(false)
  const [dragOverRef, setDragOverRef] = useState(false)
  const [referencePreset, setReferencePreset] = useState<"same-vibe" | "close">("close")
  // Per-image overlay blocks (keyed by carousel index) and original (pre-overlay) image URLs
  const [overlayBlocksMap, setOverlayBlocksMap] = useState<Record<number, CanvasBlock[]>>({})
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([])
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [activeRealismChips, setActiveRealismChips] = useState<Set<string>>(new Set())
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [musicPrompt, setMusicPrompt] = useState("")
  const [musicDuration, setMusicDuration] = useState(30)
  const [musicInstrumental, setMusicInstrumental] = useState(true)
  const [generatingMusic, setGeneratingMusic] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [activeMusicStyles, setActiveMusicStyles] = useState<Set<string>>(new Set())
  const [trimming, setTrimming] = useState(false)
  const [generatingMusicPrompt, setGeneratingMusicPrompt] = useState(false)
  const [pendingCropUrl, setPendingCropUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  function toggleRealismChip(chipId: string) {
    const chip = REALISM_CHIPS.find((c) => c.id === chipId)
    if (!chip) return

    const isActive = activeRealismChips.has(chipId)
    const next = new Set(activeRealismChips)

    if (isActive) {
      next.delete(chipId)
      setCustomPrompt((p) => {
        return p.replace(chip.prompt, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim()
      })
    } else {
      next.add(chipId)
      setCustomPrompt((p) => {
        const trimmed = p.trim()
        return trimmed ? `${trimmed}, ${chip.prompt}` : chip.prompt
      })
    }

    setActiveRealismChips(next)
  }

  // Deactivate chips whose text was manually edited out of the prompt
  useEffect(() => {
    if (activeRealismChips.size === 0) return
    const next = new Set(activeRealismChips)
    let changed = false
    for (const chipId of activeRealismChips) {
      const chip = REALISM_CHIPS.find((c) => c.id === chipId)
      if (chip && !customPrompt.includes(chip.prompt)) {
        next.delete(chipId)
        changed = true
      }
    }
    if (changed) setActiveRealismChips(next)
  }, [customPrompt, activeRealismChips])

  // Load existing post data in edit mode
  useEffect(() => {
    if (!editPostId) return
    async function loadPost() {
      try {
        const res = await fetch("/api/instagram/posts")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        const post = data.posts?.find((p: { id: string }) => p.id === editPostId)
        if (post) {
          const images = post.carousel_images?.length > 0 ? post.carousel_images : post.image_url ? [post.image_url] : []
          setSelectedImage(images[0] || null)
          setCarouselImages(images)
          setCaption(post.caption || "")
          if (post.audio_url) setAudioUrl(post.audio_url)
          if (post.thumbnail_url) setThumbnailUrl(post.thumbnail_url)
          // Restore overlay blocks if saved (stored as { "0": [...], "1": [...] })
          if (post.overlay_blocks && typeof post.overlay_blocks === "object") {
            const blocksMap: Record<number, CanvasBlock[]> = {}
            for (const [key, val] of Object.entries(post.overlay_blocks)) {
              blocksMap[Number(key)] = val as CanvasBlock[]
            }
            setOverlayBlocksMap(blocksMap)
            // If we have overlay blocks, use original URLs as the editor background
            if (post.original_image_url) {
              // original_image_url is stored as a comma-less JSON array or single string
              try {
                const parsed = JSON.parse(post.original_image_url)
                setOriginalImageUrls(Array.isArray(parsed) ? parsed : [parsed])
              } catch {
                setOriginalImageUrls([post.original_image_url])
              }
            }
          }
        } else {
          setPostError("Post not found. It may have been deleted.")
        }
      } catch (error) {
        console.error("Failed to load post for editing:", error)
        setPostError("Failed to load post for editing.")
      } finally {
        setLoadingEdit(false)
      }
    }
    loadPost()
  }, [editPostId])

  async function uploadReferenceFile(file: File) {
    setUploadingReference(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/instagram/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setReferenceImage(data.imageUrl)
      setImageModel("fal-ai/gpt-image-1.5")
      setGeneratedImage(null)
    } catch {
      alert("Failed to upload reference image")
    } finally {
      setUploadingReference(false)
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
    if (!customPrompt.trim() && !referenceImage) return

    setGenerating(true)
    setGeneratedImage(null)
    try {
      const res = await fetch("/api/instagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          referenceImage
            ? { prompt: customPrompt, referenceImageUrl: referenceImage, model: imageModel, referenceStrength: referencePreset, realismMode: activeRealismChips.size > 0 }
            : { prompt: customPrompt, model: imageModel },
        ),
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

  async function applyTemplateBlocks(blocks: CanvasBlock[]) {
    // If no image yet, create a blank white canvas as placeholder
    if (!selectedImage) {
      const canvas = document.createElement("canvas")
      canvas.width = 1080
      canvas.height = 1080
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 1080, 1080)
      const blankDataUrl = canvas.toDataURL("image/png")
      const blob = await (await fetch(blankDataUrl)).blob()
      const file = new File([blob], "blank.png", { type: "image/png" })
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/instagram/upload", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) throw new Error("Failed to create canvas")
      const uploadData = await uploadRes.json()
      setSelectedImage(uploadData.imageUrl)
      setCarouselImages([uploadData.imageUrl])
    }
    const idx = selectedImage ? carouselIndex : 0
    setOverlayBlocksMap((prev) => ({ ...prev, [idx]: blocks }))
    setEditingTextIndex(idx)
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
        } catch { /* Response wasn't JSON */ }
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

  function applyUploadedUrl(url: string) {
    if (addingMore) {
      setCarouselImages((prev) => [...prev, url])
      setCarouselIndex(carouselImages.length)
      setAddingMore(false)
    } else {
      setSelectedImage(url)
      setCarouselImages([url])
      setCarouselIndex(0)
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      // Use signed URL upload — file goes directly from browser to Supabase,
      // bypassing Vercel's 4.5MB request body limit
      const { url, isVideo } = await uploadViaSigned(file)
      // Videos skip the cropper, images show it
      if (isVideo) {
        applyUploadedUrl(url)
        // Generate thumbnail in background (don't block the UI)
        generateVideoThumbnail(url).then((thumb) => {
          if (thumb) setThumbnailUrl(thumb)
        })
      } else {
        setPendingCropUrl(url)
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setUploading(false)
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
    // Re-index overlay blocks and original URLs to match shifted carousel
    setOverlayBlocksMap((prev) => {
      const next: Record<number, CanvasBlock[]> = {}
      for (const [key, val] of Object.entries(prev)) {
        const k = Number(key)
        if (k < index) next[k] = val
        else if (k > index) next[k - 1] = val
        // k === index is dropped (removed image)
      }
      return next
    })
    setOriginalImageUrls((prev) => prev.filter((_, i) => i !== index))
    if (updated.length === 0) {
      setSelectedImage(null)
      setCarouselIndex(0)
    } else {
      setSelectedImage(updated[0])
      setCarouselIndex(Math.min(carouselIndex, updated.length - 1))
    }
  }

  async function generateCaptions() {
    const base = caption.trim() || customPrompt.trim() || "a photo for our brand Lattify"
    const context = captionContext.trim() ? `${base}\n\nAdditional instructions: ${captionContext.trim()}` : base
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
      // If editor is open, auto-export before saving
      exportedImageUrlRef.current = null
      if (editingTextIndex !== null && editorRef.current) {
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
      // Use the freshly exported image URL if available (state updates are async so we can't rely on them)
      const freshImage = exportedImageUrlRef.current
      const finalImages = freshImage
        ? carouselImages.map((img, i) => (i === (editingTextIndex ?? carouselIndex) ? freshImage : img))
        : [...carouselImages]
      const finalSelectedImage = freshImage || carouselImages[0] || selectedImage

      // If there's a video with audio, mux them into a single file
      let finalAudioUrl = audioUrl
      const primaryImage = finalImages[0] || finalSelectedImage
      if (audioUrl && isVideoUrl(primaryImage)) {
        try {
          const { muxVideoAudio } = await import("@/lib/mux-video")
          const muxedBlob = await muxVideoAudio(primaryImage, audioUrl)
          const muxedFile = new File([muxedBlob], "muxed.mp4", { type: "video/mp4" })
          const { url: muxedUrl } = await uploadViaSigned(muxedFile)
          finalImages[0] = muxedUrl
          finalAudioUrl = null
        } catch (muxErr) {
          console.error("Failed to mux video+audio:", muxErr)
          setPostError("Failed to combine video and audio. Saving without audio embedded.")
          // Fall through — save with separate audio as fallback
        }
      }

      const isEdit = !!editPostId
      const res = await fetch("/api/instagram/posts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                id: editPostId,
                image_url: finalImages[0] || finalSelectedImage,
                caption,
                carousel_images: finalImages.length > 1 ? finalImages : [],
                overlay_blocks: Object.keys(overlayBlocksMap).length > 0 ? overlayBlocksMap : null,
                original_image_url: originalImageUrls.length > 0 ? JSON.stringify(originalImageUrls) : null,
                audio_url: finalAudioUrl,
                thumbnail_url: thumbnailUrl,
              }
            : {
                image_url: finalImages[0] || finalSelectedImage,
                caption,
                likes_count: Math.floor(Math.random() * 30) + 10,
                comments_count: Math.floor(Math.random() * 5) + 1,
                carousel_images: finalImages.length > 1 ? finalImages : [],
                overlay_blocks: Object.keys(overlayBlocksMap).length > 0 ? overlayBlocksMap : null,
                original_image_url: originalImageUrls.length > 0 ? JSON.stringify(originalImageUrls) : null,
                audio_url: finalAudioUrl,
                thumbnail_url: thumbnailUrl,
              }
        ),
      })

      if (res.ok) {
        router.push("/")
      } else {
        setPostError(`Failed to ${isEdit ? "update" : "create"} post. Please try again.`)
      }
    } catch (error) {
      console.error("Failed to save post:", error)
      setPostError(`Failed to ${editPostId ? "update" : "create"} post. Please try again.`)
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
        <span className="font-semibold">{editPostId ? "Edit Post" : "New Post"}</span>
        <div className="w-16" />
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {loadingEdit ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
        <>
        {/* Image cropper — shown after uploading a non-square image */}
        {pendingCropUrl && (
          <div className="mb-6 max-w-md mx-auto">
            <ImageCropper
              imageUrl={pendingCropUrl}
              onCrop={async (croppedDataUrl) => {
                // Convert data URL to blob and upload
                try {
                  setUploading(true)
                  const res = await fetch(croppedDataUrl)
                  const blob = await res.blob()
                  const file = new File([blob], "cropped.png", { type: "image/png" })
                  const { url } = await uploadViaSigned(file)

                  // If we already have a selected image, this is a reposition — replace in-place
                  if (selectedImage && carouselImages.length > 0) {
                    const idx = carouselIndex
                    setCarouselImages((prev) => prev.map((img, i) => (i === idx ? url : img)))
                    if (idx === 0) setSelectedImage(url)
                  } else {
                    applyUploadedUrl(url)
                  }
                  setPendingCropUrl(null)
                } catch (error) {
                  console.error("Failed to upload cropped image:", error)
                  alert("Failed to upload cropped image. Please try again.")
                } finally {
                  setUploading(false)
                }
              }}
              onCancel={() => {
                // Skip — if repositioning, just close. If new upload, use original as-is.
                if (!selectedImage || carouselImages.length === 0) {
                  applyUploadedUrl(pendingCropUrl)
                }
                setPendingCropUrl(null)
              }}
            />
            {uploading && (
              <div className="flex items-center justify-center mt-3 gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading cropped image...
              </div>
            )}
          </div>
        )}

        {/* Selected image preview + caption */}
        {selectedImage && !addingMore && !pendingCropUrl && (
          <div className="mb-6">
            {editingTextIndex !== null ? (
              <div className="max-w-md mx-auto">
                <TextOverlayEditor
                  ref={editorRef}
                  imageUrl={originalImageUrls[editingTextIndex] || carouselImages[editingTextIndex] || selectedImage}
                  initialBlocks={overlayBlocksMap[editingTextIndex]}
                  onExport={async (dataUrl, blocks) => {
                    // Capture index before any async work (avoid stale closure)
                    const idx = editingTextIndex!
                    setExportingOverlay(true)
                    try {
                      // Save the original (clean) image URL before first overlay
                      if (!originalImageUrls[idx]) {
                        setOriginalImageUrls((prev) => {
                          const next = [...prev]
                          next[idx] = carouselImages[idx] || selectedImage || ""
                          return next
                        })
                      }
                      // Save the overlay blocks for this image index
                      // Filter out image blocks — their data URLs are too large for JSON storage
                      // and they're already baked into the exported PNG
                      const persistableBlocks = blocks.filter((b) => b.type !== "image")
                      setOverlayBlocksMap((prev) => ({ ...prev, [idx]: persistableBlocks }))

                      const res = await fetch(dataUrl)
                      const blob = await res.blob()
                      const file = new File([blob], "text-overlay.png", { type: "image/png" })
                      const { url: uploadedUrl } = await uploadViaSigned(file)
                      setCarouselImages((prev) => prev.map((img, i) => (i === idx ? uploadedUrl : img)))
                      if (idx === 0) setSelectedImage(uploadedUrl)
                      // Store exported URL in ref so createPost can read it immediately (state updates are async)
                      exportedImageUrlRef.current = uploadedUrl
                      setEditingTextIndex(null)
                    } catch (error) {
                      console.error("Failed to export text overlay:", error)
                      alert("Failed to save image with text. Please try again.")
                    } finally {
                      setExportingOverlay(false)
                      // Resolve any pending save-post promise
                      if (editorExportResolveRef.current) {
                        editorExportResolveRef.current()
                        editorExportResolveRef.current = null
                      }
                    }
                  }}
                />
              </div>
            ) : (
            <>
            {/* Carousel viewer */}
            <div className="aspect-square max-w-md mx-auto relative bg-neutral-100 rounded-lg overflow-hidden">
              {isVideoUrl(carouselImages[carouselIndex] || selectedImage || "") ? (
                <video
                  src={carouselImages[carouselIndex] || selectedImage || ""}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    const dur = (e.target as HTMLVideoElement).duration
                    if (dur && isFinite(dur)) {
                      setVideoDuration(Math.round(dur))
                      // Auto-set music duration to match video length (pick closest option)
                      const options = [10, 15, 30, 60, 120, 180, 300]
                      const closest = options.reduce((prev, curr) =>
                        Math.abs(curr - dur) < Math.abs(prev - dur) ? curr : prev
                      )
                      setMusicDuration(closest)
                    }
                  }}
                />
              ) : (
                <Image src={carouselImages[carouselIndex] || selectedImage} alt="Selected" fill className="object-cover" unoptimized />
              )}
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
                    {isVideoUrl(img) ? (
                      <>
                        <video src={img} muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <Image src={img} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    )}
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

            {/* Edit / Reposition buttons */}
            <div className="max-w-md mx-auto mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTextIndex(carouselIndex)}
                className="flex-1"
              >
                <Type className="w-4 h-4 mr-1.5" />
                Edit Image
              </Button>
              {!isVideoUrl(carouselImages[carouselIndex] || selectedImage || "") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Use the original (un-overlayed) image if available, otherwise current
                    const imgUrl = originalImageUrls[carouselIndex] || carouselImages[carouselIndex] || selectedImage || ""
                    setPendingCropUrl(imgUrl)
                  }}
                  className="flex-1"
                >
                  <Crop className="w-4 h-4 mr-1.5" />
                  Reposition
                </Button>
              )}
            </div>
            </>
            )}

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

                    <Textarea
                      value={captionContext}
                      onChange={(e) => setCaptionContext(e.target.value)}
                      placeholder="Any extra instructions? e.g. 'mention training', 'keep it under 2 lines', 'sound urgent'..."
                      className="mb-3 min-h-[60px] text-sm resize-none"
                    />

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

              {/* Music */}
              <div className="mt-4 border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowMusic(!showMusic)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Music className="w-4 h-4" />
                  {audioUrl ? "Music added" : "Add music"}
                  {audioUrl && <span className="ml-auto text-xs text-emerald-600">●</span>}
                </button>

                {showMusic && (
                  <div className="px-3 pb-3 border-t border-neutral-100 pt-3 space-y-3">
                    {audioUrl ? (
                      <div className="space-y-2">
                        {trimming ? (
                          <AudioTrimmer
                            audioUrl={audioUrl}
                            onSave={(newUrl) => {
                              setAudioUrl(newUrl)
                              setTrimming(false)
                            }}
                            onCancel={() => setTrimming(false)}
                          />
                        ) : (
                          <>
                            <audio src={audioUrl} controls className="w-full h-10" />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => setTrimming(true)}
                              >
                                <Scissors className="w-3.5 h-3.5 mr-1" />
                                Trim
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => setAudioUrl(null)}
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                Remix
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => {
                                  setAudioUrl(null)
                                  setMusicPrompt("")
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {MUSIC_STYLES.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => {
                                const next = new Set(activeMusicStyles)
                                if (next.has(style.id)) next.delete(style.id)
                                else next.add(style.id)
                                setActiveMusicStyles(next)
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                activeMusicStyles.has(style.id)
                                  ? "bg-neutral-900 text-white"
                                  : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                          placeholder="Add details... e.g. 'upbeat energy, good for a product launch video'"
                          className="min-h-[60px] text-sm resize-none"
                        />
                        <button
                          onClick={async () => {
                            setGeneratingMusicPrompt(true)
                            try {
                              const selectedStyles = MUSIC_STYLES.filter((s) => activeMusicStyles.has(s.id)).map((s) => s.label)
                              const res = await fetch("/api/instagram/music-prompt", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ description: musicPrompt, styles: selectedStyles }),
                              })
                              if (!res.ok) throw new Error("Failed to generate prompt")
                              const data = await res.json()
                              setMusicPrompt(data.prompt)
                            } catch {
                              alert("Failed to generate music prompt")
                            } finally {
                              setGeneratingMusicPrompt(false)
                            }
                          }}
                          disabled={generatingMusicPrompt || (!musicPrompt.trim() && activeMusicStyles.size === 0)}
                          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-40"
                        >
                          {generatingMusicPrompt ? (
                            <><Loader2 className="w-3 h-3 animate-spin" />Writing prompt...</>
                          ) : (
                            <><Wand2 className="w-3 h-3" />Help me write a better prompt</>
                          )}
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <label className="text-xs text-neutral-500 whitespace-nowrap">Duration</label>
                            <select
                              value={musicDuration}
                              onChange={(e) => setMusicDuration(Number(e.target.value))}
                              className="text-xs border border-neutral-200 rounded-md px-2 py-1.5 bg-white"
                            >
                              <option value={10}>10s</option>
                              <option value={15}>15s</option>
                              <option value={30}>30s</option>
                              <option value={60}>1 min</option>
                              <option value={120}>2 min</option>
                              <option value={180}>3 min</option>
                              <option value={300}>5 min</option>
                            </select>
                            {videoDuration && (
                              <span className="text-xs text-neutral-400">
                                Video: {videoDuration}s
                              </span>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={musicInstrumental}
                              onChange={(e) => setMusicInstrumental(e.target.checked)}
                              className="rounded"
                            />
                            Instrumental
                          </label>
                        </div>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const styleParts = MUSIC_STYLES.filter((s) => activeMusicStyles.has(s.id)).map((s) => s.prompt)
                            const fullPrompt = [...styleParts, musicPrompt.trim()].filter(Boolean).join(". ")
                            if (!fullPrompt) return
                            setGeneratingMusic(true)
                            try {
                              const res = await fetch("/api/instagram/music", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  prompt: fullPrompt,
                                  duration_seconds: musicDuration,
                                  instrumental: musicInstrumental,
                                }),
                              })
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}))
                                throw new Error(err.error || "Music generation failed")
                              }
                              const data = await res.json()
                              setAudioUrl(data.audioUrl)
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "Music generation failed")
                            } finally {
                              setGeneratingMusic(false)
                            }
                          }}
                          disabled={generatingMusic || (!musicPrompt.trim() && activeMusicStyles.size === 0)}
                          className="w-full"
                        >
                          {generatingMusic ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Generating music...
                            </>
                          ) : (
                            <>
                              <Music className="w-3.5 h-3.5 mr-1.5" />
                              Generate Music
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={createPost}
                disabled={posting || exportingOverlay}
                className="w-full mt-3 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold"
              >
                {exportingOverlay ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving image...
                  </>
                ) : posting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editPostId ? "Saving..." : "Sharing..."}
                  </>
                ) : (
                  editPostId ? "Save Changes" : "Share"
                )}
              </Button>
              {postError && <p className="text-sm text-red-500 mt-2 text-center">{postError}</p>}

              <button
                onClick={() => {
                  setSelectedImage(null)
                  setCarouselImages([])
                  setCarouselIndex(0)
                  setOverlayBlocksMap({})
                  setOriginalImageUrls([])
                }}
                className="w-full mt-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Choose a different image
              </button>
            </div>
          </div>
        )}

        {/* Image source — show when no image selected or adding more to carousel */}
        {(!selectedImage || addingMore) && !pendingCropUrl && (
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
                variant={activeTab === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("upload")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                variant={activeTab === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("url")}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Image URL
              </Button>
              <Button
                variant={activeTab === "template" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("template")}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>

            {activeTab === "upload" ? (
              <div>
                <p className="text-sm text-neutral-500 mb-3">Upload an image from your device</p>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-neutral-400 transition-colors">
                  {uploading ? (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">Click to choose a file</span>
                      <span className="text-xs text-neutral-400">JPEG, PNG, WebP, GIF, MP4, MOV, WebM</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                      e.target.value = ""
                    }}
                  />
                </label>
              </div>
            ) : activeTab === "template" ? (
              <div className="space-y-4">
                {/* Pre-made templates */}
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">Quick start</p>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => applyPresetTemplate(tpl.id)}
                        className="border border-neutral-200 rounded-lg hover:border-neutral-400 overflow-hidden transition-colors"
                      >
                        <div className="aspect-square">
                          <TemplateThumbnail blocks={tpl.blocks} />
                        </div>
                        <div className="p-1.5">
                          <span className="text-[11px] font-medium text-neutral-700 block truncate">{tpl.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI generate */}
                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Or describe your own</p>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Bold announcement with headline and call to action..."
                  className="mb-3 min-h-[100px]"
                />
                <Button
                  onClick={generateTemplate}
                  disabled={generatingTemplate || !customPrompt.trim()}
                  className="w-full"
                >
                  {generatingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
                </div>
              </div>
            ) : activeTab === "url" ? (
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
                    <p className="text-sm text-neutral-500 mb-3">
                      {referenceImage ? "Describe how to transform the reference" : "Describe the image you want"}
                    </p>

                    {/* Reference image toggle */}
                    <div className="mb-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Reference image</span>
                        {referenceImage && (
                          <button
                            onClick={() => { setReferenceImage(null); setImageModel("fal-ai/nano-banana-2"); setGeneratedImage(null) }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {referenceImage ? (
                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-neutral-100">
                          <Image src={referenceImage} alt="Reference" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <label
                          className={`flex items-center justify-center h-20 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                            dragOverRef ? "border-blue-400 bg-blue-50" : "border-neutral-300 hover:border-neutral-400"
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setDragOverRef(true) }}
                          onDragLeave={() => setDragOverRef(false)}
                          onDrop={async (e) => {
                            e.preventDefault()
                            setDragOverRef(false)
                            const file = e.dataTransfer.files?.[0]
                            if (file) await uploadReferenceFile(file)
                          }}
                        >
                          {uploadingReference ? (
                            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                          ) : (
                            <span className="text-xs text-neutral-400">
                              {dragOverRef ? "Drop image here" : "Drag & drop or click to upload"}
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={uploadingReference}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              e.target.value = ""
                              await uploadReferenceFile(file)
                            }}
                          />
                        </label>
                      )}
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        {referenceImage
                          ? "AI will use this as inspiration — choose how closely it should follow the original"
                          : "Optional — upload a photo and the AI will transform it instead of generating from scratch"}
                      </p>
                      {referenceImage && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {([
                            { value: "same-vibe", label: "Same vibe" },
                            { value: "close", label: "Close match" },
                          ] as const).map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setReferencePreset(preset.value)}
                              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                                referencePreset === preset.value
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model picker */}
                    <select
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full mb-3 px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white"
                    >
                      {referenceImage ? (
                        <>
                          <option value="fal-ai/gpt-image-1.5">GPT Image 1.5</option>
                          <option value="fal-ai/nano-banana-2">Nano Banana 2</option>
                        </>
                      ) : (
                        <>
                          <option value="fal-ai/nano-banana-2">Nano Banana 2</option>
                          <option value="fal-ai/gpt-image-1.5">GPT Image 1.5</option>
                          <option value="fal-ai/flux/dev">FLUX Dev</option>
                        </>
                      )}
                    </select>

                    {/* Add Realism chips */}
                    <div className="mb-3">
                      <span className="text-xs font-medium text-neutral-500 mb-1.5 block">Add realism</span>
                      <div className="flex flex-wrap gap-1.5">
                        {REALISM_CHIPS.map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => toggleRealismChip(chip.id)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                              activeRealismChips.has(chip.id)
                                ? "bg-black text-white border-black"
                                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={referenceImage
                        ? "Make it look unglamorous, fluorescent lighting, slightly out of focus..."
                        : "A flat white coffee on a marble counter, morning light, minimal aesthetic..."}
                      className="mb-3 min-h-[100px]"
                    />
                    <Button onClick={generateImage} disabled={generating || (!customPrompt.trim() && !referenceImage)} className="w-full">
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
                        onClick={generateImage}
                        disabled={generating}
                        className="flex-1"
                      >
                        {generating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Regenerate
                      </Button>
                      <Button
                        onClick={useGeneratedImage}
                        disabled={generating}
                        className="flex-1 bg-[#0095f6] hover:bg-[#1877f2] text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                      </Button>
                    </div>

                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Edit prompt
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
    </div>
  )
}
