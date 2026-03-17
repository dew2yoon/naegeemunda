import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FALLBACK_QUESTIONS } from '@/lib/fallbackQuestions'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // 인증 확인
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keyword } = await req.json()
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: '당신은 사용자의 경험과 성장을 기록하도록 돕는 따뜻한 인터뷰어입니다.',
      messages: [
        {
          role: 'user',
          content: `사용자가 "${keyword.trim()}"에 대해 기록하고 싶어합니다.
이 주제와 관련하여 사용자의 경험, 성과, 배움, 감정을 자연스럽게 이끌어낼 수 있는
인터뷰 질문 6개를 한국어로 작성해주세요.

조건:
- 구체적이고 따뜻한 어조
- 열린 질문 (Yes/No 금지)
- 시간 순서 고려 (준비 → 과정 → 결과 → 성찰 → 앞으로)
- 커리어 성장 기록에 적합한 깊이

반드시 아래 JSON 형식만 반환하세요:
{"questions": ["질문1", "질문2", "질문3", "질문4", "질문5", "질문6"]}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.trim())

    if (!Array.isArray(parsed.questions) || parsed.questions.length !== 6) {
      throw new Error('Invalid response format')
    }

    return NextResponse.json({ questions: parsed.questions })
  } catch {
    // API 실패 시 폴백 질문 반환
    return NextResponse.json({ questions: FALLBACK_QUESTIONS })
  }
}
