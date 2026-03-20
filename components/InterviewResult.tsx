'use client'

import { useState, useEffect } from 'react'
import { FontFamily, FontSize, InterviewSession, PhotoMeta } from '@/types'
import { FONT_CSS_VAR } from '@/lib/fonts'
import { exportInterviewSessionHtml } from '@/lib/exportHtml'
import { compressImage } from '@/lib/imageCompress'
import { createClient } from '@/lib/supabase'
import Lightbox from './Lightbox'

interface InterviewResultProps {
  userId: string
  keyword: string
  questions: string[]
  answers: string[]
  fontFamily: FontFamily
  fontSize: FontSize
  photoFiles: File[][]
  photoMetas: PhotoMeta[][]
  onSaved: (session: InterviewSession) => void
  onBack: () => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export default function InterviewResult({
  userId,
  keyword,
  questions,
  answers,
  fontFamily,
  fontSize,
  photoFiles,
  photoMetas,
  onSaved,
  onBack,
  onToast,
}: InterviewResultProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  // 각 질문별 미리보기 object URL 생성
  const [previews, setPreviews] = useState<string[][]>([])
  useEffect(() => {
    const created = photoFiles.map((files) => files.map((f) => URL.createObjectURL(f)))
    setPreviews(created)
    return () => { created.flat().forEach(URL.revokeObjectURL) }
  }, [photoFiles])

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()

    // 1. interview_session insert → id 획득
    const { data: session, error: insertError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        keyword,
        questions,
        answers,
        photos: [],
        photo_metadata: [],
        font_family: fontFamily,
        font_size: fontSize,
      })
      .select()
      .single()

    if (insertError || !session) {
      setIsSaving(false)
      onToast('저장에 실패했습니다.', 'error')
      return
    }

    // 2. 각 질문별 사진 압축 → Storage 업로드
    const photosPayload: { question_index: number; urls: string[] }[] = []
    const metaPayload: { question_index: number; metas: PhotoMeta[] }[] = []

    await Promise.all(
      photoFiles.map(async (files, qIdx) => {
        if (files.length === 0) return
        const pairs: { url: string; meta: PhotoMeta }[] = []
        await Promise.all(
          files.map(async (file, fIdx) => {
            try {
              const compressed = await compressImage(file)
              const path = `${userId}/${session.id}/${qIdx}_${Date.now()}_${fIdx}.jpg`
              const { error } = await supabase.storage
                .from('entry-photos')
                .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
              if (error) { console.error('[인터뷰 사진 업로드 실패]', error); return }
              const { data: urlData } = supabase.storage
                .from('entry-photos')
                .getPublicUrl(path)
              pairs.push({ url: urlData.publicUrl, meta: photoMetas[qIdx]?.[fIdx] ?? {} })
            } catch { /* 실패한 사진은 건너뜀 */ }
          })
        )
        if (pairs.length > 0) {
          photosPayload.push({ question_index: qIdx, urls: pairs.map((p) => p.url) })
          metaPayload.push({ question_index: qIdx, metas: pairs.map((p) => p.meta) })
        }
      })
    )

    // 3. photos + photo_metadata 업데이트
    if (photosPayload.length > 0) {
      await supabase
        .from('interview_sessions')
        .update({ photos: photosPayload, photo_metadata: metaPayload })
        .eq('id', session.id)
    }

    setIsSaving(false)
    onToast('인터뷰가 저장되었습니다!')
    onSaved({ ...session, photos: photosPayload, photo_metadata: metaPayload } as InterviewSession)
  }

  function handleExport() {
    // 미리보기 URL은 export에 사용 불가 (object URL) → 저장 후 내보내기 권장
    const tempSession: InterviewSession = {
      id: 'temp',
      user_id: userId,
      keyword,
      questions,
      answers,
      photos: [],
      photo_metadata: [],
      font_family: fontFamily,
      font_size: fontSize,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    exportInterviewSessionHtml(tempSession)
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#f5f3ff] flex flex-col overflow-y-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[#f5f3ff] border-b border-[#ddd6f9] px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="인터뷰로 돌아가기"
          className="flex items-center gap-1.5 text-[13px] text-[#5b4f85] hover:text-[#1e1b2e] transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          수정하기
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            aria-label="HTML로 내보내기"
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[#7c3aed] border border-[#7c3aed] rounded-lg hover:bg-[#ede9ff] transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            내보내기
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            aria-label="저장하기"
            className="flex items-center gap-1.5 px-5 py-2 bg-[#7c3aed] text-white text-[13px] font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
          >
            {isSaving ? '저장 중…' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="flex-1 max-w-[720px] w-full mx-auto px-4 py-10">
        {/* 인터뷰 타이틀 */}
        <div className="text-center mb-10">
          <div
            className="text-[24px] font-bold text-[#1e1b2e] mb-3"
            style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
          >
            🎙 {keyword} 인터뷰
          </div>
          <div className="text-[13px] text-[#9585c2]">{dateStr}</div>
        </div>

        <hr className="border-[#ddd6f9] mb-8" />

        {/* Q&A 목록 */}
        <div className="flex flex-col gap-8">
          {questions.map((q, i) => (
            <div key={i}>
              <p
                className="text-[16px] text-[#7c3aed] mb-3 leading-relaxed"
                style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
              >
                Q. {q}
              </p>
              <div
                className="bg-white rounded-xl border border-[#ddd6f9] px-5 py-4 text-[#1e1b2e] whitespace-pre-wrap leading-relaxed min-h-[60px]"
                style={{ fontFamily: FONT_CSS_VAR[fontFamily], fontSize }}
              >
                {answers[i] || (
                  <span className="text-[#9585c2] text-[13px]">— 답변 없음 —</span>
                )}
              </div>
              {/* 사진 미리보기 */}
              {previews[i]?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previews[i].map((src, j) => (
                    <button
                      key={j}
                      onClick={() => setLightbox({ urls: previews[i], index: j })}
                      aria-label={`Q${i + 1} 사진 ${j + 1} 크게 보기`}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-[#ddd6f9] hover:opacity-90 transition-opacity shrink-0"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 라이트박스 */}
      {lightbox && (
        <Lightbox
          urls={lightbox.urls}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={(idx) => setLightbox((prev) => prev ? { ...prev, index: idx } : null)}
        />
      )}
    </div>
  )
}
