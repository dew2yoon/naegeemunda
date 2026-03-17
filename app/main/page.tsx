import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import MainClient from './MainClient'
import { Entry, InterviewSession } from '@/types'

export default async function MainPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: entries }, { data: interviewSessions }] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <MainClient
      user={{ id: user.id, email: user.email ?? '' }}
      initialEntries={(entries ?? []) as Entry[]}
      initialInterviewSessions={(interviewSessions ?? []) as InterviewSession[]}
    />
  )
}
