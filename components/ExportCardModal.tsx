'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Entry } from '@/types'
import {
  loadEntryPhoto,
  generateAllThumbnails,
  drawCardWithPhoto,
  downloadCardPng,
  shareCardInstagram,
  canShareFiles,
} from '@/lib/cardExport'

const TEMPLATE_NAMES = [
  '다크 오버레이',
  '하단 바',
  '그라데이션 무드',
  '폴라로이드',
  '매거진 커버',
  '미니멀 화이트',
  '시네마틱',
  '수채화 감성',
  '스플릿 컬러',
  '타이포그래피',
]

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ size = 24, color = '#7c3aed' }: { size?: number; color?: string }) {
  return (
    <div
      className="rounded-full border-2 border-t-transparent animate-spin"
      style={{ width: size, height: size, borderColor: `${color}40`, borderTopColor: color }}
    />
  )
}

// ─── Thumbnail Grid Item ──────────────────────────────────────────────────────

function ThumbItem({
  index,
  dataUrl,
  loading,
  selected,
  onSelect,
}: {
  index: number
  dataUrl: string | null
  loading: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onSelect}
        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none ${
          selected
            ? 'border-[#7c3aed] shadow-[0_0_0_3px_rgba(124,58,237,0.25)]'
            : 'border-[#ede9ff] hover:border-[#c4b5fd]'
        }`}
      >
        {loading || !dataUrl ? (
          <div className="absolute inset-0 bg-[#f5f3ff] flex items-center justify-center">
            <Spinner size={20} />
          </div>
        ) : (
          <img
            src={dataUrl}
            alt={TEMPLATE_NAMES[index]}
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}
        {/* Number badge */}
        <div
          className="absolute top-1 left-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
        >
          {index + 1}
        </div>
        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>
      <span className="text-[10px] text-[#9585c2] text-center leading-tight px-0.5">
        {TEMPLATE_NAMES[index]}
      </span>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface ExportCardModalProps {
  entry: Entry
  onClose: () => void
}

export default function ExportCardModal({ entry, onClose }: ExportCardModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)          // 0-based
  const [thumbnails, setThumbnails] = useState<(string | null)[]>(Array(10).fill(null))
  const [thumbsLoading, setThumbsLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const isMobile = mounted && canShareFiles()

  // Store preloaded photo so we don't re-fetch on every render
  const photoRef = useRef<HTMLImageElement | null>(null)
  const mountedRef = useRef(false)

  // Portal safety: only render after client mount
  useEffect(() => {
    setMounted(true)
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Preload photo + generate all thumbnails on open
  useEffect(() => {
    if (!mounted) return
    let cancelled = false

    async function init() {
      setThumbsLoading(true)
      try {
        // 1. Load photo once
        const photo = await loadEntryPhoto(entry)
        if (cancelled) return
        photoRef.current = photo
        console.debug('[ExportCardModal] photo loaded:', photo ? `${photo.naturalWidth}x${photo.naturalHeight}` : 'null (no photo)')

        // 2. Generate all 10 thumbnails in parallel (small size = fast)
        const thumbDataUrls = await generateAllThumbnails(entry, photo, 220)
        if (cancelled) return
        setThumbnails(thumbDataUrls)
        // Use first thumbnail as initial preview (upscaled)
        setPreviewUrl(thumbDataUrls[0] ?? null)
      } catch (e) {
        console.error('[ExportCardModal] init error:', e)
      } finally {
        if (!cancelled) setThumbsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [mounted, entry])

  // Re-render preview at higher res when selection changes
  const renderPreview = useCallback(async (idx: number) => {
    setPreviewLoading(true)
    try {
      const canvas = document.createElement('canvas')
      await drawCardWithPhoto(canvas, entry, idx + 1, 500, photoRef.current ?? null)
      if (mountedRef.current) setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9))
    } catch (e) {
      console.error('[ExportCardModal] preview render error:', e)
      // Fallback to thumbnail
      setPreviewUrl(thumbnails[idx] ?? null)
    } finally {
      if (mountedRef.current) setPreviewLoading(false)
    }
  }, [entry, thumbnails])

  const handleSelect = useCallback((idx: number) => {
    if (idx === selectedIdx) return
    setSelectedIdx(idx)
    renderPreview(idx)
  }, [selectedIdx, renderPreview])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      await downloadCardPng(entry, selectedIdx + 1, photoRef.current)
    } catch (e) {
      console.error('[ExportCardModal] download error:', e)
    } finally {
      setIsDownloading(false)
    }
  }, [entry, selectedIdx])

  const handleShare = useCallback(async () => {
    setIsSharing(true)
    try {
      await shareCardInstagram(entry, selectedIdx + 1, photoRef.current)
    } catch (e) {
      console.error('[ExportCardModal] share error:', e)
    } finally {
      setIsSharing(false)
    }
  }, [entry, selectedIdx])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!mounted) return null

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#ede9ff] shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1e1b2e]">이미지 카드 내보내기</h2>
            <p className="text-[12px] text-[#9585c2] mt-0.5">
              1080 × 1080 px PNG
              {entry.photos?.length ? ' · 첨부 사진 포함' : ' · 라벤더 배경'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9585c2] hover:text-[#1e1b2e] hover:bg-[#ede9ff] rounded-lg transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Thumbnail Grid */}
          <div>
            <p className="text-[13px] font-medium text-[#5b4f85] mb-3">
              템플릿 선택
              {thumbsLoading && (
                <span className="ml-2 text-[11px] text-[#9585c2] font-normal">미리보기 생성 중…</span>
              )}
            </p>
            <div className="grid grid-cols-5 gap-3">
              {TEMPLATE_NAMES.map((_, i) => (
                <ThumbItem
                  key={i}
                  index={i}
                  dataUrl={thumbnails[i]}
                  loading={thumbsLoading && !thumbnails[i]}
                  selected={selectedIdx === i}
                  onSelect={() => handleSelect(i)}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[13px] font-medium text-[#5b4f85] mb-3">
              미리보기 —{' '}
              <span className="text-[#7c3aed]">{TEMPLATE_NAMES[selectedIdx]}</span>
            </p>
            <div className="flex justify-center">
              <div className="w-[400px] h-[400px] rounded-xl overflow-hidden border border-[#ede9ff] shadow-md bg-[#f5f3ff] flex items-center justify-center relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="카드 미리보기"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Spinner size={32} />
                )}
                {previewLoading && previewUrl && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Spinner size={28} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] rounded-lg transition-colors"
            >
              닫기
            </button>

            {/* Instagram share — mobile only */}
            {isMobile && (
              <button
                onClick={handleShare}
                disabled={isSharing || isDownloading || thumbsLoading}
                className="px-5 py-2.5 text-[13px] font-medium bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white rounded-xl transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isSharing ? (
                  <><Spinner size={15} color="#fff" />공유 중…</>
                ) : (
                  <>📤 인스타그램에 공유</>
                )}
              </button>
            )}

            {/* Download — always shown */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isSharing || thumbsLoading}
              className="px-5 py-2.5 text-[13px] font-medium bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDownloading ? (
                <><Spinner size={15} color="#fff" />저장 중…</>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isMobile ? '📸 사진 앨범에 저장' : 'PNG 다운로드 (1080×1080)'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
