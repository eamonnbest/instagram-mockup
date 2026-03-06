import { NextResponse, type NextRequest } from "next/server"

// In-memory rate limit store: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 10 // max requests per window
const WINDOW_MS = 60 * 1000 // 1 minute

// Clean up old entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return
  lastCleanup = now
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanup()
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT) {
    return true
  }
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only rate-limit the expensive AI endpoints
  if (pathname === "/api/instagram/generate" || pathname === "/api/instagram/caption") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/instagram/:path*",
}
