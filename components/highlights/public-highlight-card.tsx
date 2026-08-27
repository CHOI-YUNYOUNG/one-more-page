'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase, PublicHighlight } from '@/lib/supabase'
import { formatDate, cn } from '@/lib/utils'
import { Heart } from 'lucide-react'

const COLLAPSE_THRESHOLD = 100

export function PublicHighlightCard({
  highlight: h,
  userId,
  likedByMe,
}: {
  highlight: PublicHighlight
  userId: string
  likedByMe: boolean
}) {
  const needsToggle = h.content.length > COLLAPSE_THRESHOLD || h.content.includes('\n')
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(likedByMe)
  const [count, setCount] = useState(h.like_count)

  const toggleLike = async () => {
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))
    const { error } = nextLiked
      ? await supabase.from('highlight_likes').insert({ user_id: userId, highlight_id: h.id })
      : await supabase.from('highlight_likes').delete().eq('user_id', userId).eq('highlight_id', h.id)
    if (error) {
      setLiked(!nextLiked)
      setCount((c) => c + (nextLiked ? -1 : 1))
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/5 border-b px-4 py-3">
        <p className="font-semibold text-sm leading-snug line-clamp-1">{h.book.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{h.book.author}</p>
      </div>
      <CardContent className="pt-3 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {h.page_number && (
            <span className="font-medium text-primary">p.{h.page_number}</span>
          )}
          <span>{formatDate(h.created_at)}</span>
        </div>
        <blockquote
          className={`text-sm italic leading-relaxed text-foreground/80 whitespace-pre-wrap ${
            !expanded && needsToggle ? 'line-clamp-3' : ''
          }`}
        >
          {h.content}
        </blockquote>
        {needsToggle && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
        {h.note && (
          <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30 whitespace-pre-wrap">
            {h.note}
          </p>
        )}
        <button
          onClick={toggleLike}
          className={cn(
            'flex items-center gap-1 text-xs pt-1',
            liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
          {count > 0 && <span>{count}</span>}
        </button>
      </CardContent>
    </Card>
  )
}
