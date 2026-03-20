'use client'

import { Entry, InterviewSession, TimelineItem } from '@/types'
import { exportAllEntriesHtml } from '@/lib/exportHtml'
import EntryCard from './EntryCard'
import InterviewCard from './InterviewCard'
import { createClient } from '@/lib/supabase'

interface EntriesSectionProps {
  entries: Entry[]
  interviewSessions: InterviewSession[]
  onEntryDeleted: (id: string) => void
  onInterviewDeleted: (id: string) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export default function EntriesSection({
  entries,
  interviewSessions,
  onEntryDeleted,
  onInterviewDeleted,
  onToast,
}: EntriesSectionProps) {
  async function handleDeleteEntry(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) { onToast('삭제에 실패했습니다.', 'error'); return }
    onEntryDeleted(id)
    onToast('기록이 삭제되었습니다.')
  }

  // 최신순 통합 타임라인
  const timeline: TimelineItem[] = [
    ...entries.map((e): TimelineItem => ({ type: 'entry', data: e })),
    ...interviewSessions.map((s): TimelineItem => ({ type: 'interview', data: s })),
  ].sort((a, b) =>
    new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )

  const totalCount = timeline.length

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-medium text-[#1e1b2e]">
          나의 기록{' '}
          <span className="text-[#9585c2] font-normal">{totalCount}개</span>
        </h2>
        {entries.length > 0 && (
          <button
            onClick={() => exportAllEntriesHtml(entries)}
            aria-label="전체 기록 내보내기"
            className="text-[13px] text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            전체 내보내기
          </button>
        )}
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-16 text-[#9585c2] text-[14px]">
          첫 번째 기록을 남겨보세요.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {timeline.map((item) =>
            item.type === 'entry' ? (
              <EntryCard
                key={item.data.id}
                entry={item.data}
                onDelete={handleDeleteEntry}
              />
            ) : (
              <InterviewCard
                key={item.data.id}
                session={item.data}
                onDelete={onInterviewDeleted}
              />
            )
          )}
        </div>
      )}
    </section>
  )
}
