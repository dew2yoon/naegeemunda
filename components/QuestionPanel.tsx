'use client'

import { useState, useCallback } from 'react'
import { Category } from '@/types'
import { CATEGORIES, CATEGORY_ICONS, getRandomQuestion } from '@/lib/questions'
import { NANUM_MYEONGJO } from '@/lib/fonts'

interface QuestionPanelProps {
  category: Category
  question: string
  onCategoryChange: (category: Category) => void
  onQuestionChange: (question: string) => void
}

export default function QuestionPanel({
  category,
  question,
  onCategoryChange,
  onQuestionChange,
}: QuestionPanelProps) {
  const [usedIndices, setUsedIndices] = useState<number[]>([])
  const [fading, setFading] = useState(false)

  function handleCategoryChange(cat: Category) {
    onCategoryChange(cat)
    setUsedIndices([])
    const { question: q } = getRandomQuestion(cat, [])
    onQuestionChange(q)
  }

  const handleNewQuestion = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      const { question: q, index } = getRandomQuestion(category, usedIndices)
      setUsedIndices((prev) => [...prev, index])
      onQuestionChange(q)
      setFading(false)
    }, 200)
  }, [category, usedIndices, onQuestionChange])

  return (
    <div className="flex flex-col gap-4">
      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            aria-label={`${cat} 카테고리 선택`}
            className={`text-[13px] px-3 py-1.5 rounded-full transition-colors
              ${cat === category
                ? 'bg-[#7c3aed] text-white'
                : 'bg-[#ede9ff] text-[#5b4f85] hover:bg-[#ddd6f9]'
              }`}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* 질문 카드 */}
      <div className="bg-white rounded-xl border border-[#ddd6f9] p-6 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)] flex-1 flex flex-col justify-between min-h-[200px]">
        <p
          className={`text-[20px] leading-[1.5] text-[#1e1b2e] transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}
          style={{ fontFamily: NANUM_MYEONGJO }}
        >
          {question}
        </p>
        <button
          onClick={handleNewQuestion}
          aria-label="다른 질문 보기"
          className="mt-6 self-start text-[13px] text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-1.5 transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          다른 질문
        </button>
      </div>
    </div>
  )
}
