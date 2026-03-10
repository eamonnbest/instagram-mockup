"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Grid3X3,
  Bookmark,
  UserSquare2,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Camera,
  GripVertical,
  Eye,
  EyeOff,
  MessageSquare,
  X,
  ChevronDown,
  Copy,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Palette,
  Download,
  ClipboardCopy,
  Pencil,
  Megaphone,
  Check,
  XCircle,
  RotateCcw,
  Play,
  Loader2,
  Music,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { VerifiedBadge } from "@/components/verified-badge"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { extractColors } from "@/lib/extract-colors"

function isVideoUrl(url: string): boolean {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase()
  return ["mp4", "mov", "webm"].includes(ext || "")
}

interface InstagramPost {
  id: string
  image_url: string | null
  caption: string | null
  likes_count: number
  comments_count: number
  posted_at: string
  display_order: number
  notes: string | null
  tags: string[]
  carousel_images: string[]
  scheduled_for: string | null
  status: "draft" | "approved" | "rejected"
  audio_url: string | null
}

interface NoteEntry {
  author: string
  text: string
  timestamp: string
}

function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Legacy plain-text note — wrap it
    if (raw.trim()) return [{ author: "?", text: raw, timestamp: new Date().toISOString() }]
  }
  return []
}

function serializeNotes(entries: NoteEntry[]): string {
  return JSON.stringify(entries)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
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

function EditableField({
  field,
  value,
  label,
  editingField,
  editValue,
  setEditValue,
  saveField,
  startEditing,
  setEditingField,
}: {
  field: string
  value: string
  label?: string
  editingField: string | null
  editValue: string
  setEditValue: (v: string) => void
  saveField: (field: string, value: string) => void
  startEditing: (field: string, currentValue: string) => void
  setEditingField: (field: string | null) => void
}) {
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

function SortablePost({
  post,
  isReordering,
  onOpen,
  colors,
}: {
  post: InstagramPost
  isReordering: boolean
  onOpen: (post: InstagramPost) => void
  colors?: string[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="aspect-square relative group overflow-hidden bg-neutral-100">
      {isReordering ? (
        <button
          {...attributes}
          {...listeners}
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
        >
          {post.image_url ? (
            post.image_url && isVideoUrl(post.image_url) ? (
              <video src={post.image_url} muted preload="metadata" className="w-full h-full object-cover" />
            ) : (
              <Image src={post.image_url} alt={post.caption || "Post"} fill sizes="33vw" className="object-cover" unoptimized />
            )
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-400 text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <GripVertical className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </button>
      ) : (
        <button onClick={() => onOpen(post)} className="w-full h-full relative">
          {post.image_url ? (
            post.image_url && isVideoUrl(post.image_url) ? (
              <>
                <video src={post.image_url} muted preload="metadata" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <Image src={post.image_url} alt={post.caption || "Post"} fill sizes="33vw" className="object-cover" unoptimized />
            )
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-400 text-xs">No image</span>
            </div>
          )}
          {post.carousel_images?.length > 1 && (
            <div className="absolute top-2 right-2">
              <Copy className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          )}
          {colors && colors.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 flex">
              {colors.map((color, i) => (
                <div
                  key={i}
                  className="flex-1 h-3"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
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
      )}
    </div>
  )
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [isReordering, setIsReordering] = useState(false)
  const [gridPreview, setGridPreview] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    username: "lattify",
    bio: "Welcome to Lattify.\nYour go-to for all things coffee.",
    followers: "0",
    following: "0",
    posts_count: "0",
    avatarUrl: null,
    isVerified: false,
  })
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null)
  const modalAudioRef = useRef<HTMLAudioElement | null>(null)
  const [muxing, setMuxing] = useState(false)
  const [muxProgress, setMuxProgress] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState("")
  const [editValue, setEditValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [noteEntries, setNoteEntries] = useState<NoteEntry[]>([])
  const [newNote, setNewNote] = useState("")
  const [notesOpen, setNotesOpen] = useState(false)
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null)
  const [editingNoteText, setEditingNoteText] = useState("")
  const [noteAuthor, setNoteAuthor] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("note-author") || "E"
    return "E"
  })
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0)
  const [showPalette, setShowPalette] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [postColors, setPostColors] = useState<Record<string, string[]>>({})
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "approved" | "rejected">("all")
  const filteredPosts = useMemo(() => {
    if (statusFilter === "all") return posts
    return posts.filter((p) => p.status === statusFilter)
  }, [posts, statusFilter])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      let loadedPosts: InstagramPost[] = []
      const postsRes = await fetch("/api/instagram/posts")
      if (postsRes.ok) {
        const data = await postsRes.json()
        loadedPosts = data.posts || []
        setPosts(loadedPosts)
      }

      const profileRes = await fetch(
        "/api/site-settings?keys=instagram_username,instagram_bio,instagram_followers,instagram_following,instagram_posts_count,instagram_avatar,instagram_is_verified",
      )
      if (profileRes.ok) {
        const data = await profileRes.json()
        if (data.settings) {
          setProfile((prev) => ({
            ...prev,
            username: data.settings.instagram_username?.replace(/^"|"$/g, "") ?? prev.username,
            bio: data.settings.instagram_bio ?? prev.bio,
            followers: data.settings.instagram_followers?.replace(/^"|"$/g, "") ?? prev.followers,
            following: data.settings.instagram_following?.replace(/^"|"$/g, "") ?? prev.following,
            posts_count: data.settings.instagram_posts_count ?? String(loadedPosts.length),
            avatarUrl: data.settings.instagram_avatar ?? null,
            isVerified: data.settings.instagram_is_verified === "true",
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
      setProfile((prev) => ({ ...prev, [field]: value }))
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
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? { ...p, caption: editCaption } : p)))
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
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setSelectedPost(null)
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  async function downloadWithAudio(videoUrl: string, audioUrl: string) {
    setMuxing(true)
    setMuxProgress("Loading FFmpeg...")
    try {
      const { muxVideoAudio } = await import("@/lib/mux-video")
      const blob = await muxVideoAudio(videoUrl, audioUrl, (msg) => setMuxProgress(msg))
      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "video-with-audio.mp4"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to mux video+audio:", error)
      alert("Failed to combine video and audio. Try downloading them separately.")
    } finally {
      setMuxing(false)
      setMuxProgress("")
    }
  }

  async function updatePostStatus(id: string, status: "draft" | "approved" | "rejected") {
    try {
      const res = await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error("Server returned " + res.status)
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      if (selectedPost?.id === id) setSelectedPost({ ...selectedPost, status })
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  function startEditing(field: string, currentValue: string) {
    setEditingField(field)
    setEditValue(currentValue)
  }

  function openPost(post: InstagramPost) {
    setSelectedPost(post)
    setEditCaption(post.caption || "")
    setNoteEntries(parseNotes(post.notes))
    setNewNote("")
    setNotesOpen(false)
    setEditingNoteIndex(null)
    setEditingNoteText("")
    setModalCarouselIndex(0)
    setIsEditing(false)
  }

  // Unlock audio on mobile: browsers block programmatic play() unless
  // the audio element has been "activated" by a user gesture context.
  // This effect fires when the modal opens (which is itself a tap),
  // so we briefly play+pause to unlock it.
  useEffect(() => {
    const a = modalAudioRef.current
    if (!a || !selectedPost?.audio_url) return
    const unlock = () => {
      a.play().then(() => { a.pause(); a.currentTime = 0 }).catch(() => {})
    }
    // Small delay to ensure the audio element is mounted
    const t = setTimeout(unlock, 100)
    return () => clearTimeout(t)
  }, [selectedPost?.id, selectedPost?.audio_url])

  function changeNoteAuthor(author: string) {
    setNoteAuthor(author)
    localStorage.setItem("note-author", author)
  }

  async function addNote() {
    if (!selectedPost || !newNote.trim()) return
    const entry: NoteEntry = { author: noteAuthor, text: newNote.trim(), timestamp: new Date().toISOString() }
    const updated = [...noteEntries, entry]
    setNoteEntries(updated)
    setNewNote("")
    const serialized = serializeNotes(updated)
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPost.id, notes: serialized }),
      })
      const updatedPost = { ...selectedPost, notes: serialized }
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updatedPost : p)))
      setSelectedPost(updatedPost)
    } catch (error) {
      console.error("Failed to save note:", error)
    }
  }

  async function deleteNote(index: number) {
    if (!selectedPost) return
    // Adjust editing index if deleting a message before or at the one being edited
    if (editingNoteIndex !== null) {
      if (index === editingNoteIndex) { setEditingNoteIndex(null); setEditingNoteText("") }
      else if (index < editingNoteIndex) setEditingNoteIndex(editingNoteIndex - 1)
    }
    const updated = noteEntries.filter((_, i) => i !== index)
    setNoteEntries(updated)
    const serialized = serializeNotes(updated)
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPost.id, notes: serialized }),
      })
      const updatedPost = { ...selectedPost, notes: serialized }
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updatedPost : p)))
      setSelectedPost(updatedPost)
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  async function saveEditedNote() {
    if (!selectedPost || editingNoteIndex === null || !editingNoteText.trim()) return
    const updated = noteEntries.map((entry, i) =>
      i === editingNoteIndex ? { ...entry, text: editingNoteText.trim() } : entry
    )
    setNoteEntries(updated)
    setEditingNoteIndex(null)
    setEditingNoteText("")
    const serialized = serializeNotes(updated)
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPost.id, notes: serialized }),
      })
      const updatedPost = { ...selectedPost, notes: serialized }
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updatedPost : p)))
      setSelectedPost(updatedPost)
    } catch (error) {
      console.error("Failed to edit note:", error)
    }
  }


  const extractAllColors = useCallback(async () => {
    const results: Record<string, string[]> = {}
    await Promise.all(
      posts
        .filter((p) => p.image_url && !postColors[p.id])
        .map(async (p) => {
          const colors = await extractColors(p.image_url!)
          results[p.id] = colors
        })
    )
    if (Object.keys(results).length > 0) {
      setPostColors((prev) => ({ ...prev, ...results }))
    }
  }, [posts, postColors])

  useEffect(() => {
    if (showPalette) {
      extractAllColors()
    }
  }, [showPalette, extractAllColors])

  function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (diffMs < 0) return "scheduled"

    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return `${diffWeeks}w`
  }

  const editableFieldProps = { editingField, editValue, setEditValue, saveField, startEditing, setEditingField }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Reorder within the filtered subset, then splice back into full posts array
    const oldFilteredIndex = filteredPosts.findIndex((p) => p.id === active.id)
    const newFilteredIndex = filteredPosts.findIndex((p) => p.id === over.id)
    const reorderedFiltered = arrayMove(filteredPosts, oldFilteredIndex, newFilteredIndex)

    // Rebuild full posts array: replace filtered posts in their original positions
    const filteredIds = new Set(filteredPosts.map((p) => p.id))
    const reordered: InstagramPost[] = []
    let filteredIdx = 0
    for (const post of posts) {
      if (filteredIds.has(post.id)) {
        reordered.push(reorderedFiltered[filteredIdx++])
      } else {
        reordered.push(post)
      }
    }
    setPosts(reordered)

    // Save new order to Supabase
    try {
      await Promise.all(
        reordered.map((post, i) =>
          fetch("/api/instagram/posts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: post.id, display_order: i }),
          })
        )
      )
    } catch (error) {
      console.error("Failed to save order:", error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5">
          <Image src="/instagram-logo.png" alt="Instagram" width={110} height={32} className="h-7 w-auto" />
          <div className="flex items-center gap-5">
            <Link href="/dms">
              <Send className="w-6 h-6" />
            </Link>
            <Link href="/ads">
              <Megaphone className="w-6 h-6" />
            </Link>
            <Link href="/new">
              <Plus className="w-6 h-6" />
            </Link>
            <Link href="/calendar">
              <Heart className="w-6 h-6" />
            </Link>
          </div>
        </div>
        {/* Desktop header */}
        <div className="hidden md:flex max-w-[935px] mx-auto px-5 py-3 items-center justify-between">
          <Image
            src="/instagram-logo.png"
            alt="Instagram"
            width={110}
            height={32}
            className="object-contain"
            priority
          />
          <div className="flex items-center gap-4">
            <Link href="/dms" className="text-sm font-medium hover:opacity-70">
              DMs
            </Link>
            <Link href="/ads" className="text-sm font-medium hover:opacity-70">
              Ads
            </Link>
            <Link href="/calendar" className="text-sm font-medium hover:opacity-70">
              Schedule
            </Link>
            <Link href="/new" className="text-sm font-medium hover:opacity-70">
              New Post
            </Link>
            <MoreHorizontal className="w-5 h-5 cursor-pointer opacity-50" />
          </div>
        </div>
      </header>

      <main className="max-w-[935px] mx-auto">
        {/* Profile Header */}
        <div className="px-4 pt-2 pb-1 md:pt-6 md:pb-2 md:px-0">
          {/* Mobile profile top row: avatar + stats */}
          <div className="flex items-center gap-5 md:hidden">
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group w-20 h-20 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt="Profile" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl font-bold tracking-tighter text-neutral-400">{profile.username.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-around">
              <div className="text-center">
                <p className="font-semibold text-lg">{posts.length || profile.posts_count}</p>
                <p className="text-xs text-neutral-500">posts</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => startEditing("followers", profile.followers)}>
                <p className="font-semibold text-lg">{profile.followers}</p>
                <p className="text-xs text-neutral-500">followers</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => startEditing("following", profile.following)}>
                <p className="font-semibold text-lg">{profile.following}</p>
                <p className="text-xs text-neutral-500">following</p>
              </div>
            </div>
          </div>

          {/* Mobile bio */}
          <div className="mt-3 md:hidden">
            <p className="font-semibold text-sm">{profile.username}</p>
            {editingField === "bio" ? (
              <div className="mt-1">
                <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm min-h-[60px]" />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => saveField("bio", editValue)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-line mt-0.5 cursor-pointer" onClick={() => startEditing("bio", profile.bio)}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Mobile buttons — full width */}
          <div className="flex gap-1.5 mt-2 md:hidden">
            <Button size="sm" className="flex-1 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-[13px] font-semibold h-8 rounded-lg">
              Following
            </Button>
            <Button size="sm" className="flex-1 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-[13px] font-semibold h-8 rounded-lg">
              Message
            </Button>
          </div>

          {/* Desktop profile layout */}
          <div className="hidden md:flex items-start gap-16">
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group w-36 h-36 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt="Profile" width={144} height={144} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-4xl font-bold tracking-tighter text-neutral-400">{profile.username.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {editingField === "username" ? (
                  <div className="flex items-center gap-1">
                    <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 w-32 text-xl" autoFocus />
                    <Button size="sm" onClick={() => saveField("username", editValue)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
                  </div>
                ) : (
                  <h1
                    className="text-xl font-normal cursor-pointer hover:bg-neutral-50 px-1 -mx-1 rounded"
                    onClick={() => startEditing("username", profile.username)}
                  >
                    {profile.username}
                    {profile.isVerified && <VerifiedBadge className="w-5 h-5 inline ml-1" />}
                  </h1>
                )}
                <Button size="sm" className="ml-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-sm font-semibold px-4">Following</Button>
                <Button size="sm" variant="outline" className="text-sm font-semibold px-4 bg-transparent">Message</Button>
              </div>

              <div className="flex items-center gap-8 mb-4">
                <span><strong>{posts.length || profile.posts_count}</strong> posts</span>
                <EditableField field="followers" value={profile.followers} label="followers" {...editableFieldProps} />
                <EditableField field="following" value={profile.following} label="following" {...editableFieldProps} />
              </div>

              <div>
                <p className="font-semibold text-sm cursor-pointer hover:bg-neutral-50 rounded px-1 -mx-1" onClick={() => startEditing("username", profile.username)}>
                  {profile.username}
                </p>
                {editingField === "bio" ? (
                  <div className="mt-1">
                    <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm min-h-[60px]" />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveField("bio", editValue)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-line mt-1 cursor-pointer hover:bg-neutral-50 p-1 -m-1 rounded" onClick={() => startEditing("bio", profile.bio)}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* New Post shortcut / stories row */}
          <div className="flex gap-4 mt-2 md:mt-6">
            <Link href="/new" className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-neutral-200 border-dashed bg-neutral-50 flex items-center justify-center">
                <Plus className="w-6 h-6 text-neutral-400" />
              </div>
              <span className="text-xs">New</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-neutral-200">
          <div className="flex justify-center gap-16">
            <button className="flex items-center gap-1.5 py-3 border-t border-neutral-900 -mt-px">
              <Grid3X3 className="w-3 h-3" />
              <span className="text-xs font-semibold uppercase tracking-[.2em] hidden md:inline">Posts</span>
            </button>
            <button className="flex items-center gap-1.5 py-3 text-neutral-400">
              <Bookmark className="w-3 h-3" />
              <span className="text-xs font-semibold uppercase tracking-[.2em] hidden md:inline">Saved</span>
            </button>
            <button className="flex items-center gap-1.5 py-3 text-neutral-400">
              <UserSquare2 className="w-3 h-3" />
              <span className="text-xs font-semibold uppercase tracking-[.2em] hidden md:inline">Tagged</span>
            </button>
          </div>
        </div>

        {/* Grid controls */}
        {posts.length > 1 && (
          <div className="flex justify-end gap-2 px-4 py-2">
            <Button
              size="sm"
              variant={gridPreview ? "default" : "outline"}
              onClick={() => {
                setGridPreview(!gridPreview)
                if (!gridPreview) setIsReordering(false)
              }}
              className="text-xs"
            >
              {gridPreview ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              {gridPreview ? "Exit Preview" : "Preview"}
            </Button>
            {!gridPreview && (
              <>
                <Button
                  size="sm"
                  variant={showPalette ? "default" : "outline"}
                  onClick={() => setShowPalette(!showPalette)}
                  className="text-xs"
                >
                  <Palette className="w-3.5 h-3.5 mr-1.5" />
                  {showPalette ? "Hide Colors" : "Colors"}
                </Button>
                <Button
                  size="sm"
                  variant={isReordering ? "default" : "outline"}
                  onClick={() => setIsReordering(!isReordering)}
                  className="text-xs"
                >
                  <GripVertical className="w-3.5 h-3.5 mr-1.5" />
                  {isReordering ? "Done" : "Rearrange"}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Status filter */}
        {!loading && posts.length > 0 && (
          <div className="flex gap-1 px-4 py-2">
            {(["all", "draft", "approved", "rejected"] as const).map((s) => {
              const count = s === "all" ? posts.length : posts.filter((p) => p.status === s).length
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 mb-4">No posts yet</p>
            <Link href="/new">
              <Button>Create First Post</Button>
            </Link>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-400">No {statusFilter} posts</p>
          </div>
        ) : gridPreview ? (
          /* Phone-frame grid preview */
          <div className="flex justify-center py-6">
            <div className="w-[200px] bg-white rounded-[1.5rem] border-2 border-neutral-900 shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="h-4 bg-neutral-900 flex items-center justify-center">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>
              {/* Mini profile header */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-neutral-100">
                <div className="w-5 h-5 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="" width={20} height={20} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-neutral-400">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[8px] font-semibold leading-tight">{profile.username}</p>
              </div>
              {/* Mini grid — pad to complete the last row */}
              {(() => {
                const cellCount = Math.ceil(filteredPosts.length / 3) * 3
                return (
                  <div className="grid grid-cols-3 gap-px bg-neutral-100">
                    {Array.from({ length: Math.max(cellCount, 15) }).map((_, i) => {
                      const post = filteredPosts[i]
                      return (
                        <div key={post?.id ?? `empty-${i}`} className="aspect-square relative bg-white">
                          {post?.image_url && (
                            <Image src={post.image_url} alt="" fill sizes="66px" className="object-cover" unoptimized />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              {/* Bottom home bar */}
              <div className="h-3 bg-white flex items-center justify-center">
                <div className="w-14 h-0.5 bg-neutral-900 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredPosts.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-1">
                {filteredPosts.map((post) => (
                  <SortablePost key={post.id} post={post} isReordering={isReordering} onOpen={openPost} colors={showPalette ? postColors[post.id] : undefined} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Post Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent
          className="!max-w-5xl !w-full md:!w-[95vw] !p-0 !gap-0 bg-white border-0 !rounded-none md:!rounded-lg !top-0 !left-0 !translate-x-0 !translate-y-0 md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 !h-[100dvh] md:!h-auto md:!max-h-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Post Detail</DialogTitle>
          {selectedPost && (() => {
            const modalImages = selectedPost.carousel_images?.length > 0
              ? selectedPost.carousel_images
              : selectedPost.image_url ? [selectedPost.image_url] : []
            const currentModalImg = modalImages[modalCarouselIndex] || null
            return (
            <>
            {/* ===== MOBILE LAYOUT ===== */}
            <div className="flex flex-col h-[100dvh] md:hidden">
              {/* Mobile header bar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-200 flex-shrink-0">
                <button onClick={() => setSelectedPost(null)}>
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="Avatar" width={28} height={28} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{profile.username}</span>
                  {profile.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </div>
                <button>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Square image/video */}
                <div className="relative w-full aspect-square bg-black">
                  {currentModalImg ? (
                    <>
                      {isVideoUrl(currentModalImg) ? (
                        <video
                          src={currentModalImg}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                          onPlay={(e) => { const a = modalAudioRef.current; if (a) { a.currentTime = (e.target as HTMLVideoElement).currentTime; a.play().catch(() => {}) } }}
                          onPause={() => { modalAudioRef.current?.pause() }}
                          onEnded={() => { modalAudioRef.current?.pause() }}
                        />
                      ) : (
                        <Image
                          src={currentModalImg}
                          alt={selectedPost.caption || "Post"}
                          fill
                          sizes="100vw"
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      {modalImages.length > 1 && (
                        <>
                          {modalCarouselIndex > 0 && (
                            <button
                              onClick={() => setModalCarouselIndex(modalCarouselIndex - 1)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                            >
                              <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                          )}
                          {modalCarouselIndex < modalImages.length - 1 && (
                            <button
                              onClick={() => setModalCarouselIndex(modalCarouselIndex + 1)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {modalImages.map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  i === modalCarouselIndex ? "bg-[#0095f6]" : "bg-white/60"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-neutral-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Actions row */}
                <div className="px-3 pt-2.5 pb-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Heart className="w-6 h-6" />
                      <MessageCircle className="w-6 h-6" />
                      <Send className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        title="Copy caption"
                        onClick={() => {
                          if (selectedPost.caption) {
                            navigator.clipboard.writeText(selectedPost.caption)
                            setCopiedCaption(true)
                            setTimeout(() => setCopiedCaption(false), 2000)
                          }
                        }}
                        className="relative"
                      >
                        <ClipboardCopy className="w-5 h-5" />
                        {copiedCaption && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-neutral-900 text-white px-2 py-0.5 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                      <a
                        title="Download"
                        href={modalImages[modalCarouselIndex] || "#"}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      {selectedPost.audio_url && currentModalImg && isVideoUrl(currentModalImg) && (
                        <button
                          title="Download video with audio"
                          onClick={() => downloadWithAudio(currentModalImg, selectedPost.audio_url!)}
                          disabled={muxing}
                        >
                          {muxing ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                          ) : (
                            <Music className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button onClick={() => deletePost(selectedPost.id)}>
                        <Trash2 className="w-5 h-5 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Likes */}
                <div className="px-3 pb-1">
                  <p className="font-semibold text-sm">{selectedPost.likes_count.toLocaleString()} likes</p>
                </div>

                {/* Caption */}
                <div className="px-3 pb-2">
                  {isEditing ? (
                    <div>
                      <Textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="text-sm min-h-[80px] mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveCaption}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">
                        <span className="font-semibold mr-1">{profile.username}</span>
                        {selectedPost.caption}
                      </p>
                      <p className="text-[10px] text-neutral-400 uppercase mt-1">
                        {formatTimeAgo(selectedPost.posted_at)} ago
                      </p>
                    </>
                  )}
                </div>

                {/* Audio — visible player for image posts, hidden for video (synced to video playback) */}
                {selectedPost.audio_url && (
                  currentModalImg && isVideoUrl(currentModalImg) ? (
                    <audio ref={modalAudioRef} src={selectedPost.audio_url} preload="auto" className="hidden" />
                  ) : (
                    <div className="px-3 py-2 border-t border-neutral-100">
                      <audio src={selectedPost.audio_url} controls className="w-full h-8" />
                    </div>
                  )
                )}
                {muxing && (
                  <div className="px-3 py-1.5 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Combining video + audio...
                  </div>
                )}

                {/* Chat */}
                <div className="px-3 py-2 border-t border-neutral-100">
                  <button onClick={() => setNotesOpen(!notesOpen)} className="flex items-center gap-1.5 w-full">
                    <MessageSquare className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-500">Chat</span>
                    {noteEntries.length > 0 && <span className="text-[10px] text-neutral-400 ml-0.5">{noteEntries.length}</span>}
                    <ChevronDown className={`w-3 h-3 text-neutral-400 ml-auto transition-transform ${notesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {/* Latest message preview when collapsed */}
                  {!notesOpen && noteEntries.length > 0 && (() => {
                    const last = noteEntries[noteEntries.length - 1]
                    const isE = last.author === "E"
                    return (
                      <div className={`mt-2 flex items-start gap-2 ${isE ? "" : "flex-row-reverse"}`}>
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isE ? "bg-zinc-200 text-zinc-600" : "bg-zinc-800 text-white"}`}>{last.author}</span>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${isE ? "bg-zinc-100 rounded-tl-sm" : "bg-zinc-800 text-white rounded-tr-sm"}`}>
                          <p className="text-xs line-clamp-2">{last.text}</p>
                          <span className={`text-[10px] text-zinc-400`}>{timeAgo(last.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })()}
                  {notesOpen && (
                    <div className="mt-2 space-y-2">
                      {/* Author toggle */}
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <span>Chatting as</span>
                        {["E", "H"].map((a) => (
                          <button
                            key={a}
                            onClick={() => changeNoteAuthor(a)}
                            className={`w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${noteAuthor === a ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      {/* Messages */}
                      <div className="max-h-[250px] overflow-y-auto space-y-1.5 py-1">
                        {noteEntries.map((entry, i) => {
                          const isE = entry.author === "E"
                          const isOwn = entry.author === noteAuthor
                          return (
                            <div key={i} className={`group flex items-end gap-1.5 ${isE ? "" : "flex-row-reverse"}`}>
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isE ? "bg-zinc-200 text-zinc-600" : "bg-zinc-800 text-white"}`}>{entry.author}</span>
                              <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 ${isE ? "bg-zinc-100 rounded-bl-sm" : "bg-zinc-800 text-white rounded-br-sm"}`}>
                                {editingNoteIndex === i ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editingNoteText}
                                      onChange={(e) => setEditingNoteText(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === "Enter") saveEditedNote(); if (e.key === "Escape") { setEditingNoteIndex(null); setEditingNoteText("") } }}
                                      className="h-6 text-xs bg-white/90 border-0"
                                      autoFocus
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={saveEditedNote} className="text-[10px] font-medium text-blue-500 hover:text-blue-600">Save</button>
                                      <button onClick={() => { setEditingNoteIndex(null); setEditingNoteText("") }} className="text-[10px] text-zinc-400 hover:text-zinc-500">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs">{entry.text}</p>
                                    <span className={`text-[10px] text-zinc-400`}>{timeAgo(entry.timestamp)}</span>
                                  </>
                                )}
                              </div>
                              {/* Actions — only on own messages, not while editing */}
                              {isOwn && editingNoteIndex !== i && (
                                <div className={`opacity-0 group-hover:opacity-100 flex gap-0.5 ${isE ? "" : "flex-row-reverse"}`}>
                                  <button onClick={() => { setEditingNoteIndex(i); setEditingNoteText(entry.text) }} className="p-0.5 hover:bg-zinc-100 rounded">
                                    <Pencil className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                  <button onClick={() => deleteNote(i)} className="p-0.5 hover:bg-red-50 rounded">
                                    <X className="w-2.5 h-2.5 text-red-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {/* Input */}
                      <div className="flex gap-1.5">
                        <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Type a message..." className="h-7 text-xs flex-1" />
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={addNote} disabled={!newNote.trim()}>Send</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status & Approve/Reject */}
                <div className="px-3 py-2 border-t border-neutral-100 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedPost.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    selectedPost.status === "rejected" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>{selectedPost.status}</span>
                  <div className="ml-auto flex gap-1.5">
                    {selectedPost.status !== "approved" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => updatePostStatus(selectedPost.id, "approved")}>
                        <Check className="w-3.5 h-3.5 mr-1" />Approve
                      </Button>
                    )}
                    {selectedPost.status !== "rejected" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => updatePostStatus(selectedPost.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                      </Button>
                    )}
                    {selectedPost.status !== "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updatePostStatus(selectedPost.id, "draft")}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />Draft
                      </Button>
                    )}
                  </div>
                </div>

                {/* Edit/Delete controls */}
                <div className="px-3 py-3 border-t border-neutral-100 flex items-center gap-2">
                  <Link href={`/new?edit=${selectedPost.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full"><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Post</Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit Caption</Button>
                  <Button size="sm" variant="outline" onClick={() => deletePost(selectedPost.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            </div>

            {/* ===== DESKTOP LAYOUT ===== */}
            <div className="hidden md:flex md:flex-row h-auto md:h-[90vh] md:max-h-[600px]">
              {/* Left: Square image / carousel */}
              <div className="relative w-[600px] aspect-square flex-shrink-0 bg-black">
                {currentModalImg ? (
                  <>
                    {isVideoUrl(currentModalImg) ? (
                      <video
                        src={currentModalImg}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                        onPlay={(e) => { const a = modalAudioRef.current; if (a) { a.currentTime = (e.target as HTMLVideoElement).currentTime; a.play().catch(() => {}) } }}
                        onPause={() => { modalAudioRef.current?.pause() }}
                        onEnded={() => { modalAudioRef.current?.pause() }}
                      />
                    ) : (
                      <Image
                        src={currentModalImg}
                        alt={selectedPost.caption || "Post"}
                        fill
                        sizes="600px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    {modalImages.length > 1 && (
                      <>
                        {modalCarouselIndex > 0 && (
                          <button
                            onClick={() => setModalCarouselIndex(modalCarouselIndex - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <ChevronLeftIcon className="w-5 h-5" />
                          </button>
                        )}
                        {modalCarouselIndex < modalImages.length - 1 && (
                          <button
                            onClick={() => setModalCarouselIndex(modalCarouselIndex + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {modalImages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setModalCarouselIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === modalCarouselIndex ? "bg-[#0095f6]" : "bg-white/60"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400">No image</span>
                  </div>
                )}
              </div>

              {/* Right: Comment panel */}
              <div className="flex flex-col w-[335px] min-w-[335px] h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-3 border-b border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{profile.username}</span>
                  {profile.isVerified && <VerifiedBadge className="w-4 h-4" />}
                  <button className="ml-auto">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Caption/Comments area */}
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <Image src={profile.avatarUrl} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{profile.username.charAt(0).toUpperCase()}</span>
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
                            <Button size="sm" onClick={saveCaption}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm break-words">
                            <span className="font-semibold mr-1">{profile.username}</span>
                            {selectedPost.caption}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">{formatTimeAgo(selectedPost.posted_at)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio — visible player for image posts, hidden for video (synced to video playback) */}
                {selectedPost.audio_url && (
                  currentModalImg && isVideoUrl(currentModalImg) ? (
                    <audio ref={modalAudioRef} src={selectedPost.audio_url} preload="auto" className="hidden" />
                  ) : (
                    <div className="border-t border-neutral-200 px-3 py-2">
                      <audio src={selectedPost.audio_url} controls className="w-full h-8" />
                    </div>
                  )
                )}
                {muxing && (
                  <div className="border-t border-neutral-200 px-3 py-1.5 flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Combining video + audio...
                  </div>
                )}

                {/* Chat */}
                <div className="border-t border-neutral-200 p-3">
                  <button onClick={() => setNotesOpen(!notesOpen)} className="flex items-center gap-1.5 w-full">
                    <MessageSquare className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-500">Chat</span>
                    {noteEntries.length > 0 && <span className="text-[10px] text-neutral-400 ml-0.5">{noteEntries.length}</span>}
                    <ChevronDown className={`w-3 h-3 text-neutral-400 ml-auto transition-transform ${notesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {/* Latest message preview when collapsed */}
                  {!notesOpen && noteEntries.length > 0 && (() => {
                    const last = noteEntries[noteEntries.length - 1]
                    const isE = last.author === "E"
                    return (
                      <div className={`mt-2 flex items-start gap-2 ${isE ? "" : "flex-row-reverse"}`}>
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isE ? "bg-zinc-200 text-zinc-600" : "bg-zinc-800 text-white"}`}>{last.author}</span>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${isE ? "bg-zinc-100 rounded-tl-sm" : "bg-zinc-800 text-white rounded-tr-sm"}`}>
                          <p className="text-xs line-clamp-2">{last.text}</p>
                          <span className={`text-[10px] text-zinc-400`}>{timeAgo(last.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })()}
                  {notesOpen && (
                    <div className="mt-2 space-y-2">
                      {/* Author toggle */}
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <span>Chatting as</span>
                        {["E", "H"].map((a) => (
                          <button
                            key={a}
                            onClick={() => changeNoteAuthor(a)}
                            className={`w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${noteAuthor === a ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      {/* Messages */}
                      <div className="max-h-[250px] overflow-y-auto space-y-1.5 py-1">
                        {noteEntries.map((entry, i) => {
                          const isE = entry.author === "E"
                          const isOwn = entry.author === noteAuthor
                          return (
                            <div key={i} className={`group flex items-end gap-1.5 ${isE ? "" : "flex-row-reverse"}`}>
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isE ? "bg-zinc-200 text-zinc-600" : "bg-zinc-800 text-white"}`}>{entry.author}</span>
                              <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 ${isE ? "bg-zinc-100 rounded-bl-sm" : "bg-zinc-800 text-white rounded-br-sm"}`}>
                                {editingNoteIndex === i ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editingNoteText}
                                      onChange={(e) => setEditingNoteText(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === "Enter") saveEditedNote(); if (e.key === "Escape") { setEditingNoteIndex(null); setEditingNoteText("") } }}
                                      className="h-6 text-xs bg-white/90 border-0"
                                      autoFocus
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={saveEditedNote} className="text-[10px] font-medium text-blue-500 hover:text-blue-600">Save</button>
                                      <button onClick={() => { setEditingNoteIndex(null); setEditingNoteText("") }} className="text-[10px] text-zinc-400 hover:text-zinc-500">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs">{entry.text}</p>
                                    <span className={`text-[10px] text-zinc-400`}>{timeAgo(entry.timestamp)}</span>
                                  </>
                                )}
                              </div>
                              {/* Actions — only on own messages, not while editing */}
                              {isOwn && editingNoteIndex !== i && (
                                <div className={`opacity-0 group-hover:opacity-100 flex gap-0.5 ${isE ? "" : "flex-row-reverse"}`}>
                                  <button onClick={() => { setEditingNoteIndex(i); setEditingNoteText(entry.text) }} className="p-0.5 hover:bg-zinc-100 rounded">
                                    <Pencil className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                  <button onClick={() => deleteNote(i)} className="p-0.5 hover:bg-red-50 rounded">
                                    <X className="w-2.5 h-2.5 text-red-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {/* Input */}
                      <div className="flex gap-1.5">
                        <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Type a message..." className="h-7 text-xs flex-1" />
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={addNote} disabled={!newNote.trim()}>Send</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <Heart className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                      <MessageCircle className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                      <Send className="w-6 h-6 cursor-pointer hover:text-neutral-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        title="Copy caption"
                        onClick={() => {
                          if (selectedPost.caption) {
                            navigator.clipboard.writeText(selectedPost.caption)
                            setCopiedCaption(true)
                            setTimeout(() => setCopiedCaption(false), 2000)
                          }
                        }}
                        className="relative"
                      >
                        <ClipboardCopy className="w-5 h-5 cursor-pointer hover:text-neutral-500" />
                        {copiedCaption && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-neutral-900 text-white px-2 py-0.5 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                      <a
                        title="Download"
                        href={modalImages[modalCarouselIndex] || "#"}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-5 h-5 cursor-pointer hover:text-neutral-500" />
                      </a>
                      {selectedPost.audio_url && currentModalImg && isVideoUrl(currentModalImg) && (
                        <button
                          title="Download video with audio"
                          onClick={() => downloadWithAudio(currentModalImg, selectedPost.audio_url!)}
                          disabled={muxing}
                          className="cursor-pointer hover:text-neutral-500"
                        >
                          {muxing ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                          ) : (
                            <Music className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button onClick={() => deletePost(selectedPost.id)}>
                        <Trash2 className="w-5 h-5 cursor-pointer hover:text-red-500" />
                      </button>
                    </div>
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

                {/* Status & Approve/Reject */}
                <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedPost.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    selectedPost.status === "rejected" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>{selectedPost.status}</span>
                  <div className="ml-auto flex gap-1.5">
                    {selectedPost.status !== "approved" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => updatePostStatus(selectedPost.id, "approved")}>
                        <Check className="w-3.5 h-3.5 mr-1" />Approve
                      </Button>
                    )}
                    {selectedPost.status !== "rejected" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => updatePostStatus(selectedPost.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                      </Button>
                    )}
                    {selectedPost.status !== "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updatePostStatus(selectedPost.id, "draft")}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />Draft
                      </Button>
                    )}
                  </div>
                </div>

                {/* Edit/Delete controls */}
                <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
                  <Link href={`/new?edit=${selectedPost.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full"><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Post</Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit Caption</Button>
                  <Button size="sm" variant="outline" onClick={() => deletePost(selectedPost.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            </div>
            </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Avatar Picker Modal */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="!max-w-lg !p-0 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <DialogTitle className="text-lg font-semibold text-center">Choose Profile Photo</DialogTitle>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-neutral-500 mb-4">Select from your posts:</p>
            {posts.filter((p) => p.image_url).length === 0 ? (
              <p className="text-neutral-400 text-center py-4">No post images yet. Create a post first.</p>
            ) : (
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
                      <Image src={post.image_url!} alt="" fill sizes="120px" className="object-cover" />
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
            )}
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
