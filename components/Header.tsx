'use client'

import { createClient } from '@/lib/supabase'
import { NANUM_MYEONGJO } from '@/lib/fonts'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  userEmail?: string
}

export default function Header({ userEmail }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#f8f7f4] border-b border-[#e8e5e0] flex items-center px-6">
      <div className="max-w-[1100px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1
            className="text-[22px] font-bold text-[#1a1816]"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            memymemo
          </h1>
          <span className="text-[13px] text-[#a09890] hidden sm:block">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-[13px] text-[#6b6560] hidden sm:block">{userEmail}</span>
          )}
          <button
            onClick={handleSignOut}
            aria-label="로그아웃"
            className="text-[13px] text-[#6b6560] hover:text-[#1a1816] px-3 py-1.5 rounded-lg hover:bg-[#f2f1ee] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
