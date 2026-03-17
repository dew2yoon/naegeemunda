export type Category =
  | '오늘의 일기'
  | '커리어 & 일'
  | '나 자신에게'
  | '감사와 성찰'
  | '딱 한마디'

export type FontFamily =
  | 'Noto Sans KR'
  | 'Noto Serif KR'
  | 'Nanum Gothic'
  | 'Nanum Myeongjo'
  | 'Gowun Dodum'
  | 'Gowun Batang'

export type FontSize = '13px' | '15px' | '17px' | '20px'

export interface Entry {
  id: string
  user_id: string
  category: Category
  question: string
  answer: string
  font_family: FontFamily
  font_size: FontSize
  photos: string[]
  created_at: string
  updated_at: string
}

export interface InterviewSession {
  id: string
  user_id: string
  keyword: string
  questions: string[]
  answers: string[]
  photos: { question_index: number; urls: string[] }[]
  font_family: FontFamily
  font_size: FontSize
  created_at: string
  updated_at: string
}

export type TimelineItem =
  | { type: 'entry'; data: Entry }
  | { type: 'interview'; data: InterviewSession }
