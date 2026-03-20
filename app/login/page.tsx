'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { NANUM_MYEONGJO } from '@/lib/fonts'

type Mode = 'login' | 'signup' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setInfo('회원가입이 완료됐습니다. 이메일을 확인해주세요.')
      }
    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        router.push('/main')
        router.refresh()
      }
    } else if (mode === 'reset') {
      const origin = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) {
        setError('이메일 전송에 실패했습니다. 다시 시도해주세요.')
      } else {
        setInfo('비밀번호 재설정 이메일을 전송했습니다. 받은 편지함을 확인해주세요.')
        setEmail('')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-bold text-[#1e1b2e] mb-2"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            memymemo
          </h1>
          <p className="text-[14px] text-[#5b4f85]">나 자신을 인터뷰하는 일기 앱</p>
        </div>

        <div className="bg-white rounded-xl border border-[#ddd6f9] p-6 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">

          {/* 비밀번호 찾기 모드 */}
          {mode === 'reset' ? (
            <>
              <div className="mb-6">
                <button
                  onClick={() => switchMode('login')}
                  className="flex items-center gap-1 text-[13px] text-[#9585c2] hover:text-[#5b4f85] transition-colors mb-4"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  로그인으로 돌아가기
                </button>
                <h2 className="text-[16px] font-medium text-[#1e1b2e]">비밀번호 재설정</h2>
                <p className="text-[13px] text-[#9585c2] mt-1">
                  가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] text-[#5b4f85] mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-[#ddd6f9] rounded-lg text-[14px] text-[#1e1b2e] bg-white focus:outline-none focus:border-[#7c3aed] placeholder:text-[#9585c2]"
                  />
                </div>

                {error && <p className="text-[13px] text-red-500">{error}</p>}
                {info && <p className="text-[13px] text-[#7c3aed]">{info}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#7c3aed] text-white text-[14px] font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
                >
                  {loading ? '전송 중…' : '재설정 이메일 보내기'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 로그인 / 회원가입 탭 */}
              <div className="flex mb-6 bg-[#ede9ff] rounded-lg p-1">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors
                      ${mode === m ? 'bg-white text-[#1e1b2e] shadow-sm' : 'text-[#5b4f85]'}`}
                  >
                    {m === 'login' ? '로그인' : '회원가입'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] text-[#5b4f85] mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-[#ddd6f9] rounded-lg text-[14px] text-[#1e1b2e] bg-white focus:outline-none focus:border-[#7c3aed] placeholder:text-[#9585c2]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] text-[#5b4f85]">비밀번호</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-[12px] text-[#9585c2] hover:text-[#7c3aed] transition-colors"
                      >
                        비밀번호를 잊으셨나요?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full px-3 py-2.5 border border-[#ddd6f9] rounded-lg text-[14px] text-[#1e1b2e] bg-white focus:outline-none focus:border-[#7c3aed] placeholder:text-[#9585c2]"
                  />
                </div>

                {error && <p className="text-[13px] text-red-500">{error}</p>}
                {info && <p className="text-[13px] text-[#7c3aed]">{info}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#7c3aed] text-white text-[14px] font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
                >
                  {loading ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
