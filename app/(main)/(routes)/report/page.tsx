'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, UserBook, Book } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { MonthlyReportCard } from '@/components/report/monthly-report-card'
import { ReportHero } from '@/components/report/report-hero'
import { AnimatedSection } from '@/components/report/animated-section'
import {
  TopRatedCard,
  MostHighlightedCard,
  FirstReadCard,
  TopGenreCard,
  TopRatedBook,
  TopHighlightedBook,
  FirstReadBook,
  TopGenre,
} from '@/components/report/report-highlight-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Download, Check, Loader2 } from 'lucide-react'
import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

type HighlightWithBook = { book_id: string; book: Pick<Book, 'title' | 'cover_url'> | null }

// 종이 한 장(리프) 두께를 약 0.1mm로 가정한 재미용 근사치.
const MM_PER_PAGE = 0.1

export default function ReportPage() {
  const userId = useUser()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [completedBooks, setCompletedBooks] = useState<UserBook[]>([])
  const [highlightCount, setHighlightCount] = useState(0)
  const [mostHighlighted, setMostHighlighted] = useState<TopHighlightedBook | null>(null)
  const [firstRead, setFirstRead] = useState<FirstReadBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  // 최초 진입 시, 가장 최근 완독한 달을 기본값으로 잡는다.
  useEffect(() => {
    if (!userId || initialized) return
    ;(async () => {
      const { data } = await supabase
        .from('user_books')
        .select('finished_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data?.finished_at) setCurrentMonth(new Date(data.finished_at))
      setInitialized(true)
    })()
  }, [userId, initialized])

  const fetchReport = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const start = startOfMonth(currentMonth).toISOString()
    const end = endOfMonth(currentMonth).toISOString()

    const [{ data: books }, { count }, { data: highlightRows }, { data: firstReadRow }] = await Promise.all([
      supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('finished_at', start)
        .lte('finished_at', end),
      supabase
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('highlights')
        .select('book_id, book:books(title, cover_url)')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('user_books')
        .select('started_at, book:books(title, cover_url)')
        .eq('user_id', userId)
        .gte('started_at', start)
        .lte('started_at', end)
        .order('started_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    setCompletedBooks((books as UserBook[]) ?? [])
    setHighlightCount(count ?? 0)

    const tally = new Map<string, { count: number; book: Pick<Book, 'title' | 'cover_url'> }>()
    for (const row of (highlightRows as unknown as HighlightWithBook[]) ?? []) {
      if (!row.book) continue
      const entry = tally.get(row.book_id)
      if (entry) entry.count++
      else tally.set(row.book_id, { count: 1, book: row.book })
    }
    let top: { count: number; book: Pick<Book, 'title' | 'cover_url'> } | null = null
    for (const entry of tally.values()) {
      if (!top || entry.count > top.count) top = entry
    }
    setMostHighlighted(top ? { title: top.book.title, cover_url: top.book.cover_url, count: top.count } : null)

    const fr = firstReadRow as unknown as { started_at: string; book: Pick<Book, 'title' | 'cover_url'> } | null
    setFirstRead(fr?.book ? { title: fr.book.title, cover_url: fr.book.cover_url, started_at: fr.started_at } : null)

    setLoading(false)
  }, [userId, currentMonth])

  useEffect(() => {
    if (!initialized) return
    setSaved(false)
    fetchReport()
  }, [initialized, fetchReport])

  const bestRatedBook = completedBooks
    .filter((b) => !!b.rating && !!b.book)
    .reduce<UserBook | null>((best, b) => (!best || (b.rating ?? 0) > (best.rating ?? 0) ? b : best), null)
  const topRated: TopRatedBook | null = bestRatedBook
    ? { title: bestRatedBook.book!.title, cover_url: bestRatedBook.book!.cover_url, rating: bestRatedBook.rating! }
    : null

  const topGenre: TopGenre | null = (() => {
    const tally = new Map<string, number>()
    for (const b of completedBooks) {
      const genre = b.book?.category?.split('>').pop()?.trim()
      if (!genre) continue
      tally.set(genre, (tally.get(genre) ?? 0) + 1)
    }
    let best: TopGenre | null = null
    for (const [genre, count] of tally) {
      if (!best || count > best.count) best = { genre, count }
    }
    return best
  })()

  const totalPages = completedBooks.reduce((sum, b) => sum + (b.total_pages ?? 0), 0)
  const heightCm = (totalPages * MM_PER_PAGE) / 10
  const isMeters = heightCm >= 100
  const heightValue = isMeters ? heightCm / 100 : heightCm
  const heightUnit = isMeters ? 'm' : 'cm'

  const storyCards = [
    topRated && <TopRatedCard key="top-rated" book={topRated} />,
    mostHighlighted && <MostHighlightedCard key="most-highlighted" book={mostHighlighted} />,
    topGenre && <TopGenreCard key="top-genre" genre={topGenre} />,
    firstRead && <FirstReadCard key="first-read" book={firstRead} />,
  ].filter(Boolean)

  const saveAsImage = async () => {
    if (!captureRef.current) return
    setSaving(true)
    try {
      // 캡처 직전 카운트업 애니메이션을 끄고, 리렌더가 실제로 화면에 반영될 때까지 한 프레임 기다린다.
      setCapturing(true)
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(captureRef.current)
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('이미지 생성 실패')

      const fileName = `report-${format(currentMonth, 'yyyy-MM')}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        // iOS Safari는 <a download>로 데이터 URL을 저장하지 못해 공유 시트를 사용한다.
        await navigator.share({ files: [file], title: fileName })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
      setSaved(true)
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error('이미지 저장에 실패했습니다.')
      }
    }
    setCapturing(false)
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">독서 리포트</h1>
        <p className="text-muted-foreground text-sm mt-1">한 달간의 독서 기록을 모아봤어요</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">월 선택</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-24 text-center">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={captureRef} className="space-y-4 bg-background">
          <AnimatedSection>
            <ReportHero
              bookCount={completedBooks.length}
              totalPages={totalPages}
              heightValue={heightValue}
              heightUnit={heightUnit}
              animate={!capturing}
            />
          </AnimatedSection>

          {storyCards.length > 0 && (
            <div className="space-y-3">
              {storyCards.map((card, i) => (
                <AnimatedSection key={i} delayMs={150 + i * 120}>
                  {card}
                </AnimatedSection>
              ))}
            </div>
          )}

          <AnimatedSection delayMs={150 + storyCards.length * 120}>
            <MonthlyReportCard
              month={currentMonth}
              completedBooks={completedBooks}
              highlightCount={highlightCount}
            />
          </AnimatedSection>

          <AnimatedSection delayMs={250 + storyCards.length * 120}>
            <p className="text-center text-sm text-muted-foreground py-2">
              다음 달에도 좋은 책과 함께해요 📖✨
            </p>
          </AnimatedSection>
        </div>
      )}

      <Button onClick={saveAsImage} disabled={loading || saving} className="w-full" variant="outline">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            저장 완료
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            이미지로 저장
          </>
        )}
      </Button>
    </div>
  )
}
