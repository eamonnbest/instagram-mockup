"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ChevronLeft as BackIcon, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Post {
  id: string
  image_url: string | null
  caption: string | null
  posted_at: string
  scheduled_for: string | null
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [dragPost, setDragPost] = useState<Post | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const res = await fetch("/api/instagram/posts")
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function schedulePost(postId: string, date: Date) {
    const scheduled_for = date.toISOString()
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, scheduled_for }),
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, scheduled_for } : p))
      )
    } catch (error) {
      console.error("Failed to schedule post:", error)
    }
  }

  async function unschedulePost(postId: string) {
    try {
      await fetch("/api/instagram/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, scheduled_for: null }),
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, scheduled_for: null } : p))
      )
    } catch (error) {
      console.error("Failed to unschedule post:", error)
    }
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Build calendar grid
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  function getPostsForDay(day: number): Post[] {
    return posts.filter((p) => {
      const dateStr = p.scheduled_for || p.posted_at
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const unscheduledPosts = posts.filter((p) => !p.scheduled_for)

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <BackIcon className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="font-semibold">Schedule</span>
        </div>
        <div className="w-16" />
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button size="sm" variant="ghost" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <Button size="sm" variant="ghost" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400">Loading...</div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-px">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-neutral-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
              {calendarDays.map((day, i) => {
                const dayPosts = day ? getPostsForDay(day) : []
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear()

                return (
                  <div
                    key={i}
                    className={`bg-white min-h-[100px] p-1.5 ${!day ? "bg-neutral-50" : ""}`}
                    onDragOver={(e) => {
                      if (day) e.preventDefault()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (day && dragPost) {
                        const dropDate = new Date(year, month, day, 12, 0, 0)
                        schedulePost(dragPost.id, dropDate)
                        setDragPost(null)
                      }
                    }}
                  >
                    {day && (
                      <>
                        <p
                          className={`text-xs mb-1 ${
                            isToday
                              ? "w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center font-bold"
                              : "text-neutral-500"
                          }`}
                        >
                          {day}
                        </p>
                        <div className="space-y-1">
                          {dayPosts.map((post) => (
                            <div
                              key={post.id}
                              className="group relative"
                              draggable
                              onDragStart={() => setDragPost(post)}
                            >
                              <div className="flex items-center gap-1 bg-neutral-50 rounded p-0.5 cursor-grab active:cursor-grabbing">
                                {post.image_url ? (
                                  <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 relative">
                                    <Image
                                      src={post.image_url}
                                      alt=""
                                      fill
                                      sizes="28px"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded bg-neutral-200 flex-shrink-0" />
                                )}
                                <p className="text-[10px] text-neutral-600 truncate flex-1">
                                  {post.caption?.slice(0, 20) || "No caption"}
                                </p>
                              </div>
                              {post.scheduled_for && (
                                <button
                                  onClick={() => unschedulePost(post.id)}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Unscheduled posts */}
            {unscheduledPosts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 text-neutral-600">
                  Unscheduled Posts ({unscheduledPosts.length})
                </h3>
                <p className="text-xs text-neutral-400 mb-3">Drag posts onto a calendar day to schedule them</p>
                <div className="flex flex-wrap gap-2">
                  {unscheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => setDragPost(post)}
                      className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg p-2 cursor-grab active:cursor-grabbing hover:border-neutral-400 transition-colors"
                    >
                      {post.image_url ? (
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative">
                          <Image
                            src={post.image_url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-neutral-200 flex-shrink-0" />
                      )}
                      <p className="text-xs text-neutral-600 max-w-[120px] truncate">
                        {post.caption?.slice(0, 30) || "No caption"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
