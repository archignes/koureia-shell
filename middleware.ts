import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""

  // Normalize: strip port, lowercase, strip www.
  const domain = host
    .toLowerCase()
    .replace(/:\d+$/, "")         // strip :port
    .replace(/^www\./, "")        // strip www.

  // Skip internal Next.js paths and API routes — do not rewrite these
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")           // static files like favicon.ico, robots.txt
  ) {
    return NextResponse.next()
  }

  // In local dev, no meaningful domain — serve the index page
  if (domain === "localhost" || domain === "127.0.0.1") {
    return NextResponse.next()
  }

  // Rewrite to /[domain]/[[...slug]] route
  const url = request.nextUrl.clone()
  url.pathname = `/${domain}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
