'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, ReadingGoal } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Flame, Trophy, Target, BookOpen, MessageSquare, User, Pencil, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTheme, Theme } from '@/hooks/use-theme'

const themes: { value: Theme; label: string; emoji: string; colors: string[] }[] = [
  { value: 'light',  label: '라이트',   emoji: '☀️', colors: ['#ffffff', '#f4f4f5', '#18181b'] },
  { value: 'dark',   label: '다크',     emoji: '🌙', colors: ['#09090b', '#18181b', '#fafafa'] },
  { value: 'sepia',  label: '세피아',   emoji: '📜', colors: ['#f5efe0', '#e8d9be', '#5c4a2a'] },
  { value: 'forest', label: '포레스트', emoji: '🌲', colors: ['#1a2e1a', '#2d4a2d', '#d4e8d4'] },
]

export default function ProfilePage() {
  const userId = useUser()
  const { theme, setTheme } = useTheme()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [joinedAt, setJoinedAt] = useState<string | null>(null)
  const [booksRead, setBooksRead] = useState(0)
  const [discussionCount, setDiscussionCount] = useState(0)
  const [goal, setGoal] = useState<ReadingGoal | null>(null)
  const [targetInput, setTargetInput] = useState('30')
  const [editingGoal, setEditingGoal] = useState(false)

  useEffect(() => {
    const supabaseClient = createClient()
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name = user.user_metadata?.display_name ?? ''
      setDisplayName(name)
      setNameInput(name)
      setJoinedAt(user.created_at)
    })
  }, [])

  const fetchStats = useCallback(async () => {
    if (!userId) return

    const [{ count: books }, { count: discussions }] = await Promise.all([
      supabase.from('user_books').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
      supabase.from('ai_conversations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])
    setBooksRead(books ?? 0)
    setDiscussionCount(discussions ?? 0)
  }, [userId])

  const fetchGoal = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('reading_goals').select('*').eq('user_id', userId).single()
    if (data) {
      setGoal(data)
      setTargetInput(String(data.target_days))
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
    fetchGoal()
  }, [fetchStats, fetchGoal])

  const saveName = async () => {
    const supabaseClient = createClient()
    const { error } = await supabaseClient.auth.updateUser({
      data: { display_name: nameInput.trim() },
    })
    if (error) {
      toast.error('이름 저장에 실패했습니다.')
    } else {
      setDisplayName(nameInput.trim())
      setEditingName(false)
      toast.success('이름이 저장되었습니다!')
    }
  }

  const saveGoal = async () => {
    const target = parseInt(targetInput)
    if (isNaN(target) || target < 1) return
    if (goal) {
      await supabase.from('reading_goals').update({ target_days: target }).eq('id', goal.id)
    } else {
      await supabase.from('reading_goals').insert({ user_id: userId, target_days: target, current_streak: 0, max_streak: 0 })
    }
    toast.success('목표가 저장되었습니다!')
    setEditingGoal(false)
    fetchGoal()
  }

  const progress = goal ? Math.min((goal.current_streak / goal.target_days) * 100, 100) : 0
  const milestones = [7, 14, 30, 60, 100]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">프로필</h1>

      {/* 사용자 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            내 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이름 */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">이름</p>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  autoFocus
                />
                <Button size="sm" onClick={saveName} className="h-8">저장</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="h-8">취소</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{displayName || '이름 없음'}</p>
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 가입일 */}
          {joinedAt && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">가입일</p>
              <p className="text-sm">{format(new Date(joinedAt), 'yyyy년 M월 d일', { locale: ko })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 독서 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-1">
            <BookOpen className="h-6 w-6 text-primary mb-1" />
            <p className="text-3xl font-bold">{booksRead}</p>
            <p className="text-xs text-muted-foreground">완독한 책</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-1">
            <MessageSquare className="h-6 w-6 text-primary mb-1" />
            <p className="text-3xl font-bold">{discussionCount}</p>
            <p className="text-xs text-muted-foreground">AI 토론</p>
          </CardContent>
        </Card>
      </div>

      {/* 테마 설정 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            테마
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => {
              const active = theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                    active ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {/* 색상 스워치 */}
                  <div className="flex gap-1 mb-2">
                    {t.colors.map((c, i) => (
                      <div key={i} className="h-5 flex-1 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium">
                    {t.emoji} {t.label}
                  </p>
                  {active && (
                    <span className="absolute top-2 right-2 text-primary text-xs font-bold">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 독서 목표 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              연속 독서 목표
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditingGoal(!editingGoal)}>
              {editingGoal ? '취소' : '수정'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingGoal ? (
            <div className="flex gap-2 items-center">
              <Input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} className="w-24" min={1} max={365} />
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

      {/* 마일스톤 */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${achieved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
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
