'use client'

import { useEffect, useCallback } from 'react'

interface LightboxProps {
  urls: string[]
  index: number
  onClose: () => void
  onNav: (index: number) => void
}

export default function Lightbox({ urls, index, onClose, onNav }: LightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
    if (e.key === 'ArrowRight' && index < urls.length - 1) onNav(index + 1)
  }, [index, urls.length, onClose, onNav])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 닫기 */}
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 이전 */}
      {index > 0 && (
        <button
          aria-label="이전 사진"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          className="absolute left-4 text-white/70 hover:text-white p-3"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <img
        src={urls[index]}
        alt={`사진 ${index + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 다음 */}
      {index < urls.length - 1 && (
        <button
          aria-label="다음 사진"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          className="absolute right-4 text-white/70 hover:text-white p-3"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 페이지 인디케이터 */}
      {urls.length > 1 && (
        <div className="absolute bottom-4 flex gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              aria-label={`사진 ${i + 1}로 이동`}
              onClick={(e) => { e.stopPropagation(); onNav(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
