'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { FontFamily, FontSize, PhotoMeta } from '@/types'
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
  photoMetas?: PhotoMeta[]
  onChange: (answer: string) => void
  onFontFamilyChange: (font: FontFamily) => void
  onFontSizeChange: (size: FontSize) => void
  onSave: () => void
  onPhotosAdd: (files: File[]) => void
  onPhotoRemove: (index: number) => void
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      aria-label={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-[13px] transition-colors
        ${active
          ? 'bg-[#7c3aed] text-white'
          : 'text-[#5b4f85] hover:bg-[#ddd6f9]'
        }`}
    >
      {children}
    </button>
  )
}

export default function EditorPanel({
  answer,
  fontFamily,
  fontSize,
  isSaving,
  photoPreviews,
  photoMetas,
  onChange,
  onFontFamilyChange,
  onFontSizeChange,
  onSave,
  onPhotosAdd,
  onPhotoRemove,
}: EditorPanelProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '지금 이 순간의 생각을 자유롭게 적어보세요…' }),
    ],
    content: answer,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px]',
      },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          onSave()
          return true
        }
        return false
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getText() ? editor.getHTML() : '')
    },
  })

  // Sync external answer → editor (e.g. on clear)
  useEffect(() => {
    if (!editor) return
    const current = editor.getText() ? editor.getHTML() : ''
    if (answer === '' && current !== '') {
      editor.commands.clearContent()
    }
  }, [answer, editor])

  const charCount = editor?.getText().length ?? 0

  return (
    <div className="flex flex-col gap-3">
      {/* 폰트 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value as FontFamily)}
          aria-label="폰트 선택"
          className="text-[13px] border border-[#ddd6f9] rounded-lg px-3 py-1.5 bg-white text-[#5b4f85] focus:outline-none focus:border-[#7c3aed]"
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
                  ? 'bg-[#7c3aed] text-white'
                  : 'bg-[#ede9ff] text-[#5b4f85] hover:bg-[#ddd6f9]'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 서식 도구모음 */}
      {editor && (
        <div className="flex items-center gap-0.5 flex-wrap border border-[#ddd6f9] rounded-lg px-2 py-1.5 bg-white">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (Cmd+B)">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임 (Cmd+I)">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄 (Cmd+U)">
            <span className="underline">U</span>
          </ToolbarButton>
          <div className="w-px h-4 bg-[#ddd6f9] mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarButton>
          <div className="w-px h-4 bg-[#ddd6f9] mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h15" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M6 18h15" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      {/* 에디터 */}
      <div
        className="relative bg-[#ede9ff] border border-[#ddd6f9] rounded-xl p-4 focus-within:border-[#7c3aed] transition-colors"
        style={{
          fontFamily: FONT_CSS_VAR[fontFamily],
          fontSize,
          lineHeight: '1.8',
        }}
      >
        <EditorContent editor={editor} />
        <span className="absolute bottom-3 right-4 text-[12px] text-[#9585c2] pointer-events-none">
          {charCount}자
        </span>
      </div>

      {/* 사진 첨부 */}
      <PhotoUpload
        previews={photoPreviews}
        metadatas={photoMetas}
        onAdd={onPhotosAdd}
        onRemove={onPhotoRemove}
      />

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#9585c2]">Cmd + Enter로 저장</span>
        <button
          onClick={onSave}
          disabled={isSaving || !answer}
          aria-label="저장하기"
          className="px-5 py-2.5 bg-[#7c3aed] text-white text-[14px] font-medium rounded-xl hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '저장 중…' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
