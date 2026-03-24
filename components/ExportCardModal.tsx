'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Entry } from '@/types'
import { drawCard, downloadCardPng } from '@/lib/cardExport'

interface Template {
  id: number
  name: string
  // CSS thumbnail design tokens
  bg: string
  accent: string
  layout: 'overlay' | 'split-h' | 'gradient-bottom' | 'polaroid' | 'magazine' | 'white' | 'cinema' | 'watercolor' | 'split-v' | 'typo'
}

const TEMPLATES: Template[] = [
  { id: 1,  name: '다크 오버레이',   bg: 'linear-gradient(135deg,#2d1b4e,#1a1a2e)', accent: '#fff',    layout: 'overlay' },
  { id: 2,  name: '하단 바',         bg: 'linear-gradient(135deg,#c4b5fd,#ddd6f9)', accent: '#7c3aed', layout: 'split-h' },
  { id: 3,  name: '그라데이션 무드', bg: 'linear-gradient(135deg,#7c3aed,#c4b5fd)', accent: '#fff',    layout: 'gradient-bottom' },
  { id: 4,  name: '폴라로이드',      bg: '#f5f0e8',                                  accent: '#5b4f85', layout: 'polaroid' },
  { id: 5,  name: '매거진 커버',     bg: 'linear-gradient(135deg,#1a1a2e,#4c1d95)', accent: '#c4b5fd', layout: 'magazine' },
  { id: 6,  name: '미니멀 화이트',   bg: '#ffffff',                                  accent: '#7c3aed', layout: 'white' },
  { id: 7,  name: '시네마틱',        bg: '#0a0a0a',                                  accent: '#fff',    layout: 'cinema' },
  { id: 8,  name: '수채화 감성',     bg: 'linear-gradient(135deg,#f0e6ff,#fce4ec,#fff)', accent: '#5b4f85', layout: 'watercolor' },
  { id: 9,  name: '스플릿 컬러',     bg: 'linear-gradient(90deg,#ddd6f9 50%,#7c3aed 50%)', accent: '#fff', layout: 'split-v' },
  { id: 10, name: '타이포그래피',    bg: '#f5f3ff',                                  accent: '#7c3aed', layout: 'typo' },
]

function ThumbnailCard({ template, selected, onClick }: {
  template: Template
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all border-2 focus:outline-none ${
        selected
          ? 'border-[#7c3aed] shadow-[0_0_0_3px_rgba(124,58,237,0.25)]'
          : 'border-transparent hover:border-[#c4b5fd]'
      }`}
      title={template.name}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: template.bg }} />

      {/* Layout overlay hint */}
      <ThumbnailLayout layout={template.layout} accent={template.accent} />

      {/* Template number */}
      <div
        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}
      >
        {template.id}
      </div>
    </button>
  )
}

function ThumbnailLayout({ layout, accent }: { layout: Template['layout']; accent: string }) {
  const base = 'absolute inset-0 flex flex-col'
  switch (layout) {
    case 'overlay':
      return (
        <div className={base} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1 px-2">
            <div className="h-1.5 w-14 rounded" style={{ background: accent, opacity: 0.9 }} />
            <div className="h-1 w-10 rounded" style={{ background: accent, opacity: 0.6 }} />
          </div>
        </div>
      )
    case 'split-h':
      return (
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-white/95" />
          <div className="absolute bottom-[35%] left-2 w-1 h-[22%] rounded-full" style={{ background: '#7c3aed' }} />
          <div className="absolute bottom-[24%] left-4 right-2 flex flex-col gap-1">
            <div className="h-1.5 w-12 rounded" style={{ background: '#1e1b2e', opacity: 0.7 }} />
            <div className="h-1 w-9 rounded" style={{ background: '#5b4f85', opacity: 0.5 }} />
          </div>
        </div>
      )
    case 'gradient-bottom':
      return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(124,58,237,0.8) 0%,transparent 55%)' }}>
          <div className="absolute bottom-3 left-2 flex flex-col gap-1">
            <div className="h-1.5 w-14 rounded" style={{ background: accent, opacity: 0.9 }} />
            <div className="h-1 w-9 rounded" style={{ background: accent, opacity: 0.7 }} />
          </div>
        </div>
      )
    case 'polaroid':
      return (
        <div className="absolute inset-0 flex items-start justify-center pt-2">
          <div className="bg-white rounded shadow-md w-[70%] h-[75%] flex flex-col overflow-hidden">
            <div className="flex-1" style={{ background: 'linear-gradient(135deg,#ddd6f9,#c4b5fd)' }} />
            <div className="h-5 flex items-center justify-center">
              <div className="h-1 w-8 rounded" style={{ background: '#5b4f85', opacity: 0.6 }} />
            </div>
          </div>
        </div>
      )
    case 'magazine':
      return (
        <div className={base} style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="absolute top-2 left-2 right-2 flex flex-col gap-0.5">
            <div className="h-2.5 w-16 rounded" style={{ background: '#fff', opacity: 0.9 }} />
            <div className="h-0.5 w-full rounded" style={{ background: '#7c3aed' }} />
          </div>
          <div className="absolute bottom-3 left-2 right-2">
            <div className="text-[16px] font-bold leading-none mb-0.5" style={{ color: '#c4b5fd' }}>"</div>
            <div className="h-1.5 w-12 rounded mb-1" style={{ background: '#fff', opacity: 0.85 }} />
            <div className="h-1 w-8 rounded" style={{ background: '#fff', opacity: 0.55 }} />
          </div>
        </div>
      )
    case 'white':
      return (
        <div className={base}>
          <div className="absolute top-2 right-2 w-10 h-10 rounded-full border border-[#ddd6f9] overflow-hidden">
            <div style={{ background: 'linear-gradient(135deg,#ddd6f9,#c4b5fd)', width: '100%', height: '100%' }} />
          </div>
          <div className="absolute top-14 left-2 right-12 flex flex-col gap-1">
            <div className="text-[28px] font-bold leading-none" style={{ color: '#c4b5fd' }}>"</div>
            <div className="h-1.5 w-12 rounded" style={{ background: '#5b4f85', opacity: 0.7 }} />
            <div className="h-1 w-9 rounded" style={{ background: '#5b4f85', opacity: 0.5 }} />
          </div>
        </div>
      )
    case 'cinema':
      return (
        <div className="absolute inset-0 flex flex-col">
          <div className="bg-[#0a0a0a] h-[22%] flex items-center justify-center">
            <div className="h-1 w-8 rounded" style={{ background: '#fff', opacity: 0.5 }} />
          </div>
          <div className="flex-1" style={{ background: 'linear-gradient(135deg,#3b0764,#7c3aed)' }} />
          <div className="bg-[#0a0a0a] h-[22%] flex flex-col items-center justify-center gap-0.5">
            <div className="h-1.5 w-12 rounded" style={{ background: '#fff', opacity: 0.8 }} />
            <div className="h-1 w-9 rounded" style={{ background: '#fff', opacity: 0.5 }} />
          </div>
        </div>
      )
    case 'watercolor':
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg w-[75%] h-[65%] flex flex-col gap-1 p-2">
            <div className="h-1 w-8 rounded" style={{ background: '#7c3aed', opacity: 0.5 }} />
            <div className="h-2 w-12 rounded" style={{ background: '#5b4f85', opacity: 0.7 }} />
            <div className="h-0.5 w-full rounded mt-0.5" style={{ background: '#ddd6f9' }} />
            <div className="h-1 w-10 rounded" style={{ background: '#3d3b4e', opacity: 0.5 }} />
            <div className="h-1 w-8 rounded" style={{ background: '#3d3b4e', opacity: 0.4 }} />
          </div>
        </div>
      )
    case 'split-v':
      return (
        <div className="absolute inset-0 flex">
          <div className="w-1/2" />
          <div className="w-1/2 flex flex-col gap-1 p-2">
            <div className="text-[18px] font-bold" style={{ color: '#c4b5fd', lineHeight: 1 }}>"</div>
            <div className="h-1.5 w-8 rounded mt-0.5" style={{ background: '#fff', opacity: 0.85 }} />
            <div className="h-1 w-6 rounded" style={{ background: '#fff', opacity: 0.65 }} />
          </div>
        </div>
      )
    case 'typo':
      return (
        <div className={base}>
          <div className="absolute text-[48px] font-bold leading-none" style={{ color: '#c4b5fd', top: 2, left: 4 }}>"</div>
          <div className="absolute top-10 left-2 right-2 flex flex-col gap-1">
            <div className="h-2.5 w-full rounded" style={{ background: '#1e1b2e', opacity: 0.7 }} />
            <div className="h-2 w-11 rounded" style={{ background: '#1e1b2e', opacity: 0.6 }} />
            <div className="h-0.5 w-8 rounded mt-0.5" style={{ background: '#7c3aed' }} />
            <div className="h-1 w-10 rounded" style={{ background: '#4b4480', opacity: 0.55 }} />
          </div>
          <div className="absolute text-[36px] font-bold leading-none" style={{ color: '#c4b5fd', bottom: 2, right: 4 }}>"</div>
        </div>
      )
    default: return null
  }
}

interface ExportCardModalProps {
  entry: Entry
  onClose: () => void
}

export default function ExportCardModal({ entry, onClose }: ExportCardModalProps) {
  const [selectedId, setSelectedId] = useState(1)
  const [isRendering, setIsRendering] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('')

  const renderPreview = useCallback(async (templateId: number) => {
    setIsRendering(true)
    try {
      const canvas = document.createElement('canvas')
      await drawCard(canvas, entry, templateId, 600)
      setPreviewDataUrl(canvas.toDataURL('image/png'))
    } catch (e) {
      console.error('Preview render error:', e)
    } finally {
      setIsRendering(false)
    }
  }, [entry])

  useEffect(() => {
    renderPreview(selectedId)
  }, [selectedId, renderPreview])

  const handleSelect = (id: number) => {
    if (id === selectedId) return
    setSelectedId(id)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadCardPng(entry, selectedId)
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setIsDownloading(false)
    }
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedId)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#ede9ff]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1e1b2e]">이미지 카드 내보내기</h2>
            <p className="text-[12px] text-[#9585c2] mt-0.5">1080×1080px PNG 다운로드</p>
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

        <div className="p-6 flex flex-col gap-6">
          {/* Template grid */}
          <div>
            <p className="text-[13px] font-medium text-[#5b4f85] mb-3">템플릿 선택</p>
            <div className="grid grid-cols-5 gap-2.5">
              {TEMPLATES.map((t) => (
                <div key={t.id} className="flex flex-col items-center gap-1">
                  <ThumbnailCard
                    template={t}
                    selected={t.id === selectedId}
                    onClick={() => handleSelect(t.id)}
                  />
                  <span className="text-[10px] text-[#9585c2] text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[13px] font-medium text-[#5b4f85] mb-3">
              미리보기 — <span className="text-[#7c3aed]">{selectedTemplate.name}</span>
            </p>
            <div className="relative flex justify-center">
              <div className="w-[360px] h-[360px] rounded-xl overflow-hidden border border-[#ede9ff] shadow-md bg-[#f5f3ff] flex items-center justify-center">
                {isRendering ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] text-[#9585c2]">렌더링 중...</span>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="카드 미리보기"
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Hidden canvas for ref */}
          <canvas ref={previewCanvasRef} className="hidden" />

          {/* Download button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] text-[#5b4f85] hover:bg-[#ede9ff] rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading || isRendering}
              className="px-6 py-2.5 text-[13px] font-medium bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PNG 다운로드 (1080×1080)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
