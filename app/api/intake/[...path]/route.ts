import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

async function proxy(req: NextRequest, path: string[]) {
  const apiUrl = process.env.KOUREIA_API_URL ?? "https://koureia.com"
  const upstream = new URL(`${apiUrl}/api/intake/${path.join("/")}`)
  req.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.append(key, value)
  })

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await req.arrayBuffer()

  const upstreamResponse = await fetch(upstream, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxy(req, path)
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxy(req, path)
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxy(req, path)
}
