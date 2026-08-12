'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Highlight } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { formatDate } from '@/lib/utils'
import { Loader2, Trash2, Globe, Lock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type MyHighlight = Highlight & {
  book: {
    id: string
    title: string
    author: string | null
    cover_url: string | null
  } | null
}

export default function MyHighlightsPage() {
  const userId = useUser()
  const [highlights, setHighlights] = useState<MyHighlight[]>([])
  // book_id -> user_book id (책 상세 라우트는 user_books.id 를 사용함)
  const [userBookMap, setUserBookMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const fetchHighlights = useCallback(async () => {
    if (!userId) return
    const [{ data: hl }, { data: ub }] = await Promise.all([
      supabase
        .from('highlights')
        .select('*, book:books(id, title, author, cover_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('user_books').select('id, book_id').eq('user_id', userId),
    ])
    if (hl) setHighlights(hl as MyHighlight[])
    if (ub) {
      const map: Record<string, string> = {}
      for (const row of ub as { id: string; book_id: string }[]) {
        map[row.book_id] = row.id
      }
      setUserBookMap(map)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchHighlights()
  }, [fetchHighlights])

  const handleDelete = async (id: string) => {
    await supabase.from('highlights').delete().eq('id', id)
    setHighlights((prev) => prev.filter((h) => h.id !== id))
    toast.success('삭제되었습니다.')
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? highlights.filter(
        (h) =>
          h.content.toLowerCase().includes(q) ||
          h.note?.toLowerCase().includes(q) ||
          h.book?.title.toLowerCase().includes(q) ||
          h.book?.author?.toLowerCase().includes(q)
      )
    : highlights

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">내 하이라이트</h1>
        <p className="text-muted-foreground mt-1">
          지금까지 모은 인상 깊은 구절 {highlights.length}개
        </p>
      </div>

      {highlights.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="구절, 감상, 책 제목으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : highlights.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">✍️</p>
          <p className="font-medium">아직 저장한 하이라이트가 없어요</p>
          <p className="text-sm text-muted-foreground">
            책 상세 페이지에서 인상 깊은 구절을 기록해보세요
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🔍</p>
          <p className="text-sm text-muted-foreground">검색 결과가 없어요</p>
        </div>
      ) : (
        <div className="gap-4 [column-fill:balance] columns-1 sm:columns-2 lg:columns-3">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="mb-4 break-inside-avoid rounded-xl border bg-card p-4 space-y-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  {h.page_number && (
                    <span className="font-medium text-primary shrink-0">p.{h.page_number}</span>
                  )}
                  <span className="shrink-0">{formatDate(h.created_at)}</span>
                  {h.is_public ? (
                    <Globe className="h-3 w-3 shrink-0" />
                  ) : (
                    <Lock className="h-3 w-3 shrink-0" />
                  )}
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                  aria-label="하이라이트 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <blockquote className="text-sm italic leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {h.content}
              </blockquote>

              {h.note && (
                <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30 whitespace-pre-wrap">
                  {h.note}
                </p>
              )}

              {h.book && userBookMap[h.book_id] ? (
                <Link
                  href={`/books/${userBookMap[h.book_id]}`}
                  className="block text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t truncate"
                >
                  📖 {h.book.title}
                </Link>
              ) : h.book ? (
                <p className="text-xs text-muted-foreground pt-2 border-t truncate">
                  📖 {h.book.title}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
