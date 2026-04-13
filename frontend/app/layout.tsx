import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/AuthProvider'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'STRUT — 着た服が収益になる',
  description: 'GPS連動型ファッション広告プラットフォーム',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F5F5F5] text-[#111111]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
