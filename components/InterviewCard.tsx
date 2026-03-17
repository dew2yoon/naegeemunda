'use client'

import { useState } from 'react'
import { InterviewSession } from '@/types'
import { FONT_CSS_VAR, NANUM_MYEONGJO } from '@/lib/fonts'
import { exportInterviewSessionHtml } from '@/lib/exportHtml'
import { createClient } from '@/lib/supabase'
import Lightbox from './Lightbox'

interface InterviewCardProps {
  session: InterviewSession
  onDelete: (id: string) => void
}

export default function InterviewCard({ session, onDelete }: InterviewCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  const dateStr = new Date(session.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('interview_sessions').delete().eq('id', session.id)
    onDelete(session.id)
    setShowConfirm(false)
  }

  // 질문 인덱스 → 사진 URL 배열 맵
  const photoMap = new Map(session.photos.map((p) => [p.question_index, p.urls]))

  const firstAnswer = session.answers.find((a) => a.trim()) ?? ''
  const totalPhotos = session.photos.reduce((sum, p) => sum + p.urls.length, 0)

  return (
    <div className="bg-white rounded-xl border border-[#e8e5e0] p-5 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] bg-[#eef2f8] text-[#4a6fa5] px-2.5 py-0.5 rounded-full">
            🎙 {session.keyword} 인터뷰
          </span>
          <span className="text-[12px] text-[#a09890]">{dateStr}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => exportInterviewSessionHtml(session)}
            aria-label="HTML로 내보내기"
            title="HTML로 내보내기"
            className="p-1.5 text-[#a09890] hover:text-[#4a6fa5] hover:bg-[#eef2f8] rounded-lg transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label="삭제"
            title="삭제"
            className="p-1.5 text-[#a09890] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 질문/사진 개수 */}
      <p className="text-[12px] text-[#a09890] mb-3">
        질문 {session.questions.length}개 · 답변 {session.answers.filter((a) => a.trim()).length}개
        {totalPhotos > 0 && ` · 사진 ${totalPhotos}장`}
      </p>

      {/* 접힌 상태: 첫 번째 질문 미리보기 */}
      {!expanded && (
        <>
          <p
            className="text-[13px] text-[#6b6560] mb-1"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            {session.questions[0]}
          </p>
          {firstAnswer && (
            <p
              className="text-[13px] text-[#1a1816] line-clamp-3 leading-relaxed"
              style={{
                fontFamily: FONT_CSS_VAR[session.font_family],
                fontSize: session.font_size,
              }}
            >
              {firstAnswer}
            </p>
          )}
          {/* 첫 번째 질문 사진 썸네일 */}
          {photoMap.get(0)?.length ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {photoMap.get(0)!.map((url, j) => (
                <button
                  key={j}
                  onClick={() => setLightbox({ urls: photoMap.get(0)!, index: j })}
                  aria-label={`사진 ${j + 1} 크게 보기`}
                  className="w-14 h-14 rounded-lg overflow-hidden border border-[#e8e5e0] hover:opacity-90 transition-opacity shrink-0"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* 펼쳐보기: 전체 Q&A + 질문별 사진 */}
      {expanded && (
        <div className="flex flex-col gap-6 mt-2">
          {session.questions.map((q, i) => {
            const qPhotos = photoMap.get(i) ?? []
            return (
              <div key={i}>
                <p
                  className="text-[13px] text-[#4a6fa5] mb-1"
                  style={{ fontFamily: NANUM_MYEONGJO }}
                >
                  Q{i + 1}. {q}
                </p>
                <p
                  className="text-[13px] text-[#1a1816] leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontFamily: FONT_CSS_VAR[session.font_family],
                    fontSize: session.font_size,
                  }}
                >
                  {session.answers[i] || <span className="text-[#a09890]">—</span>}
                </p>
                {qPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {qPhotos.map((url, j) => (
                      <button
                        key={j}
                        onClick={() => setLightbox({ urls: qPhotos, index: j })}
                        aria-label={`Q${i + 1} 사진 ${j + 1} 크게 보기`}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-[#e8e5e0] hover:opacity-90 transition-opacity shrink-0"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-[12px] text-[#4a6fa5] hover:text-[#3a5f95] transition-colors"
      >
        {expanded ? '접기 ▲' : '전체 보기 ▼'}
      </button>

      {/* 라이트박스 */}
      {lightbox && (
        <Lightbox
          urls={lightbox.urls}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={(idx) => setLightbox((prev) => prev ? { ...prev, index: idx } : null)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <p className="text-[15px] text-[#1a1816] mb-5">이 인터뷰 기록을 삭제할까요?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-[13px] text-[#6b6560] hover:bg-[#f2f1ee] rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-[13px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
