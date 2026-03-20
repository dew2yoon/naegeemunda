'use client'

import { useState, useCallback } from 'react'
import { Entry, FontFamily, FontSize, InterviewSession } from '@/types'
import Header from '@/components/Header'
import WritingSection from '@/components/WritingSection'
import EntriesSection from '@/components/EntriesSection'
import Toast from '@/components/Toast'
import KeywordInterviewButton from '@/components/KeywordInterviewButton'
import InterviewSessionView from '@/components/InterviewSession'
import InterviewResult from '@/components/InterviewResult'

type InterviewState =
  | null
  | { stage: 'session'; keyword: string; questions: string[] }
  | { stage: 'result'; keyword: string; questions: string[]; answers: string[]; fontFamily: FontFamily; fontSize: FontSize; photoFiles: File[][] }

interface MainClientProps {
  user: { id: string; email: string }
  initialEntries: Entry[]
  initialInterviewSessions: InterviewSession[]
}

export default function MainClient({ user, initialEntries, initialInterviewSessions }: MainClientProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>(initialInterviewSessions)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [interviewState, setInterviewState] = useState<InterviewState>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  // 키워드 인터뷰 시작 — API 호출
  const handleInterviewStart = useCallback(async (keyword: string) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })
      const { questions } = await res.json()
      setInterviewState({ stage: 'session', keyword, questions })
    } catch {
      showToast('질문 생성에 실패했습니다.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [showToast])

  // 인터뷰 Q&A 완료 → 결과 화면
  const handleSessionComplete = useCallback((
    answers: string[],
    fontFamily: FontFamily,
    fontSize: FontSize,
    photoFiles: File[][]
  ) => {
    if (interviewState?.stage !== 'session') return
    setInterviewState({
      stage: 'result',
      keyword: interviewState.keyword,
      questions: interviewState.questions,
      answers,
      fontFamily,
      fontSize,
      photoFiles,
    })
  }, [interviewState])

  // 결과 화면 → 세션으로 돌아가기
  const handleResultBack = useCallback(() => {
    if (interviewState?.stage !== 'result') return
    setInterviewState({
      stage: 'session',
      keyword: interviewState.keyword,
      questions: interviewState.questions,
    })
  }, [interviewState])

  // 인터뷰 저장 완료
  const handleInterviewSaved = useCallback((session: InterviewSession) => {
    setInterviewSessions((prev) => [session, ...prev])
    setInterviewState(null)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <Header userEmail={user.email} />

      <main className="max-w-[1100px] mx-auto px-4 py-8 flex flex-col gap-8">
        {/* 인터뷰 버튼 */}
        <div className="flex justify-end">
          <KeywordInterviewButton
            onStart={handleInterviewStart}
            isGenerating={isGenerating}
          />
        </div>

        <WritingSection
          userId={user.id}
          onEntrySaved={(e) => setEntries((prev) => [e, ...prev])}
          onToast={showToast}
        />
        <EntriesSection
          entries={entries}
          interviewSessions={interviewSessions}
          onEntryDeleted={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
          onInterviewDeleted={(id) => setInterviewSessions((prev) => prev.filter((s) => s.id !== id))}
          onToast={showToast}
        />
      </main>

      {/* 인터뷰 세션 오버레이 */}
      {interviewState?.stage === 'session' && (
        <InterviewSessionView
          keyword={interviewState.keyword}
          questions={interviewState.questions}
          onComplete={handleSessionComplete}
          onAbort={() => setInterviewState(null)}
        />
      )}

      {/* 인터뷰 결과 오버레이 */}
      {interviewState?.stage === 'result' && (
        <InterviewResult
          userId={user.id}
          keyword={interviewState.keyword}
          questions={interviewState.questions}
          answers={interviewState.answers}
          fontFamily={interviewState.fontFamily}
          fontSize={interviewState.fontSize}
          photoFiles={interviewState.photoFiles}
          onSaved={handleInterviewSaved}
          onBack={handleResultBack}
          onToast={showToast}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
