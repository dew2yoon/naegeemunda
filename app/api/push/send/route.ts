import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createServerSupabaseClient } from '@/lib/supabase-server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    await webpush.sendNotification(
      data.subscription,
      JSON.stringify({
        title: 'memymemo',
        body: '✍️ 오늘의 기록을 남겨볼까요? memymemo가 기다리고 있어요.',
        url: '/main',
      })
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send push error:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
