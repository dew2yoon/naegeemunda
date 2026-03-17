'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { FontFamily, FontSize } from '@/types'
import { FONT_CSS_VAR } from '@/lib/fonts'
import PhotoUpload from './PhotoUpload'

const FONT_FAMILIES: FontFamily[] = [
  'Noto Sans KR',
  'Noto Serif KR',
  'Nanum Gothic',
  'Nanum Myeongjo',
  'Gowun Dodum',
  'Gowun Batang',
]

const FONT_SIZES: { label: string; value: FontSize }[] = [
  { label: '작게', value: '13px' },
  { label: '보통', value: '15px' },
  { label: '크게', value: '17px' },
  { label: '매우 크게', value: '20px' },
]

interface EditorPanelProps {
  answer: string
  fontFamily: FontFamily
  fontSize: FontSize
  isSaving: boolean
  photoPreviews: string[]
  onChange: (answer: string) => void
  onFontFamilyChange: (font: FontFamily) => void
  onFontSizeChange: (size: FontSize) => void
  onSave: () => void
  onPhotosAdd: (files: File[]) => void
  onPhotoRemove: (index: number) => void
}

export default function EditorPanel({
  answer,
  fontFamily,
  fontSize,
  isSaving,
  photoPreviews,
  onChange,
  onFontFamilyChange,
  onFontSizeChange,
  onSave,
  onPhotosAdd,
  onPhotoRemove,
}: EditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(220, el.scrollHeight)}px`
  }, [answer])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSave()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 폰트 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value as FontFamily)}
          aria-label="폰트 선택"
          className="text-[13px] border border-[#e8e5e0] rounded-lg px-3 py-1.5 bg-white text-[#6b6560] focus:outline-none focus:border-[#4a6fa5]"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {FONT_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => onFontSizeChange(s.value)}
              aria-label={`글자 크기 ${s.label}`}
              className={`text-[12px] px-2.5 py-1.5 rounded-lg transition-colors
                ${s.value === fontSize
                  ? 'bg-[#4a6fa5] text-white'
                  : 'bg-[#f2f1ee] text-[#6b6560] hover:bg-[#e8e5e0]'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 텍스트에어리어 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="지금 이 순간의 생각을 자유롭게 적어보세요…"
          aria-label="답변 입력"
          className="w-full min-h-[220px] bg-[#f2f1ee] border border-[#e8e5e0] rounded-xl p-4 resize-none focus:outline-none focus:border-[#4a6fa5] text-[#1a1816] placeholder:text-[#a09890] transition-colors"
          style={{
            fontFamily: FONT_CSS_VAR[fontFamily],
            fontSize,
            lineHeight: '1.8',
          }}
        />
        <span className="absolute bottom-3 right-4 text-[12px] text-[#a09890]">
          {answer.length}자
        </span>
      </div>

      {/* 사진 첨부 */}
      <PhotoUpload
        previews={photoPreviews}
        onAdd={onPhotosAdd}
        onRemove={onPhotoRemove}
      />

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#a09890]">Cmd + Enter로 저장</span>
        <button
          onClick={onSave}
          disabled={isSaving || !answer.trim()}
          aria-label="저장하기"
          className="px-5 py-2.5 bg-[#4a6fa5] text-white text-[14px] font-medium rounded-xl hover:bg-[#3a5f95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '저장 중…' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
