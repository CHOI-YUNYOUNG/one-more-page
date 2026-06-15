'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, UserBook } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const STATUSES = [
  { value: 'all', label: '전체' },
  { value: 'reading', label: '읽는 중' },
  { value: 'completed', label: '완독' },
  { value: 'wishlist', label: '읽고 싶어요' },
]

export default function BookshelfPage() {
  const userId = useUser()
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBooks = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('user_books')
      .select('*, book:books(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setBooks(data as UserBook[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const filtered = (status: string) =>
    status === 'all' ? books : books.filter((b) => b.status === status)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 책장</h1>
          <p className="text-muted-foreground text-sm mt-1">총 {books.length}권</p>
        </div>
        <Link href="/books/search">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            책 추가
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
              <span className="ml-1 text-xs opacity-70">
                ({filtered(s.value).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUSES.map((s) => (
          <TabsContent key={s.value} value={s.value} className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
            ) : filtered(s.value).length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-4xl">📚</p>
                <p className="text-muted-foreground text-sm">아직 책이 없어요</p>
                <Link href="/books/search">
                  <Button size="sm" variant="outline">책 검색하기</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered(s.value).map((ub) => (
                  <BookCard key={ub.id} userBook={ub} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
