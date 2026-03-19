'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { NANUM_MYEONGJO } from '@/lib/fonts'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있습니다.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/main'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-bold text-[#1a1816] mb-2"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            memymemo
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-[#e8e5e0] p-6 shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_12px_rgba(0,0,0,.05)]">
          {done ? (
            <div className="text-center py-4">
              <p className="text-[15px] text-[#1a1816] mb-2">비밀번호가 변경되었습니다.</p>
              <p className="text-[13px] text-[#a09890]">잠시 후 메인 화면으로 이동합니다…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-[16px] font-medium text-[#1a1816]">새 비밀번호 설정</h2>
                <p className="text-[13px] text-[#a09890] mt-1">
                  새로 사용할 비밀번호를 입력해주세요.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] text-[#6b6560] mb-1.5">새 비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="6자 이상"
                    minLength={6}
                    className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-[14px] text-[#1a1816] bg-white focus:outline-none focus:border-[#4a6fa5] placeholder:text-[#a09890]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#6b6560] mb-1.5">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-[14px] text-[#1a1816] bg-white focus:outline-none focus:border-[#4a6fa5] placeholder:text-[#a09890]"
                  />
                </div>

                {error && <p className="text-[13px] text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#4a6fa5] text-white text-[14px] font-medium rounded-lg hover:bg-[#3a5f95] disabled:opacity-50 transition-colors"
                >
                  {loading ? '변경 중…' : '비밀번호 변경'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
