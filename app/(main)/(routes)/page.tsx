'use client'

import { useEffect, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { supabase, UserBook, PublicHighlight } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/utils/supabase/client'
import { useStreak } from '@/hooks/use-streak'
import { StreakDisplay } from '@/components/attendance/streak-display'
import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, BookOpen, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PublicHighlightCard } from '@/components/highlights/public-highlight-card'

export default function DashboardPage() {
  const userId = useUser()
  const { goal, loading, checkedIn, checkIn } = useStreak(userId)
  const [recentBooks, setRecentBooks] = useState<UserBook[]>([])
  const [publicHighlights, setPublicHighlights] = useState<PublicHighlight[]>([])
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const supabaseClient = createClient()
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (!user?.created_at) return
      const name = (user.user_metadata?.display_name as string | undefined)?.trim() || ''
      // 가입일부터 오늘까지 함께한 일수 (가입 당일 = 1일)
      const days = differenceInCalendarDays(new Date(), new Date(user.created_at)) + 1
      const messages = [
        `한 장 더와 함께한 지 ${days}일, 반가워요!`,
        `한 장 더와 함께한 지 ${days}일, 우리 더 오래 봐요!`,
        `한 장 더와 함께한 지 ${days}일, 독서왕이 되는 그날까지!`,
        ...(name ? [`한 장 더와 함께한 지 ${days}일, ${name}님 또 오셨네요, 반가워요!`] : []),
      ]
      setGreeting(messages[Math.floor(Math.random() * messages.length)])
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', userId)
        .in('status', ['reading', 'completed'])
        .order('created_at', { ascending: false })
        .limit(4)
      if (data) setRecentBooks(data as UserBook[])
    })()
  }, [userId])

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/highlights/public')
      if (res.ok) {
        const data = await res.json()
        setPublicHighlights(data as PublicHighlight[])
      }
    })()
  }, [])

  const handleCheckIn = async () => {
    await checkIn()
    toast.success('오늘 독서 체크인 완료! 🎉')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">안녕하세요 👋</h1>
        <p className="text-muted-foreground mt-1">
          {greeting || '오늘도 한 페이지 더 읽어볼까요?'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">오늘의 독서 체크인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkedIn ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">오늘 체크인 완료!</span>
              </div>
            ) : (
              <Button onClick={handleCheckIn} className="w-full" disabled={loading}>
                📚 오늘 독서 체크인
              </Button>
            )}
            <Separator />
            <StreakDisplay goal={goal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">빠른 메뉴</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/books/search">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Search className="h-5 w-5" />
                <span className="text-xs">책 검색</span>
              </Button>
            </Link>
            <Link href="/books">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">내 책장</span>
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <span className="text-lg">📅</span>
                <span className="text-xs">출석 현황</span>
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <span className="text-lg">🎯</span>
                <span className="text-xs">독서 목표</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {recentBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">최근 읽은 책</h2>
            <Link href="/books">
              <Button variant="ghost" size="sm">전체 보기</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentBooks.map((ub) => (
              <BookCard key={ub.id} userBook={ub} />
            ))}
          </div>
        </div>
      )}

      {recentBooks.length === 0 && !loading && (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">📖</p>
          <p className="font-medium">아직 읽은 책이 없어요</p>
          <p className="text-sm text-muted-foreground">책을 검색해서 독서를 시작해보세요!</p>
          <Link href="/books/search">
            <Button className="mt-2">첫 번째 책 추가하기</Button>
          </Link>
        </div>
      )}

      {publicHighlights.filter((h) => h.user_id !== userId).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">독자들의 하이라이트</h2>
              <p className="text-xs text-muted-foreground mt-0.5">다른 독자들이 공유한 인상 깊은 구절</p>
            </div>
            {publicHighlights.filter((h) => h.user_id !== userId).length > 5 && (
              <Link href="/highlights">
                <Button variant="ghost" size="sm">더보기</Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publicHighlights.filter((h) => h.user_id !== userId).slice(0, 5).map((h) => (
              <PublicHighlightCard key={h.id} highlight={h} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
