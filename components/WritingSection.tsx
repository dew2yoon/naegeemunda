'use client'

import { useState, useCallback, useEffect } from 'react'
import { Category, FontFamily, FontSize, Entry, PhotoMeta } from '@/types'
import { getRandomQuestion } from '@/lib/questions'
import { compressImage } from '@/lib/imageCompress'
import { extractPhotoMeta } from '@/lib/extractExif'
import { createClient } from '@/lib/supabase'
import QuestionPanel from './QuestionPanel'
import EditorPanel from './EditorPanel'

interface WritingSectionProps {
  userId: string
  onEntrySaved: (entry: Entry) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export default function WritingSection({ userId, onEntrySaved, onToast }: WritingSectionProps) {
  const [category, setCategory] = useState<Category>('오늘의 일기')
  const [question, setQuestion] = useState<string>(() => {
    const { question: q } = getRandomQuestion('오늘의 일기', [])
    return q
  })
  const [answer, setAnswer] = useState('')
  const [fontFamily, setFontFamily] = useState<FontFamily>('Noto Sans KR')
  const [fontSize, setFontSize] = useState<FontSize>('15px')
  const [isSaving, setIsSaving] = useState(false)

  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [photoMetas, setPhotoMetas] = useState<PhotoMeta[]>([])

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviews])

  const handlePhotosAdd = useCallback(async (files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
    // 빈 메타로 먼저 추가 → 비동기 추출 후 교체
    setPhotoMetas((prev) => [...prev, ...files.map(() => ({}))])

    const metas = await Promise.all(files.map((f) => extractPhotoMeta(f)))
    setPhotoMetas((prev) => {
      const next = [...prev]
      const offset = next.length - files.length
      metas.forEach((m, i) => { next[offset + i] = m })
      return next
    })
  }, [])

  const handlePhotoRemove = useCallback((index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setPhotoMetas((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(async () => {
    if (!answer) return
    setIsSaving(true)

    const supabase = createClient()

    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        category,
        question,
        answer,
        font_family: fontFamily,
        font_size: fontSize,
        photos: [],
        photo_metadata: [],
      })
      .select()
      .single()

    if (insertError || !entry) {
      setIsSaving(false)
      onToast('저장에 실패했습니다.', 'error')
      return
    }

    let photoUrls: string[] = []
    let savedMetas: PhotoMeta[] = []

    if (photoFiles.length > 0) {
      const results = await Promise.all(
        photoFiles.map(async (file, i) => {
          try {
            const compressed = await compressImage(file)
            const path = `${userId}/${entry.id}/${Date.now()}_${i}.jpg`
            const { error: uploadError } = await supabase.storage
              .from('entry-photos')
              .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

            if (uploadError) {
              console.error('[사진 업로드 실패]', uploadError)
              return null
            }

            const { data: urlData } = supabase.storage
              .from('entry-photos')
              .getPublicUrl(path)
            return { url: urlData.publicUrl, meta: photoMetas[i] ?? {} }
          } catch (e) {
            console.error('[사진 처리 오류]', e)
            return null
          }
        })
      )

      const succeeded = results.filter((r): r is { url: string; meta: PhotoMeta } => r !== null)
      photoUrls = succeeded.map((r) => r.url)
      savedMetas = succeeded.map((r) => r.meta)

      if (succeeded.length < photoFiles.length) {
        onToast(
          succeeded.length === 0
            ? '사진 업로드에 실패했습니다. Supabase Storage 정책을 확인해주세요.'
            : `${photoFiles.length}장 중 ${succeeded.length}장만 업로드되었습니다.`,
          'error'
        )
      }

      if (photoUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('entries')
          .update({ photos: photoUrls, photo_metadata: savedMetas })
          .eq('id', entry.id)
        if (updateError) console.error('[photos 업데이트 실패]', updateError)
      }
    }

    setIsSaving(false)
    onEntrySaved({ ...entry, photos: photoUrls, photo_metadata: savedMetas } as Entry)
    onToast('기록이 저장되었습니다!')

    setAnswer('')
    setPhotoFiles([])
    setPhotoPreviews((prev) => { prev.forEach(URL.revokeObjectURL); return [] })
    setPhotoMetas([])
    const { question: newQ } = getRandomQuestion(category, [])
    setQuestion(newQ)
  }, [answer, category, question, fontFamily, fontSize, userId, photoFiles, photoMetas, onEntrySaved, onToast])

  return (
    <section className="bg-white rounded-xl border border-[#ddd6f9] p-6 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-6">
        <QuestionPanel
          category={category}
          question={question}
          onCategoryChange={setCategory}
          onQuestionChange={setQuestion}
        />
        <EditorPanel
          answer={answer}
          fontFamily={fontFamily}
          fontSize={fontSize}
          isSaving={isSaving}
          photoPreviews={photoPreviews}
          photoMetas={photoMetas}
          onChange={setAnswer}
          onFontFamilyChange={setFontFamily}
          onFontSizeChange={setFontSize}
          onSave={handleSave}
          onPhotosAdd={handlePhotosAdd}
          onPhotoRemove={handlePhotoRemove}
        />
      </div>
    </section>
  )
}
