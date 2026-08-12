'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, UserBook } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Plus, ArrowUpDown } from 'lucide-react'

const STATUSES = [
  { value: 'all', label: '전체' },
  { value: 'reading', label: '읽는 중' },
  { value: 'completed', label: '완독' },
  { value: 'wishlist', label: '읽고 싶어요' },
  { value: 'stopped', label: '그만 읽기' },
]

const SORTS: Record<string, string> = {
  recent: '최근 추가순',
  rating: '별점 높은순',
  title: '제목순',
}

type SortKey = keyof typeof SORTS

export default function BookshelfPage() {
  const userId = useUser()
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortKey>('recent')

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

  const sortBooks = (arr: UserBook[]) => {
    const sorted = [...arr]
    if (sort === 'rating') {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    } else if (sort === 'title') {
      sorted.sort((a, b) => (a.book?.title ?? '').localeCompare(b.book?.title ?? '', 'ko'))
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return sorted
  }

  const filtered = (status: string) =>
    sortBooks(status === 'all' ? books : books.filter((b) => b.status === status))

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
        <div className="flex items-center justify-between gap-2 flex-wrap">
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

          <Select value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue>{(v) => SORTS[v as string]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
