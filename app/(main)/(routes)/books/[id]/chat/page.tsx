'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, UserBook } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useUser()
  const [userBook, setUserBook] = useState<UserBook | null>(null)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      if (data) setUserBook(data as UserBook)
    })()
  }, [userId, id])

  return (
    // 모바일: 하단 바(4rem) 제외한 높이, 데스크탑: 전체 화면 높이
    <div className="flex flex-col h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b shrink-0">
        <Link href={`/books/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        {userBook ? (
          <div>
            <h1 className="font-bold text-base line-clamp-1">{userBook.book!.title}</h1>
            <p className="text-xs text-muted-foreground">AI 독서 친구와 토론하기</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-muted animate-pulse rounded" />
            <div className="h-3 w-28 bg-muted animate-pulse rounded" />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4 max-w-3xl mx-auto w-full">
        {userBook ? (
          userBook.book!.source === 'manual' ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 px-6">
              <p className="text-3xl">📝</p>
              <p className="text-sm">직접 추가한 책은 AI 토론을 이용할 수 없어요.</p>
              <p className="text-xs">AI 학습에 필요한 책 데이터가 없기 때문이에요.</p>
            </div>
          ) : (
            <ChatInterface book={userBook.book!} userBookId={id} />
          )
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 pr-4 pt-2">
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
                <div className="space-y-2 max-w-[60%]">
                  <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tl-sm w-48" />
                  <div className="h-4 bg-muted animate-pulse rounded w-36" />
                  <div className="h-3 bg-muted animate-pulse rounded w-16" />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="space-y-2 max-w-[60%]">
                  <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tr-sm w-40" />
                  <div className="h-3 bg-muted animate-pulse rounded w-12 ml-auto" />
                </div>
              </div>
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
                <div className="space-y-2 max-w-[70%]">
                  <div className="h-4 bg-muted animate-pulse rounded-2xl rounded-tl-sm w-56" />
                  <div className="h-4 bg-muted animate-pulse rounded w-44" />
                  <div className="h-4 bg-muted animate-pulse rounded w-32" />
                  <div className="h-3 bg-muted animate-pulse rounded w-16" />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 flex gap-2">
              <div className="flex-1 h-16 bg-muted animate-pulse rounded-md" />
              <div className="w-10 h-16 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
