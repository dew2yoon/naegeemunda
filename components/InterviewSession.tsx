'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { FontFamily, FontSize, PhotoMeta } from '@/types'
import { extractPhotoMeta } from '@/lib/extractExif'
import { FONT_CSS_VAR } from '@/lib/fonts'
import PhotoUpload from './PhotoUpload'

const FONT_FAMILIES: FontFamily[] = [
  'Noto Sans KR', 'Noto Serif KR', 'Nanum Gothic',
  'Nanum Myeongjo', 'Gowun Dodum', 'Gowun Batang',
]

interface InterviewSessionProps {
  keyword: string
  questions: string[]
  onComplete: (answers: string[], fontFamily: FontFamily, fontSize: FontSize, photoFiles: File[][], photoMetas: PhotoMeta[][]) => void
  onAbort: () => void
}

export default function InterviewSession({
  keyword,
  questions,
  onComplete,
  onAbort,
}: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''))
  const [fontFamily, setFontFamily] = useState<FontFamily>('Noto Sans KR')
  const [fontSize, setFontSize] = useState<FontSize>('15px')

  const [photoFiles, setPhotoFiles] = useState<File[][]>(Array.from({ length: questions.length }, () => []))
  const [photoPreviews, setPhotoPreviews] = useState<string[][]>(Array.from({ length: questions.length }, () => []))
  const [photoMetas, setPhotoMetas] = useState<PhotoMeta[][]>(Array.from({ length: questions.length }, () => []))

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(180, el.scrollHeight)}px`
    el.focus()
  }, [currentIndex])

  useEffect(() => {
    return () => {
      photoPreviews.flat().forEach(URL.revokeObjectURL)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sessionStorage.setItem(
      'interview_draft',
      JSON.stringify({ keyword, questions, answers, currentIndex })
    )
  }, [answers, currentIndex, keyword, questions])

  function handleAnswerChange(value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = value
      return next
    })
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.max(180, el.scrollHeight)}px`
    }
  }

  const handlePhotosAdd = useCallback(async (files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    const qi = currentIndex

    setPhotoFiles((prev) => {
      const next = [...prev]
      next[qi] = [...next[qi], ...files]
      return next
    })
    setPhotoPreviews((prev) => {
      const next = [...prev]
      next[qi] = [...next[qi], ...newPreviews]
      return next
    })
    setPhotoMetas((prev) => {
      const next = [...prev]
      next[qi] = [...next[qi], ...files.map(() => ({}))]
      return next
    })

    const metas = await Promise.all(files.map((f) => extractPhotoMeta(f)))
    setPhotoMetas((prev) => {
      const next = prev.map((row) => [...row])
      const offset = next[qi].length - files.length
      metas.forEach((m, i) => { next[qi][offset + i] = m })
      return next
    })
  }, [currentIndex])

  const handlePhotoRemove = useCallback((photoIndex: number) => {
    const qi = currentIndex
    setPhotoFiles((prev) => {
      const next = [...prev]
      next[qi] = next[qi].filter((_, i) => i !== photoIndex)
      return next
    })
    setPhotoPreviews((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[qi][photoIndex])
      next[qi] = next[qi].filter((_, i) => i !== photoIndex)
      return next
    })
    setPhotoMetas((prev) => {
      const next = [...prev]
      next[qi] = next[qi].filter((_, i) => i !== photoIndex)
      return next
    })
  }, [currentIndex])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleNext()
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      sessionStorage.removeItem('interview_draft')
      onComplete(answers, fontFamily, fontSize, photoFiles, photoMetas)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const isLast = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="fixed inset-0 z-40 bg-[#f5f3ff] flex flex-col overflow-y-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[#f5f3ff] border-b border-[#ddd6f9] px-6 py-4 flex items-center justify-between">
        <span
          className="text-[15px] font-bold text-[#1e1b2e]"
          style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
        >
          🎙 {keyword} 인터뷰
        </span>
        <button
          onClick={onAbort}
          aria-label="인터뷰 중단"
          className="text-[13px] text-[#9585c2] hover:text-[#5b4f85] transition-colors"
        >
          나중에 계속
        </button>
      </div>

      {/* 진행 바 */}
      <div className="h-1 bg-[#ddd6f9]">
        <div
          className="h-full bg-[#7c3aed] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 본문 */}
      <div className="flex-1 max-w-[720px] w-full mx-auto px-4 py-10 flex flex-col gap-6">
        <p className="text-[13px] text-[#9585c2] text-center">
          Q {currentIndex + 1} / {questions.length}
        </p>

        <p
          className="text-[22px] leading-[1.5] text-[#1e1b2e] text-center"
          style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
        >
          {questions[currentIndex]}
        </p>

        {/* 폰트 선택 */}
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontFamily)}
            aria-label="폰트 선택"
            className="text-[13px] border border-[#ddd6f9] rounded-lg px-3 py-1.5 bg-white text-[#5b4f85] focus:outline-none focus:border-[#7c3aed]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {(['13px', '15px', '17px', '20px'] as FontSize[]).map((s, i) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              aria-label={`글자 크기 ${['작게', '보통', '크게', '매우 크게'][i]}`}
              className={`text-[12px] px-2.5 py-1.5 rounded-lg transition-colors
                ${s === fontSize ? 'bg-[#7c3aed] text-white' : 'bg-[#ede9ff] text-[#5b4f85] hover:bg-[#ddd6f9]'}`}
            >
              {['작게', '보통', '크게', '매우 크게'][i]}
            </button>
          ))}
        </div>

        {/* 답변 에디터 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answers[currentIndex]}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="자유롭게 답변해보세요… (빈 답변도 괜찮아요)"
            aria-label="인터뷰 답변 입력"
            className="w-full min-h-[180px] bg-white border border-[#ddd6f9] rounded-xl p-5 resize-none focus:outline-none focus:border-[#7c3aed] text-[#1e1b2e] placeholder:text-[#9585c2] transition-colors shadow-sm"
            style={{
              fontFamily: FONT_CSS_VAR[fontFamily],
              fontSize,
              lineHeight: '1.8',
            }}
          />
          <span className="absolute bottom-3 right-4 text-[12px] text-[#9585c2]">
            {answers[currentIndex].length}자
          </span>
        </div>

        {/* 사진 첨부 */}
        <PhotoUpload
          previews={photoPreviews[currentIndex]}
          metadatas={photoMetas[currentIndex]}
          onAdd={handlePhotosAdd}
          onRemove={handlePhotoRemove}
        />

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="이전 질문"
            className="flex items-center gap-1.5 text-[13px] text-[#5b4f85] hover:text-[#1e1b2e] disabled:opacity-30 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            이전 질문
          </button>
          <span className="text-[12px] text-[#9585c2]">Cmd + Enter</span>
          <button
            onClick={handleNext}
            aria-label={isLast ? '인터뷰 완료' : '다음 질문'}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#7c3aed] text-white text-[13px] font-medium rounded-xl hover:bg-[#6d28d9] transition-colors"
          >
            {isLast ? '인터뷰 완료 ✓' : '다음 질문'}
            {!isLast && (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
