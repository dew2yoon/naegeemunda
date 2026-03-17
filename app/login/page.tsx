'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { NANUM_MYEONGJO } from '@/lib/fonts'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

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
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        router.push('/main')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-bold text-[#1a1816] mb-2"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            나에게.묻다
          </h1>
          <p className="text-[14px] text-[#6b6560]">나 자신을 인터뷰하는 일기 앱</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e8e5e0] p-6 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">
          {/* 탭 */}
          <div className="flex mb-6 bg-[#f2f1ee] rounded-lg p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo('') }}
                className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors
                  ${mode === m ? 'bg-white text-[#1a1816] shadow-sm' : 'text-[#6b6560]'}`}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] text-[#6b6560] mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-[14px] text-[#1a1816] bg-white focus:outline-none focus:border-[#4a6fa5] placeholder:text-[#a09890]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#6b6560] mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-[14px] text-[#1a1816] bg-white focus:outline-none focus:border-[#4a6fa5] placeholder:text-[#a09890]"
              />
            </div>

            {error && <p className="text-[13px] text-red-500">{error}</p>}
            {info && <p className="text-[13px] text-[#4a6fa5]">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#4a6fa5] text-white text-[14px] font-medium rounded-lg hover:bg-[#3a5f95] disabled:opacity-50 transition-colors"
            >
              {loading ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
