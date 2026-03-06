"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Grid3X3,
  UserSquare2,
  Settings,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  ChevronLeft,
  Plus,
  Trash2,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { VerifiedBadge } from "@/components/verified-badge"

interface InstagramPost {
  id: string
  image_url: string | null
  caption: string | null
  likes_count: number
  comments_count: number
  posted_at: string
  display_order: number
}

interface Profile {
  username: string
  bio: string
  followers: string
  following: string
  posts_count: string
  avatarUrl: string | null
  isVerified: boolean
}

interface StoryHighlight {
  title: string
  image: string | null
}

export default function InstagramPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>([
    { title: "S01", image: null },
    { title: "Materials", image: null },
    { title: "Process", image: null },
    { title: "Archive", image: null },
  ])
  const [profile, setProfile] = useState<Profile>({
    username: "firstrun",
    bio: "Classic athletic silhouettes. Obsessive finishing.\nSeason 01 now available.",
    followers: "2,847",
    following: "127",
    posts_count: "12",
    avatarUrl: null,
    isVerified: false,
  })
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState("")
  const [editValue, setEditValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const postsRes = await fetch("/api/instagram/posts")
      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts || [])
      }

      const productsRes = await fetch("/api/products")
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const products = productsData.products || []

        const highlightImages: StoryHighlight[] = []

        const product1 = products[0]
        highlightImages.push({
          title: "S01",
          image: product1?.specs?.colorways?.[0]?.images?.macroDetail || null,
        })

        const product2 = products[1]
        highlightImages.push({
          title: "Materials",
          image: product2?.specs?.colorways?.[0]?.images?.onBody || null,
        })

        const product3 = products[2]
        highlightImages.push({
          title: "Process",
          image: product3?.specs?.colorways?.[1]?.images?.hero || null,
        })

        const product4 = products[3]
        highlightImages.push({
          title: "Archive",
          image: product4?.specs?.colorways?.[0]?.images?.macroDetail || null,
        })

        setStoryHighlights(highlightImages)
      }

      const profileRes = await fetch(
        "/api/site-settings?keys=instagram_username,instagram_bio,instagram_followers,instagram_following,instagram_posts_count,instagram_avatar,instagram_is_verified",
      )
      if (profileRes.ok) {
        const data = await profileRes.json()
        if (data.settings) {
          setProfile((prev) => ({
            ...prev,
            username: data.settings.instagram_username || prev.username,
            bio: data.settings.instagram_bio || prev.bio,
            followers: data.settings.instagram_followers || prev.followers,
            following: data.settings.instagram_following || prev.following,
            posts_count: data.settings.instagram_posts_count || String(posts.length),
            avatarUrl: data.settings.instagram_avatar || null,
            isVerified: data.settings.instagram_is_verified || false,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to load Instagram data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveAvatar(imageUrl: string) {
    try {
      await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "instagram_avatar", value: imageUrl }),
      })
      setProfile((prev) => ({ ...prev, avatarUrl: imageUrl }))
      setShowAvatarPicker(false)
    } catch (error) {
      console.error("Failed to save avatar:", error)
    }
  }

  async function saveField(field: string, value: string) {
    try {
      await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: `instagram_${field}`, value }),
      })
      setProfile({ ...profile, [field]: value })
      setEditingField(null)
    } catch (error) {
      console.error("Failed to save:", error)
    }
  }

  async function saveCaption() {
    if (!selectedPost) return
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPost.id, caption: editCaption }),
      })
      setPosts(posts.map((p) => (p.id === selectedPost.id ? { ...p, caption: editCaption } : p)))
      setSelectedPost({ ...selectedPost, caption: editCaption })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save caption:", error)
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return
    try {
      await fetch(`/api/instagram/posts?id=${id}`, { method: "DELETE" })
      setPosts(posts.filter((p) => p.id !== id))
      setSelectedPost(null)
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  function startEditing(field: string, currentValue: string) {
    setEditingField(field)
    setEditValue(currentValue)
  }

  function openPost(post: InstagramPost) {
    setSelectedPost(post)
    setEditCaption(post.caption || "")
    setIsEditing(false)
  }

  function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return `${diffWeeks}w`
  }

  function EditableField({ field, value, label }: { field: string; value: string; label?: string }) {
    if (editingField === field) {
      return (
        <div className="inline-flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 w-20 text-sm px-1"
            autoFocus
          />
          <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => saveField(field, editValue)}>
            ✓
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditingField(null)}>
            ✕
          </Button>
        </div>
      )
    }
    return (
      <span
        className="cursor-pointer hover:bg-neutral-100 px-1 -mx-1 rounded"
        onClick={() => startEditing(field, value)}
        title="Click to edit"
      >
        {label ? (
          <>
            <strong>{value}</strong> {label}
          </>
        ) : (
          <strong>{value}</strong>
        )}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between md:hidden">
        <button onClick={() => router.back()} className="p-1 -m-1 active:bg-neutral-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1">
          {editingField === "username" ? (
            <div className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-6 w-20 text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => saveField("username", editValue)}>
                ✓
              </Button>
            </div>
          ) : (
            <span className="font-semibold cursor-pointer" onClick={() => startEditing("username", profile.username)}>
              {profile.username}
              {profile.isVerified && <VerifiedBadge />}
            </span>
          )}
        </div>
        <MoreHorizontal className="w-6 h-6" />
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-[935px] mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            FIRST RUN
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/instagram/new" className="text-sm font-medium">
              New Post
            </Link>
            <Settings className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
      </header>

      <main className="max-w-[935px] mx-auto">
        {/* Profile Header */}
        <div className="px-4 py-6 md:py-10 md:px-0">
          <div className="flex items-start gap-6 md:gap-20">
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group w-20 h-20 md:w-36 md:h-36 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl || "/placeholder.svg"}
                    alt="Profile"
                    width={144}
                    height={144}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-2xl md:text-4xl font-bold tracking-tighter">FR</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {/* Username row */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {editingField === "username" ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 w-32 text-xl"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => saveField("username", editValue)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <h1
                    className="text-xl font-normal cursor-pointer hover:bg-neutral-50 px-1 -mx-1 rounded"
                    onClick={() => startEditing("username", profile.username)}
                  >
                    {profile.username}
                    {profile.isVerified && <VerifiedBadge />}
                  </h1>
                )}
                <Button
                  size="sm"
                  className="ml-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-sm font-semibold px-4"
                >
                  Following
                </Button>
                <Button size="sm" variant="outline" className="text-sm font-semibold px-4 bg-transparent">
                  Message
                </Button>
              </div>

              {/* Stats row - desktop - all editable */}
              <div className="hidden md:flex items-center gap-8 mb-4">
                <span>
                  <strong>{posts.length || profile.posts_count}</strong> posts
                </span>
                <EditableField field="followers" value={profile.followers} label="followers" />
                <EditableField field="following" value={profile.following} label="following" />
              </div>

              {/* Bio - desktop */}
              <div className="hidden md:block">
                <p className="font-semibold text-sm">FIRST RUN</p>
                {editingField === "bio" ? (
                  <div className="mt-1">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveField("bio", editValue)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-sm whitespace-pre-line mt-1 cursor-pointer hover:bg-neutral-50 p-1 -m-1 rounded"
                    onClick={() => startEditing("bio", profile.bio)}
                  >
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bio - mobile */}
          <div className="mt-4 md:hidden">
            <p className="font-semibold text-sm">FIRST RUN</p>
            {editingField === "bio" ? (
              <div className="mt-1">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-sm min-h-[60px]"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => saveField("bio", editValue)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm whitespace-pre-line mt-1 cursor-pointer"
                onClick={() => startEditing("bio", profile.bio)}
              >
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats row - mobile - all editable */}
          <div className="flex items-center justify-around py-3 border-t border-neutral-200 mt-4 md:hidden">
            <div className="text-center">
              <p className="font-semibold">{posts.length || profile.posts_count}</p>
              <p className="text-xs text-neutral-500">posts</p>
            </div>
            <div className="text-center cursor-pointer" onClick={() => startEditing("followers", profile.followers)}>
              <p className="font-semibold">{profile.followers}</p>
              <p className="text-xs text-neutral-500">followers</p>
            </div>
            <div className="text-center cursor-pointer" onClick={() => startEditing("following", profile.following)}>
              <p className="font-semibold">{profile.following}</p>
              <p className="text-xs text-neutral-500">following</p>
            </div>
          </div>

          {/* Story Highlights - now with product images */}
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2 md:mt-6">
            {storyHighlights.map((highlight) => (
              <div key={highlight.title} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {highlight.image ? (
                    <Image
                      src={highlight.image || "/placeholder.svg"}
                      alt={highlight.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-medium">{highlight.title}</span>
                  )}
                </div>
                <span className="text-xs">{highlight.title}</span>
              </div>
            ))}
            <Link href="/instagram/new" className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-neutral-200 border-dashed bg-neutral-50 flex items-center justify-center">
                <Plus className="w-6 h-6 text-neutral-400" />
              </div>
              <span className="text-xs">New</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-neutral-200">
          <div className="flex justify-center gap-12">
            <button className="flex items-center gap-1 py-3 border-t border-neutral-900 -mt-px">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider hidden md:inline">Posts</span>
            </button>
            <button className="flex items-center gap-1 py-3 text-neutral-400">
              <UserSquare2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider hidden md:inline">Tagged</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 mb-4">No posts yet</p>
            <Link href="/instagram/new">
              <Button>Create First Post</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => openPost(post)}
                className="aspect-square relative group overflow-hidden bg-neutral-100"
              >
                {post.image_url ? (
                  <Image
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || "Post"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400 text-xs">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                  <span className="flex items-center gap-1">
                    <Heart className="w-5 h-5 fill-white" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    {post.comments_count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Post Modal - Instagram style */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent
          className="!max-w-5xl !w-[95vw] !p-0 !gap-0 overflow-hidden bg-white border-0 rounded-none md:rounded-lg"
          showCloseButton={false}
        >
          {selectedPost && (
            <div className="flex flex-col md:flex-row h-auto md:h-[90vh] md:max-h-[600px]">
              {/* Left: Square image */}
              <div className="relative w-full md:w-[600px] aspect-square flex-shrink-0 bg-black">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
                {selectedPost.image_url ? (
                  <Image
                    src={selectedPost.image_url || "/placeholder.svg"}
                    alt={selectedPost.caption || "Post"}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400">No image</span>
                  </div>
                )}
              </div>

              {/* Right: Comment panel - exact IG layout */}
              <div className="flex flex-col w-full md:w-[335px] md:min-w-[335px] h-full">
                {/* Header */}
                <div className="flex items-center gap-3 p-3 border-b border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl || "/placeholder.svg"}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">FR</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{profile.username}</span>
                  {profile.isVerified && <VerifiedBadge />}
                  <button className="ml-auto">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Caption/Comments area - scrollable */}
                <div className="flex-1 overflow-y-auto p-3">
                  {/* Caption as first "comment" */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl || "/placeholder.svg"}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">FR</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div>
                          <Textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            className="text-sm min-h-[80px] mb-2"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveCaption}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">
                            <span className="font-semibold mr-1">{profile.username}</span>
                            {selectedPost.caption}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">{formatTimeAgo(selectedPost.posted_at)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <Heart className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                      <MessageCircle className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                      <Send className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                    </div>
                    <Trash2 className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                  </div>
                  <p className="font-semibold text-sm">{selectedPost.likes_count.toLocaleString()} likes</p>
                  <p className="text-[10px] text-neutral-400 uppercase mt-1">
                    {formatTimeAgo(selectedPost.posted_at)} ago
                  </p>
                </div>

                {/* Comment input */}
                <div className="border-t border-neutral-200 p-3 flex items-center gap-3">
                  <input type="text" placeholder="Add a comment..." className="flex-1 text-sm outline-none" disabled />
                  <span className="text-sm font-semibold text-blue-500/50">Post</span>
                </div>

                {/* Edit/Delete controls */}
                <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                    Edit Caption
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePost(selectedPost.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Avatar Picker Modal */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="!max-w-lg !p-0 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-center">Choose Profile Photo</h2>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-neutral-500 mb-4">Select from your posts:</p>
            <div className="grid grid-cols-3 gap-2">
              {posts
                .filter((p) => p.image_url)
                .map((post) => (
                  <button
                    key={post.id}
                    onClick={() => saveAvatar(post.image_url!)}
                    className={`aspect-square relative overflow-hidden rounded-full border-2 transition-all ${
                      profile.avatarUrl === post.image_url
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                  >
                    <Image src={post.image_url! || "/placeholder.svg"} alt="" fill className="object-cover" />
                    {profile.avatarUrl === post.image_url && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
          <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAvatarPicker(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
