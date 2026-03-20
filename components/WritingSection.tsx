'use client'

import { useState, useCallback, useEffect } from 'react'
import { Category, FontFamily, FontSize, Entry } from '@/types'
import { getRandomQuestion } from '@/lib/questions'
import { compressImage } from '@/lib/imageCompress'
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

  // 사진: File 원본 + 로컬 미리보기 URL
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // object URL 정리
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photoPreviews])

  const handlePhotosAdd = useCallback((files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const handlePhotoRemove = useCallback((index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!answer.trim()) return
    setIsSaving(true)

    const supabase = createClient()

    // 1. entry 먼저 저장 → ID 획득
    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        category,
        question,
        answer: answer.trim(),
        font_family: fontFamily,
        font_size: fontSize,
        photos: [],
      })
      .select()
      .single()

    if (insertError || !entry) {
      setIsSaving(false)
      onToast('저장에 실패했습니다.', 'error')
      return
    }

    // 2. 사진이 있으면 압축 → Storage 업로드
    let photoUrls: string[] = []
    if (photoFiles.length > 0) {
      const uploads = await Promise.all(
        photoFiles.map(async (file, i) => {
          try {
            const compressed = await compressImage(file)
            const ext = 'jpg'
            const path = `${userId}/${entry.id}/${Date.now()}_${i}.${ext}`
            const { error } = await supabase.storage
              .from('entry-photos')
              .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
            if (error) return null

            const { data: urlData } = supabase.storage
              .from('entry-photos')
              .getPublicUrl(path)
            return urlData.publicUrl
          } catch {
            return null
          }
        })
      )
      photoUrls = uploads.filter((u): u is string => u !== null)

      // 3. photos URL로 entry 업데이트
      if (photoUrls.length > 0) {
        await supabase
          .from('entries')
          .update({ photos: photoUrls })
          .eq('id', entry.id)
      }
    }

    setIsSaving(false)
    onEntrySaved({ ...entry, photos: photoUrls } as Entry)
    onToast('기록이 저장되었습니다!')

    // 에디터 초기화
    setAnswer('')
    setPhotoFiles([])
    setPhotoPreviews((prev) => { prev.forEach(URL.revokeObjectURL); return [] })
    const { question: newQ } = getRandomQuestion(category, [])
    setQuestion(newQ)
  }, [answer, category, question, fontFamily, fontSize, userId, photoFiles, onEntrySaved, onToast])

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
