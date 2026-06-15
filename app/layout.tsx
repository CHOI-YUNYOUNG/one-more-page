import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'One More Page',
  description: '나만의 독서 기록 & AI 독서 친구',
  // icons: {
  //   icon: [
  //     { url: '/favicon.ico', sizes: 'any' },
  //     { url: '/icon.png', type: 'image/png' },
  //   ],
  //   apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  //   shortcut: '/favicon.ico',
  // },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 md:ml-56 min-h-screen overflow-auto pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  )
}
