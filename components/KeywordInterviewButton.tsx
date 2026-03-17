'use client'

import { useState, useRef, useEffect } from 'react'

interface KeywordInterviewButtonProps {
  onStart: (keyword: string) => void
  isGenerating: boolean
}

export default function KeywordInterviewButton({ onStart, isGenerating }: KeywordInterviewButtonProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || isGenerating) return
    onStart(keyword.trim())
    setOpen(false)
    setKeyword('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="키워드로 인터뷰하기"
        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e5e0] text-[14px] text-[#4a6fa5] font-medium rounded-xl hover:bg-[#eef2f8] hover:border-[#4a6fa5] transition-colors shadow-sm"
      >
        🎙 키워드로 인터뷰하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-7 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2
              className="text-[20px] font-bold text-[#1a1816] mb-2"
              style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
            >
              어떤 주제로 인터뷰할까요?
            </h2>
            <p className="text-[13px] text-[#a09890] mb-5">
              키워드를 입력하면 AI가 6개의 맞춤 질문을 생성합니다.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: CES 전시, 첫 번째 발표, 팀 프로젝트…"
                maxLength={50}
                className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-[14px] text-[#1a1816] focus:outline-none focus:border-[#4a6fa5] placeholder:text-[#a09890]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setKeyword('') }}
                  className="px-4 py-2 text-[13px] text-[#6b6560] hover:bg-[#f2f1ee] rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!keyword.trim() || isGenerating}
                  className="px-5 py-2 bg-[#4a6fa5] text-white text-[13px] font-medium rounded-lg hover:bg-[#3a5f95] disabled:opacity-40 transition-colors"
                >
                  {isGenerating ? '질문 생성 중…' : '인터뷰 시작'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
