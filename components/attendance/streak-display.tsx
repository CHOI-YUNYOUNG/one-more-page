'use client'

import { ReadingGoal } from '@/lib/supabase'
import { Progress } from '@/components/ui/progress'
import { Flame } from 'lucide-react'

export function StreakDisplay({ goal }: { goal: ReadingGoal | null }) {
  if (!goal) return null

  const progress = Math.min((goal.current_streak / goal.target_days) * 100, 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-3xl font-bold">{goal.current_streak}</span>
          <span className="text-muted-foreground text-sm">일 연속</span>
        </div>
        <div className="text-xs text-muted-foreground">
          최고 기록: {goal.max_streak}일
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>목표: {goal.target_days}일 연속</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  )
}
