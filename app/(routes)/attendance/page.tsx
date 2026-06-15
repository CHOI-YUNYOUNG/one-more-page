'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, Attendance } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { useStreak } from '@/hooks/use-streak'
import { AttendanceCalendar } from '@/components/attendance/calendar'
import { StreakDisplay } from '@/components/attendance/streak-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

export default function AttendancePage() {
  const userId = useUser()
  const { goal, checkedIn, checkIn } = useStreak(userId)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendance, setAttendance] = useState<Attendance[]>([])

  const fetchAttendance = useCallback(async () => {
    if (!userId) return
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
    if (data) setAttendance(data)
  }, [userId, currentMonth])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const handleCheckIn = async () => {
    await checkIn()
    toast.success('오늘 독서 체크인 완료! 🎉')
    fetchAttendance()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">출석 체크</h1>
        <p className="text-muted-foreground text-sm mt-1">매일 꾸준히 독서하고 기록해요</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">오늘의 체크인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkedIn ? (
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">오늘 독서 완료! 내일도 화이팅 🔥</span>
            </div>
          ) : (
            <Button onClick={handleCheckIn} className="w-full">
              📚 오늘 독서 체크인하기
            </Button>
          )}
          <StreakDisplay goal={goal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">이번 달 출석</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-20 text-center">
                {format(currentMonth, 'M월', { locale: ko })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar attendance={attendance} month={currentMonth} />
          <p className="text-xs text-muted-foreground text-center mt-3">
            이번 달 {attendance.length}일 출석
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
