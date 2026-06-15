'use client'

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Attendance } from '@/lib/supabase'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function AttendanceCalendar({
  attendance,
  month,
}: {
  attendance: Attendance[]
  month: Date
}) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const startPadding = getDay(start)

  const attendedDays = attendance.map((a) => new Date(a.date))

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-center">
        {format(month, 'yyyy년 M월', { locale: ko })}
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const attended = attendedDays.some((a) => isSameDay(a, day))
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-colors
                ${attended ? 'bg-primary text-primary-foreground' : ''}
                ${isToday && !attended ? 'ring-2 ring-primary' : ''}
                ${!attended && !isToday ? 'text-foreground/60' : ''}
              `}
            >
              {attended ? '✓' : format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
