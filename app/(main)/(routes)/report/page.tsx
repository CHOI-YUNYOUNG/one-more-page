'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, UserBook } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { MonthlyReportCard } from '@/components/report/monthly-report-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

export default function ReportPage() {
  const userId = useUser()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [completedBooks, setCompletedBooks] = useState<UserBook[]>([])
  const [highlightCount, setHighlightCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

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

    const [{ data: books }, { count }] = await Promise.all([
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
    ])

    setCompletedBooks((books as UserBook[]) ?? [])
    setHighlightCount(count ?? 0)
    setLoading(false)
  }, [userId, currentMonth])

  useEffect(() => {
    if (!initialized) return
    fetchReport()
  }, [initialized, fetchReport])

  const saveAsImage = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(cardRef.current)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `report-${format(currentMonth, 'yyyy-MM')}.png`
      a.click()
    } catch {
      toast.error('이미지 저장에 실패했습니다.')
    }
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
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MonthlyReportCard
              ref={cardRef}
              month={currentMonth}
              completedBooks={completedBooks}
              highlightCount={highlightCount}
            />
          )}
        </CardContent>
      </Card>

      <Button onClick={saveAsImage} disabled={loading || saving} className="w-full" variant="outline">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
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
