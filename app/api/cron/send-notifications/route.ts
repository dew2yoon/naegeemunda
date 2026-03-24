import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Service role client (bypasses RLS) — only used server-side in cron
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const now = new Date()
    // KST = UTC+9
    const kstHour = String((now.getUTCHours() + 9) % 24).padStart(2, '0')
    const kstMinute = String(now.getUTCMinutes()).padStart(2, '0')
    const currentTime = `${kstHour}:${kstMinute}:00`

    const supabase = createServiceClient()

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('is_active', true)
      .eq('notify_time', currentTime)

    if (error) throw error
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const payload = JSON.stringify({
      title: 'memymemo',
      body: '✍️ 오늘의 기록을 남겨볼까요? memymemo가 기다리고 있어요.',
      url: '/main',
    })

    const results = await Promise.allSettled(
      subscriptions.map((row) => webpush.sendNotification(row.subscription, payload))
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (err) {
    console.error('Cron send-notifications error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
