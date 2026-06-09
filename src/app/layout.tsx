import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Cirkadian QA Tracker",
  description: "Next.js 14+ and Supabase Internal QA & Bug Tracker Platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-[#0D0E12] text-[#F4F4F5] flex font-sans">
        
        {/* Left Global Sidebar */}
        <aside className="w-64 border-r border-[#222631] bg-[#090A0D] hidden md:flex flex-col flex-shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-[#222631]">
            <span className="text-lg font-black tracking-wider text-white">
              CIRKADIAN<span className="text-accent-green">QA</span>
            </span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent-green/10 text-accent-green text-sm font-semibold">
              📊 대시보드
            </Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 text-sm font-semibold transition-all">
              🧪 테스트 케이스
            </Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 text-sm font-semibold transition-all">
              🐛 버그 리포트
            </Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 text-sm font-semibold transition-all">
              ⚙ 설정
            </Link>
          </nav>
          <div className="p-4 border-t border-[#222631] flex flex-col gap-1 text-[11px] text-zinc-500 font-mono">
            <div>엔진: Next.js 16</div>
            <div>데이터베이스: Supabase</div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <header className="h-16 border-b border-[#222631] bg-[#090A0D]/50 backdrop-blur flex items-center justify-between px-6 md:px-8">
            <span className="text-sm font-semibold text-zinc-400">협업 스페이스 (2인 개발 모드)</span>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs font-bold text-zinc-300 font-mono">작업 공간: 준비됨</span>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 p-6 md:p-8">
            {children}
          </div>
        </div>

      </body>
    </html>
  )
}
