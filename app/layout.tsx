import type { Metadata } from 'next'
import {
  Noto_Sans_KR,
  Noto_Serif_KR,
  Nanum_Gothic,
  Nanum_Myeongjo,
  Gowun_Dodum,
  Gowun_Batang,
} from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-noto-sans-kr', display: 'swap' })
const notoSerifKR = Noto_Serif_KR({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-noto-serif-kr', display: 'swap' })
const nanumGothic = Nanum_Gothic({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-nanum-gothic', display: 'swap' })
const nanumMyeongjo = Nanum_Myeongjo({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-nanum-myeongjo', display: 'swap' })
const gowunDodum = Gowun_Dodum({ subsets: ['latin'], weight: ['400'], variable: '--font-gowun-dodum', display: 'swap' })
const gowunBatang = Gowun_Batang({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-gowun-batang', display: 'swap' })

export const metadata: Metadata = {
  title: 'memymemo',
  description: '나 자신을 인터뷰하는 일기 & 커리어 노트 앱',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={[
      notoSansKR.variable,
      notoSerifKR.variable,
      nanumGothic.variable,
      nanumMyeongjo.variable,
      gowunDodum.variable,
      gowunBatang.variable,
    ].join(' ')}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
