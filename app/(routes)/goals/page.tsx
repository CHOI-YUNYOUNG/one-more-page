'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, ReadingGoal } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Flame, Trophy, Target } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function GoalsPage() {
  const userId = useUser()
  const [goal, setGoal] = useState<ReadingGoal | null>(null)
  const [targetInput, setTargetInput] = useState('30')
  const [editing, setEditing] = useState(false)

  const fetchGoal = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) {
      setGoal(data)
      setTargetInput(String(data.target_days))
    }
  }, [userId])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  const saveGoal = async () => {
    const target = parseInt(targetInput)
    if (isNaN(target) || target < 1) return

    if (goal) {
      await supabase
        .from('reading_goals')
        .update({ target_days: target })
        .eq('id', goal.id)
    } else {
      await supabase.from('reading_goals').insert({
        user_id: userId,
        target_days: target,
        current_streak: 0,
        max_streak: 0,
      })
    }
    toast.success('목표가 저장되었습니다!')
    setEditing(false)
    fetchGoal()
  }

  const progress = goal
    ? Math.min((goal.current_streak / goal.target_days) * 100, 100)
    : 0

  const milestones = [7, 14, 30, 60, 100]

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">독서 목표</h1>
        <p className="text-muted-foreground text-sm mt-1">연속 독서 목표를 설정하고 달성해보세요</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              연속 독서 목표
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? '취소' : '수정'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-24"
                min={1}
                max={365}
              />
              <span className="text-sm text-muted-foreground">일 연속 독서</span>
              <Button size="sm" onClick={saveGoal}>저장</Button>
            </div>
          ) : (
            <p className="text-3xl font-bold">
              {goal?.target_days || 30}
              <span className="text-base font-normal text-muted-foreground ml-1">일 목표</span>
            </p>
          )}

          {goal && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    현재 {goal.current_streak}일 연속
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{goal.current_streak}</p>
                  <p className="text-xs text-muted-foreground">현재 스트릭</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-500">{goal.max_streak}</p>
                  <p className="text-xs text-muted-foreground">최고 기록</p>
                </div>
              </div>

              {goal.last_checkin && (
                <p className="text-xs text-muted-foreground">
                  마지막 체크인: {format(new Date(goal.last_checkin), 'M월 d일 (E)', { locale: ko })}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            달성 마일스톤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((days) => {
              const achieved = (goal?.max_streak || 0) >= days
              return (
                <div key={days} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      achieved
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {achieved ? '✓' : days}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${achieved ? '' : 'text-muted-foreground'}`}>
                      {days}일 연속 독서 {days === 7 && '🌱'}{days === 14 && '🌿'}{days === 30 && '🌳'}{days === 60 && '🏆'}{days === 100 && '👑'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achieved ? '달성 완료!' : `${days - (goal?.current_streak || 0)}일 남음`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
