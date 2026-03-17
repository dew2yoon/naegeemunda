'use client'

import { useRef } from 'react'

interface PhotoUploadProps {
  previews: string[]        // object URL (로컬 미리보기)
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 5

export default function PhotoUpload({ previews, onAdd, onRemove }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false
      if (f.size > MAX_MB * 1024 * 1024) return false
      return true
    })
    if (files.length) onAdd(files)
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={i} className="relative w-20 h-20 shrink-0">
            <img
              src={src}
              alt={`첨부 사진 ${i + 1}`}
              className="w-full h-full object-cover rounded-lg border border-[#e8e5e0]"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`사진 ${i + 1} 제거`}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1816] text-white rounded-full text-[11px] flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="사진 첨부"
          className="w-20 h-20 border-2 border-dashed border-[#e8e5e0] rounded-lg flex flex-col items-center justify-center gap-1 text-[#a09890] hover:border-[#4a6fa5] hover:text-[#4a6fa5] transition-colors shrink-0"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px]">사진 추가</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
