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
    <header className="sticky top-0 z-40 h-16 bg-[#f5f3ff] border-b border-[#ddd6f9] flex items-center px-6">
      <div className="max-w-[1100px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1
            className="text-[22px] font-bold text-[#1e1b2e]"
            style={{ fontFamily: NANUM_MYEONGJO }}
          >
            memymemo
          </h1>
          <span className="text-[13px] text-[#9585c2] hidden sm:block">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-[13px] text-[#5b4f85] hidden sm:block">{userEmail}</span>
          )}
          <button
            onClick={handleSignOut}
            aria-label="로그아웃"
            className="text-[13px] text-[#5b4f85] hover:text-[#1e1b2e] px-3 py-1.5 rounded-lg hover:bg-[#ede9ff] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
