"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MessageSquare,
  Copy,
  Check,
  Pencil,
  ChevronDown,
  Sparkles,
  Trash2,
  Undo2,
  Handshake,
  Repeat2,
  Gift,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface DmMessage {
  id: string
  thread_id: string
  sender: string
  content: string
  tone: string | null
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
}

const STATUS_OPTIONS = [
  { value: "drafted", label: "Drafted", color: "bg-zinc-500" },
  { value: "sent", label: "Sent", color: "bg-blue-500" },
  { value: "replied", label: "Replied", color: "bg-green-500" },
  { value: "follow_up", label: "Follow Up", color: "bg-amber-500" },
]

const TONE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
  { value: "direct", label: "Direct" },
]

const TEMPLATES = [
  { id: "partnership", label: "Partnership", icon: Handshake, text: `Hi [business name]!\n\nI'm reaching out from [your brand] — we're a [your brand type] based in [location].\n\nI've been following your page and love what you're doing with [something specific]. I think there could be a really natural fit between our audiences.\n\nWould you be open to chatting about a potential partnership?\n\nLooking forward to hearing from you!` },
  { id: "collab", label: "Collab", icon: Repeat2, text: `Hey [business name]!\n\nLove your content — especially [something specific]. I run [your brand], and I think our audiences would really vibe together.\n\nWould you be interested in doing a collab? I was thinking something like [collab idea].\n\nLet me know if you'd be up for it!` },
  { id: "product_exchange", label: "Product Exchange", icon: Gift, text: `Hi [business name]!\n\nI'm [your name] from [your brand]. I love your page and think your audience would genuinely enjoy our [product/service].\n\nI'd love to send you [specific product] to try — no strings attached. If you enjoy it and want to share, that'd be amazing.\n\nWould you be interested?` },
  { id: "event", label: "Event Invite", icon: CalendarDays, text: `Hey [business name]!\n\nI'm reaching out from [your brand]. We're hosting [event name/type] on [date] and I think it'd be right up your alley.\n\n[1-2 sentences about the event]\n\nWould love to have you there!` },
]

export default function DmThreadPage() {
  const params = useParams()
  const threadId = params.id as string

  const [thread, setThread] = useState<DmThread | null>(null)
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Compose
  const [composeText, setComposeText] = useState("")
  const [composeSender, setComposeSender] = useState<"me" | "them">("me")
  const [selectedTone, setSelectedTone] = useState("casual")
  const [saving, setSaving] = useState(false)

  // Polish
  const [polishing, setPolishing] = useState(false)
  const [prePolishText, setPrePolishText] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // UI
  const [statusOpen, setStatusOpen] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [editBusinessName, setEditBusinessName] = useState("")
  const [editBusinessType, setEditBusinessType] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const loadThread = useCallback(async () => {
    try {
      const [threadRes, messagesRes] = await Promise.all([
        fetch(`/api/instagram/dms?id=${threadId}`),
        fetch(`/api/instagram/dms/messages?thread_id=${threadId}`),
      ])
      if (threadRes.ok) {
        const data = await threadRes.json()
        if (data.thread) {
          setThread(data.thread)
          setEditBusinessName(data.thread.business_name)
          setEditBusinessType(data.thread.business_type || "")
        }
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to load thread:", error)
    } finally {
      setLoading(false)
    }
  }, [threadId])

  useEffect(() => { loadThread() }, [loadThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function saveMessage() {
    if (!composeText.trim() || saving) return
    setSaving(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/instagram/dms/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          sender: composeSender,
          content: composeText.trim(),
          tone: composeSender === "me" ? selectedTone : null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setComposeText("")
        setPrePolishText(null)
        setSuggestions([])
        setComposeSender("me")
      } else {
        setErrorMsg("Failed to save. Please try again.")
      }
    } catch {
      setErrorMsg("Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this entry?")) return
    try {
      const res = await fetch(`/api/instagram/dms/messages?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }
    } catch {
      console.error("Failed to delete")
    }
  }

  async function polishDraft() {
    if (!composeText.trim() || polishing) return
    setPolishing(true)
    setSuggestions([])
    setErrorMsg(null)

    try {
      const res = await fetch("/api/instagram/dms/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: composeText.trim(),
          tone: selectedTone,
          business_name: thread?.business_name,
          business_type: thread?.business_type,
          thread_messages: messages.slice(-10).map((m) => ({ sender: m.sender, content: m.content })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPrePolishText(composeText)
        setComposeText(data.polished)
        setSuggestions(data.suggestions || [])
      } else {
        setErrorMsg("Polish failed. Please try again.")
      }
    } catch {
      setErrorMsg("Polish failed.")
    } finally {
      setPolishing(false)
    }
  }

  function undoPolish() {
    if (prePolishText !== null) {
      setComposeText(prePolishText)
      setPrePolishText(null)
      setSuggestions([])
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch("/api/instagram/dms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: threadId, status: newStatus }),
      })
      if (res.ok) {
        setThread((prev) => prev ? { ...prev, status: newStatus } : prev)
      }
    } catch { /* */ }
    setStatusOpen(false)
  }

  async function saveThreadInfo() {
    if (!editBusinessName.trim()) return
    try {
      const res = await fetch("/api/instagram/dms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: threadId,
          business_name: editBusinessName.trim(),
          business_type: editBusinessType.trim() || null,
        }),
      })
      if (res.ok) {
        setThread((prev) =>
          prev ? { ...prev, business_name: editBusinessName.trim(), business_type: editBusinessType.trim() || null } : prev
        )
        setEditingInfo(false)
      }
    } catch { /* */ }
  }

  function copyText(content: string, id: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <MessageSquare className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500">Not found</p>
        <Link href="/dms"><Button variant="outline" size="sm">Back to Outreach</Button></Link>
      </div>
    )
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === thread.status) || STATUS_OPTIONS[0]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-[700px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dms" className="hover:opacity-70">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            {editingInfo ? (
              <div className="flex items-center gap-2">
                <Input value={editBusinessName} onChange={(e) => setEditBusinessName(e.target.value)} className="h-8 text-sm w-40" autoFocus />
                <Input value={editBusinessType} onChange={(e) => setEditBusinessType(e.target.value)} placeholder="Type" className="h-8 text-sm w-28" />
                <Button size="sm" variant="outline" className="h-8" onClick={saveThreadInfo}>Save</Button>
                <button onClick={() => setEditingInfo(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{thread.business_name}</h1>
                {thread.business_type && <span className="text-xs text-zinc-400">· {thread.business_type}</span>}
                <button onClick={() => setEditingInfo(true)} className="p-1 rounded hover:bg-zinc-100"><Pencil className="w-3.5 h-3.5 text-zinc-400" /></button>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setStatusOpen(!statusOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white ${currentStatus.color}`}>
              {currentStatus.label}<ChevronDown className="w-3 h-3" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => updateStatus(opt.value)} className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2 ${thread.status === opt.value ? "font-medium" : ""}`}>
                      <div className={`w-2 h-2 rounded-full ${opt.color}`} />{opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conversation log */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-5 py-6 space-y-4">
          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
              {errorMsg}
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm text-zinc-400">Write your first message below.</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isMe = msg.sender === "me"
            return (
              <div key={msg.id} className={`group rounded-lg p-4 ${isMe ? "bg-white border" : "bg-green-50 border border-green-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-semibold ${isMe ? "text-zinc-700" : "text-green-700"}`}>
                      {isMe ? "You" : thread.business_name}
                    </span>
                    <span className="text-zinc-400">{formatDate(msg.created_at)}</span>
                    {msg.tone && isMe && <span className="text-zinc-400">· {msg.tone}</span>}
                  </div>
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copyText(msg.content, msg.id)} className="p-1.5 rounded hover:bg-zinc-100" title="Copy">
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                    <button onClick={() => deleteMessage(msg.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Compose bar — always at the bottom */}
      <div className="sticky bottom-0 bg-white border-t">
        <div className="max-w-[700px] mx-auto px-5 py-4 space-y-3">
          {/* Sender toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-zinc-100 rounded-full p-0.5">
              <button
                onClick={() => setComposeSender("me")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${composeSender === "me" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Your message
              </button>
              <button
                onClick={() => setComposeSender("them")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${composeSender === "them" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Their reply
              </button>
            </div>

            {/* Tone (only for your messages) */}
            {composeSender === "me" && (
              <div className="flex gap-1">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${selectedTone === tone.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template buttons (only when composing your message and nothing typed yet and no messages yet) */}
          {composeSender === "me" && !composeText && messages.length === 0 && (
            <div className="flex gap-2 flex-wrap">
              {TEMPLATES.map((t) => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setComposeText(t.text)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
                    <Icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Suggestions from polish */}
          {suggestions.length > 0 && (
            <div className="p-2.5 bg-violet-50 border border-violet-200 rounded-lg">
              {suggestions.map((s, i) => (
                <p key={i} className="text-xs text-violet-600">- {s}</p>
              ))}
            </div>
          )}

          {/* Textarea */}
          <Textarea
            value={composeText}
            onChange={(e) => {
              setComposeText(e.target.value)
              if (prePolishText !== null) { setPrePolishText(null); setSuggestions([]) }
            }}
            placeholder={composeSender === "me" ? "Write your message..." : `Paste ${thread.business_name}'s reply...`}
            className="min-h-[100px] max-h-[250px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey && !saving) { e.preventDefault(); saveMessage() }
            }}
          />

          {/* Action bar */}
          <div className="flex items-center gap-2">
            <Button onClick={saveMessage} disabled={!composeText.trim() || saving} size="sm">
              {saving ? "..." : composeSender === "me" ? "Save & Log" : "Log Reply"}
            </Button>

            {composeSender === "me" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={polishDraft} disabled={!composeText.trim() || polishing}>
                <Sparkles className="w-3.5 h-3.5" />
                {polishing ? "..." : "Polish"}
              </Button>
            )}

            {prePolishText !== null && (
              <button onClick={undoPolish} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700">
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
            )}

            <span className="text-[11px] text-zinc-400 ml-auto">⌘+Enter to save</span>
          </div>
        </div>
      </div>
    </div>
  )
}
