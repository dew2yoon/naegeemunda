'use client'

import { useState } from 'react'
import { Entry } from '@/types'
import { exportSingleEntryHtml, exportInstagramCardHtml, exportBlogPostHtml } from '@/lib/exportHtml'
import { FONT_CSS_VAR, NANUM_MYEONGJO } from '@/lib/fonts'
import Lightbox from './Lightbox'

interface EntryCardProps {
  entry: Entry
  onDelete: (id: string) => void
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const dateStr = new Date(entry.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  async function handleCopyText() {
    const answerText = entry.answer.startsWith('<')
      ? new DOMParser().parseFromString(entry.answer, 'text/html').body.innerText
      : entry.answer
    const text = `${entry.question}\n\n${answerText}\n\n— ${dateStr}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API 미지원 폴백
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#ddd6f9] p-5 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] bg-[#ede9ff] text-[#7c3aed] px-2.5 py-0.5 rounded-full">
            {entry.category}
          </span>
          <span className="text-[12px] text-[#9585c2]">{dateStr}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          {/* 텍스트 복사 */}
          <button
            onClick={handleCopyText}
            aria-label="텍스트 복사"
            title={copied ? '복사됨!' : '텍스트 복사'}
            className={`p-1.5 rounded-lg transition-colors
              ${copied
                ? 'text-green-500 bg-green-50'
                : 'text-[#9585c2] hover:text-[#7c3aed] hover:bg-[#ede9ff]'
              }`}
          >
            {copied ? (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {/* 내보내기 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              aria-label="내보내기"
              title="내보내기"
              className="p-1.5 text-[#9585c2] hover:text-[#7c3aed] hover:bg-[#ede9ff] rounded-lg transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-[#ddd6f9] rounded-xl shadow-lg py-1 w-44">
                  <button
                    onClick={() => { exportSingleEntryHtml(entry); setShowExportMenu(false) }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] transition-colors flex items-center gap-2"
                  >
                    📄 HTML 내보내기
                  </button>
                  <button
                    onClick={() => { exportInstagramCardHtml(entry); setShowExportMenu(false) }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] transition-colors flex items-center gap-2"
                  >
                    📸 인스타그램 카드
                  </button>
                  <button
                    onClick={() => { exportBlogPostHtml(entry); setShowExportMenu(false) }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] transition-colors flex items-center gap-2"
                  >
                    📝 블로그 포스트
                  </button>
                </div>
              </>
            )}
          </div>
          {/* 삭제 */}
          <button
            onClick={() => setShowConfirm(true)}
            aria-label="삭제"
            title="삭제"
            className="p-1.5 text-[#9585c2] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 질문 */}
      <p
        className="text-[14px] text-[#5b4f85] mb-3"
        style={{ fontFamily: NANUM_MYEONGJO }}
      >
        {entry.question}
      </p>

      {/* 답변 */}
      <div
        className="text-[14px] text-[#1e1b2e] line-clamp-3 leading-relaxed tiptap"
        style={{
          fontFamily: FONT_CSS_VAR[entry.font_family],
          fontSize: entry.font_size,
        }}
        dangerouslySetInnerHTML={{ __html: entry.answer }}
      />

      {/* 사진 썸네일 */}
      {(entry.photos ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {(entry.photos ?? []).map((url, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              aria-label={`사진 ${i + 1} 크게 보기`}
              className="w-16 h-16 rounded-lg overflow-hidden border border-[#ddd6f9] hover:opacity-90 transition-opacity shrink-0"
            >
              <img src={url} alt={`첨부 사진 ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <Lightbox
          urls={entry.photos ?? []}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <p className="text-[15px] text-[#1e1b2e] mb-5">이 기록을 삭제할까요?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => { onDelete(entry.id); setShowConfirm(false) }}
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
