'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, ReadingGoal } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

export function useStreak(userId: string) {
  const [goal, setGoal] = useState<ReadingGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)

  const fetchGoal = useCallback(async () => {
    if (!userId) return
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data: goalData } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (goalData) setGoal(goalData)

    const { data: att } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    setCheckedIn(!!att)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  const checkIn = async () => {
    if (!userId || checkedIn) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    await supabase.from('attendance').upsert({ user_id: userId, date: today })

    let newStreak = 1
    if (goal) {
      const wasYesterday = goal.last_checkin === yesterday
      newStreak = wasYesterday ? goal.current_streak + 1 : 1
      const newMax = Math.max(newStreak, goal.max_streak)

      await supabase
        .from('reading_goals')
        .update({ current_streak: newStreak, max_streak: newMax, last_checkin: today })
        .eq('id', goal.id)
    } else {
      await supabase.from('reading_goals').insert({
        user_id: userId,
        target_days: 30,
        current_streak: 1,
        max_streak: 1,
        last_checkin: today,
      })
    }

    setCheckedIn(true)
    fetchGoal()
  }

  return { goal, loading, checkedIn, checkIn }
}
