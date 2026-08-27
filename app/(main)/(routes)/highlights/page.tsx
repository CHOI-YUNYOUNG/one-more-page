'use client'

import { useEffect, useState } from 'react'
import { supabase, PublicHighlight } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'
import { PublicHighlightCard } from '@/components/highlights/public-highlight-card'

export default function PublicHighlightsPage() {
  const userId = useUser()
  const [highlights, setHighlights] = useState<PublicHighlight[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const res = await fetch('/api/highlights/public')
      if (res.ok) {
        const data = await res.json()
        const filtered = (data as PublicHighlight[]).filter((h) => h.user_id !== userId)
        setHighlights(filtered)

        if (filtered.length > 0) {
          const { data: myLikes } = await supabase
            .from('highlight_likes')
            .select('highlight_id')
            .eq('user_id', userId)
            .in('highlight_id', filtered.map((h) => h.id))
          setLikedIds(new Set((myLikes ?? []).map((r) => r.highlight_id)))
        }
      }
      setLoading(false)
    })()
  }, [userId])

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">독자들의 하이라이트</h1>
        <p className="text-muted-foreground mt-1">다른 독자들이 공유한 인상 깊은 구절들이에요</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : highlights.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">📖</p>
          <p className="font-medium">아직 공유된 하이라이트가 없어요</p>
          <p className="text-sm text-muted-foreground">하이라이트를 추가할 때 공개로 설정해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map((h) => (
            <PublicHighlightCard
              key={h.id}
              highlight={h}
              userId={userId}
              likedByMe={likedIds.has(h.id)}
            />
          ))}
        </div>

      )}
    </div>
  )
}
