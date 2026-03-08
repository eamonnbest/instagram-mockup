"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Trash2, Copy, Megaphone, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Ad {
  id: string
  placement: string
  aspect_ratio: string
  image_url: string | null
  primary_text: string | null
  headline: string | null
  cta_type: string
  campaign_name: string | null
  status: string
  created_at: string
  tags: string[]
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500",
  ready: "bg-green-500",
  exported: "bg-blue-500",
}

const PLACEMENT_LABELS: Record<string, string> = {
  feed: "Feed",
  stories: "Stories",
  reels: "Reels",
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  const loadAds = useCallback(async function loadAds() {
    try {
      const res = await fetch("/api/instagram/ads")
      if (res.ok) {
        const data = await res.json()
        setAds(data.ads || [])
      }
    } catch (error) {
      console.error("Failed to load ads:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  async function deleteAd(id: string) {
    if (!confirm("Delete this ad creative?")) return
    try {
      const res = await fetch(`/api/instagram/ads?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setAds((prev) => prev.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete ad:", error)
    }
  }

  async function duplicateAd(ad: Ad) {
    try {
      const res = await fetch("/api/instagram/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: ad.placement,
          aspect_ratio: ad.aspect_ratio,
          image_url: ad.image_url,
          primary_text: ad.primary_text,
          headline: ad.headline,
          cta_type: ad.cta_type,
          campaign_name: ad.campaign_name,
          tags: ad.tags,
          status: "draft",
        }),
      })
      if (res.ok) {
        loadAds()
      }
    } catch (error) {
      console.error("Failed to duplicate ad:", error)
    }
  }

  // Group ads by campaign
  const campaigns = ads.reduce<Record<string, Ad[]>>((acc, ad) => {
    const key = ad.campaign_name || "Uncategorized"
    if (!acc[key]) acc[key] = []
    acc[key].push(ad)
    return acc
  }, {})

  const campaignNames = Object.keys(campaigns).sort((a, b) => {
    if (a === "Uncategorized") return 1
    if (b === "Uncategorized") return -1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-[935px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-70">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              <h1 className="text-lg font-semibold">Ad Creatives</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-sm font-medium hover:opacity-70">
              Schedule
            </Link>
            <Link href="/new" className="text-sm font-medium hover:opacity-70">
              New Post
            </Link>
            <Link href="/ads/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                New Ad
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[935px] mx-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Megaphone className="w-16 h-16 text-zinc-300" />
            <h2 className="text-xl font-semibold text-zinc-500">No ad creatives yet</h2>
            <p className="text-sm text-zinc-400 text-center max-w-md">
              Create ad creatives for Instagram feed, stories, and reels.
              Test different messaging, visuals, and CTAs.
            </p>
            <Link href="/ads/new">
              <Button className="gap-1.5 mt-2">
                <Plus className="w-4 h-4" />
                Create First Ad
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary stats */}
            <div className="flex gap-6 text-sm text-zinc-500">
              <span><strong className="text-zinc-900">{ads.length}</strong> creatives</span>
              <span><strong className="text-zinc-900">{campaignNames.filter(n => n !== "Uncategorized").length}</strong> campaigns</span>
              <span><strong className="text-zinc-900">{ads.filter(a => a.status === "ready").length}</strong> ready</span>
            </div>

            {/* Grouped by campaign */}
            {campaignNames.map((campaignName) => (
              <div key={campaignName}>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {campaignName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {campaigns[campaignName].map((ad) => (
                    <div key={ad.id} className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Image */}
                      <Link href={`/ads/new?edit=${ad.id}`}>
                        <div className="aspect-square bg-zinc-100 relative">
                          {ad.image_url ? (
                            <Image
                              src={ad.image_url}
                              alt={ad.headline || "Ad creative"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Megaphone className="w-8 h-8 text-zinc-300" />
                            </div>
                          )}
                          {/* Status badge */}
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase text-white ${STATUS_COLORS[ad.status] || "bg-zinc-500"}`}>
                            {ad.status}
                          </div>
                          {/* Placement badge */}
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white">
                            {PLACEMENT_LABELS[ad.placement] || ad.placement}
                          </div>
                        </div>
                      </Link>
                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-sm font-medium truncate">
                          {ad.headline || "Untitled"}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {ad.primary_text || "No copy"}
                        </p>
                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateAd(ad)}
                            className="p-1 rounded hover:bg-zinc-100"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          </button>
                          <button
                            onClick={() => deleteAd(ad.id)}
                            className="p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
