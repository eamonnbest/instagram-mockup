"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, ArrowLeft, MessageSquare, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface DmMessage {
  id: string
  sender: string
  content: string
  created_at: string
}

interface DmThread {
  id: string
  business_name: string
  business_type: string | null
  status: string
  template: string | null
  created_at: string
  updated_at: string
  dm_messages: DmMessage[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  drafted: { label: "Drafted", color: "bg-zinc-100", textColor: "text-zinc-600" },
  sent: { label: "Sent", color: "bg-blue-50", textColor: "text-blue-700" },
  replied: { label: "Replied", color: "bg-green-50", textColor: "text-green-700" },
  follow_up: { label: "Follow Up", color: "bg-amber-50", textColor: "text-amber-700" },
}

export default function DmsPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<DmThread[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Quick-add form
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("")
  const [creating, setCreating] = useState(false)

  // Style config
  const [styleOpen, setStyleOpen] = useState(false)
  const [styleExamples, setStyleExamples] = useState<string[]>([])
  const [styleRules, setStyleRules] = useState("")
  const [newExample, setNewExample] = useState("")
  const [savingStyle, setSavingStyle] = useState(false)
  const [styleSaved, setStyleSaved] = useState(false)

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/dms")
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error("Failed to load DM threads:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStyle = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings?keys=dm_style_examples,dm_style_rules")
      if (res.ok) {
        const data = await res.json()
        if (data.settings.dm_style_examples) {
          try { setStyleExamples(JSON.parse(data.settings.dm_style_examples)) } catch { /* */ }
        }
        if (data.settings.dm_style_rules) {
          setStyleRules(data.settings.dm_style_rules)
        }
      }
    } catch { /* */ }
  }, [])

  useEffect(() => {
    loadThreads()
    loadStyle()
  }, [loadThreads, loadStyle])

  async function saveStyle() {
    setSavingStyle(true)
    try {
      await Promise.all([
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "dm_style_examples", value: JSON.stringify(styleExamples) }),
        }),
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "dm_style_rules", value: styleRules }),
        }),
      ])
      setStyleSaved(true)
      setTimeout(() => setStyleSaved(false), 2000)
    } catch { /* */ }
    finally { setSavingStyle(false) }
  }

  function addExample() {
    if (!newExample.trim()) return
    setStyleExamples((prev) => [...prev, newExample.trim()])
    setNewExample("")
  }

  function removeExample(index: number) {
    setStyleExamples((prev) => prev.filter((_, i) => i !== index))
  }

  async function createThread() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/instagram/dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: newName.trim(),
          business_type: newType.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/dms/${data.thread.id}`)
      }
    } catch (error) {
      console.error("Failed to create thread:", error)
    } finally {
      setCreating(false)
    }
  }

  async function deleteThread(id: string) {
    if (!confirm("Delete this outreach? All drafts and notes will be removed.")) return
    try {
      const res = await fetch(`/api/instagram/dms?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete thread:", error)
    }
  }

  const filteredThreads = statusFilter
    ? threads.filter((t) => t.status === statusFilter)
    : threads

  const statusCounts = threads.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  function getLastActivity(thread: DmThread): string {
    if (!thread.dm_messages || thread.dm_messages.length === 0) return "No messages"
    const theirMessages = thread.dm_messages.filter((m) => m.sender === "them")
    if (theirMessages.length > 0) {
      return `They replied ${formatDate(theirMessages[theirMessages.length - 1].created_at)}`
    }
    const myMessages = thread.dm_messages.filter((m) => m.sender === "me")
    if (myMessages.length > 0) {
      return `You drafted ${formatDate(myMessages[myMessages.length - 1].created_at)}`
    }
    return "No messages"
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "today"
    if (diffDays === 1) return "yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-[935px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-70">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Outreach</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-sm font-medium hover:opacity-70">
              Schedule
            </Link>
            <Link href="/ads" className="text-sm font-medium hover:opacity-70">
              Ads
            </Link>
            <Link href="/new" className="text-sm font-medium hover:opacity-70">
              New Post
            </Link>
            <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[935px] mx-auto px-5 py-6">
        {/* Your Style — collapsible */}
        <div className="mb-6 border rounded-lg">
          <button
            onClick={() => setStyleOpen(!styleOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors rounded-lg"
          >
            <div>
              <h3 className="text-sm font-semibold">Your Style</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {styleExamples.length > 0 || styleRules
                  ? `${styleExamples.length} example${styleExamples.length !== 1 ? "s" : ""}${styleRules ? " + rules" : ""}`
                  : "Teach AI how you write so Polish sounds like you"}
              </p>
            </div>
            {styleOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>

          {styleOpen && (
            <div className="px-4 pb-4 space-y-4 border-t">
              {/* Example messages */}
              <div className="pt-3">
                <label className="text-xs font-medium text-zinc-600 block mb-1">Example DMs you've sent</label>
                <p className="text-xs text-zinc-400 mb-2">Paste real messages you've sent that sound like you. The AI will match this voice.</p>

                {styleExamples.map((ex, i) => (
                  <div key={i} className="group flex items-start gap-2 mb-2 p-2.5 bg-zinc-50 rounded-lg text-sm">
                    <p className="flex-1 whitespace-pre-wrap">{ex}</p>
                    <button onClick={() => removeExample(i)} className="p-1 rounded hover:bg-zinc-200 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Textarea
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder="Paste an example DM..."
                    className="flex-1 min-h-[60px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) { e.preventDefault(); addExample() }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={addExample} disabled={!newExample.trim()} className="shrink-0 self-end">
                    Add
                  </Button>
                </div>
              </div>

              {/* Style rules */}
              <div>
                <label className="text-xs font-medium text-zinc-600 block mb-1">Style rules</label>
                <p className="text-xs text-zinc-400 mb-2">Tell the AI what to avoid or always do. E.g. "never end with a question", "keep it under 5 lines".</p>
                <Textarea
                  value={styleRules}
                  onChange={(e) => setStyleRules(e.target.value)}
                  placeholder={"e.g.\n- Never say \"worth a chat?\"\n- Don't be salesy or cheesy\n- Keep it short, max 4-5 lines\n- Sound like a real person, not a brand"}
                  className="min-h-[80px] text-sm resize-none"
                />
              </div>

              {/* Save */}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveStyle} disabled={savingStyle}>
                  {savingStyle ? "Saving..." : "Save Style"}
                </Button>
                {styleSaved && <span className="text-xs text-green-600">Saved</span>}
              </div>
            </div>
          )}
        </div>

        {/* Quick-add inline form */}
        {showAdd && (
          <div className="mb-6 p-4 border rounded-lg bg-zinc-50">
            <h3 className="text-sm font-semibold mb-3">Add a business to reach out to</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-500 block mb-1">Business name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Glossier"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createThread()
                    if (e.key === "Escape") setShowAdd(false)
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-500 block mb-1">Type (optional)</label>
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g. skincare brand"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createThread()
                    if (e.key === "Escape") setShowAdd(false)
                  }}
                />
              </div>
              <Button onClick={createThread} disabled={!newName.trim() || creating} className="shrink-0">
                {creating ? "..." : "Add & Open"}
              </Button>
              <button
                onClick={() => { setShowAdd(false); setNewName(""); setNewType("") }}
                className="text-sm text-zinc-400 hover:text-zinc-600 shrink-0 pb-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : threads.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <MessageSquare className="w-16 h-16 text-zinc-300" />
            <h2 className="text-xl font-semibold text-zinc-500">No outreach yet</h2>
            <p className="text-sm text-zinc-400 text-center max-w-md">
              Track your DM outreach to other businesses. Add a business, draft your message,
              log their response, and keep track of follow-ups.
            </p>
            <Button className="gap-1.5 mt-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Add First Business
            </Button>
          </div>
        ) : threads.length > 0 && (
          <div className="space-y-4">
            {/* Stats + filter */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === null
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  All ({threads.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  const count = statusCounts[key] || 0
                  if (count === 0 && statusFilter !== key) return null
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === key
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {config.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_140px_140px_160px_40px] gap-4 px-4 py-2.5 bg-zinc-50 border-b text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <div>Business</div>
                <div>Status</div>
                <div>Reached Out</div>
                <div>Last Activity</div>
                <div></div>
              </div>

              {/* Rows */}
              {filteredThreads.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  No outreach matching this filter
                </div>
              ) : (
                <div className="divide-y">
                  {filteredThreads.map((thread) => {
                    const statusInfo = STATUS_CONFIG[thread.status] || STATUS_CONFIG.drafted
                    return (
                      <div
                        key={thread.id}
                        className="group grid grid-cols-1 md:grid-cols-[1fr_140px_140px_160px_40px] gap-2 md:gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer items-center"
                        onClick={() => router.push(`/dms/${thread.id}`)}
                      >
                        {/* Business */}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{thread.business_name}</div>
                          {thread.business_type && (
                            <div className="text-xs text-zinc-400 truncate">{thread.business_type}</div>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Reached out date */}
                        <div className="text-xs text-zinc-500">
                          {new Date(thread.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>

                        {/* Last activity */}
                        <div className="text-xs text-zinc-500">
                          {getLastActivity(thread)}
                        </div>

                        {/* Delete */}
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteThread(thread.id)
                            }}
                            className="p-1 rounded hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
