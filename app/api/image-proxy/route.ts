import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 })
  }

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(raw)
    new URL(targetUrl) // validate
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }

  // Only proxy Supabase Storage URLs for safety
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : ''
  const targetHost = new URL(targetUrl).hostname
  if (supabaseHost && targetHost !== supabaseHost) {
    return NextResponse.json({ error: 'url not allowed' }, { status: 403 })
  }

  try {
    const upstream = await fetch(targetUrl, { cache: 'force-cache' })
    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    console.error('[image-proxy] upstream fetch failed:', e)
    return new NextResponse(null, { status: 502 })
  }
}
