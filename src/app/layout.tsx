import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import Header from "@/components/Header"
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
      <body className="min-h-full bg-[#0D0E12] text-[#F4F4F5] flex flex-col font-sans">
        
        {/* Global Header */}
        <Suspense fallback={<div className="h-16 border-b border-[#222631] bg-[#090A0D]/80" />}>
          <Header />
        </Suspense>
        
        {/* Main Workspace Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  )
}
