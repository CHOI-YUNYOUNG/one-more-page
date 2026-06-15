'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { AladinBook } from '@/lib/aladin'
import { Search, Loader2, BookPlus, X, TrendingUp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type RankingData = { bestseller: AladinBook[]; recommended: AladinBook[] }

function BookItem({
  book,
  rank,
  onAdd,
  adding,
}: {
  book: AladinBook
  rank?: number
  onAdd: (book: AladinBook) => void
  adding: string | null
}) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex gap-4">
        <div className="relative shrink-0">
          {rank && (
            <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold z-10">
              {rank}
            </span>
          )}
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              width={60}
              height={85}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-[60px] h-[85px] bg-muted rounded flex items-center justify-center text-2xl">
              📚
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-medium text-sm leading-snug line-clamp-2">{book.title}</h3>
          <p className="text-xs text-muted-foreground">{book.author} · {book.publisher}</p>
          <p className="text-xs text-muted-foreground">{book.pubDate}</p>
          {book.categoryName && (
            <Badge variant="secondary" className="text-xs">{book.categoryName.split('>').pop()?.trim()}</Badge>
          )}
          <p className="text-xs text-foreground/70 line-clamp-2 mt-1">{book.description}</p>
        </div>
        <div className="shrink-0">
          <Button size="sm" variant="outline" onClick={() => onAdd(book)} disabled={!!adding}>
            <BookPlus className="h-4 w-4 mr-1" />
            추가
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BookSearchPage() {
  const userId = useUser()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AladinBook[]>([])
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [searching, setSearching] = useState(false)
  const [rankingLoading, setRankingLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null)
  const [statusChoice, setStatusChoice] = useState<'wishlist' | 'reading' | 'completed'>('wishlist')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 랭킹 최초 1회 로드
  useEffect(() => {
    fetch('/api/books/ranking')
      .then((r) => r.json())
      .then((data) => setRanking(data))
      .catch(() => {})
      .finally(() => setRankingLoading(false))
  }, [])

  // 실시간 debounce 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.item || [])
      } catch {
        toast.error('검색에 실패했습니다.')
      }
      setSearching(false)
    }, 400)
  }, [query])

  const addBook = async () => {
    if (!selectedBook || !userId) return
    setAdding(selectedBook.isbn13 || selectedBook.isbn)

    const isbn = selectedBook.isbn13 || selectedBook.isbn
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .upsert(
        {
          isbn,
          title: selectedBook.title,
          author: selectedBook.author,
          publisher: selectedBook.publisher,
          cover_url: selectedBook.cover,
          description: selectedBook.description,
          category: selectedBook.categoryName,
          pub_date: selectedBook.pubDate,
        },
        { onConflict: 'isbn' }
      )
      .select()
      .single()

    if (bookError && bookError.code !== '23505') {
      toast.error('책 추가에 실패했습니다.')
      setAdding(null)
      return
    }

    const { data: existing } = await supabase.from('books').select('id').eq('isbn', isbn).single()
    const bookId = bookData?.id || existing?.id
    if (!bookId) {
      toast.error('책을 찾을 수 없습니다.')
      setAdding(null)
      return
    }

    const { error: ubError } = await supabase.from('user_books').upsert(
      { user_id: userId, book_id: bookId, status: statusChoice, total_pages: selectedBook.itemPage || null },
      { onConflict: 'user_id,book_id' }
    )

    if (ubError) {
      toast.error('이미 추가된 책이거나 오류가 발생했습니다.')
    } else {
      toast.success(`"${selectedBook.title}"이(가) 책장에 추가되었습니다!`)
      setSelectedBook(null)
    }
    setAdding(null)
  }

  const showRanking = !query.trim()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">책 검색</h1>
        <p className="text-muted-foreground text-sm mt-1">알라딘에서 읽고 싶은 책을 찾아보세요</p>
      </div>

      {/* 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="책 제목, 저자, ISBN 입력 시 바로 검색됩니다"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 검색 결과 */}
      {!showRanking && (
        <div className="space-y-3">
          {searching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            results.map((book) => (
              <BookItem key={book.isbn13 || book.isbn} book={book} onAdd={setSelectedBook} adding={adding} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 랭킹 & 추천 */}
      {showRanking && (
        <div className="space-y-8">
          {/* 베스트셀러 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">베스트셀러</h2>
              <span className="text-xs text-muted-foreground">알라딘 주간 베스트</span>
            </div>
            {rankingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {ranking?.bestseller.map((book, i) => (
                  <BookItem key={book.isbn13 || book.isbn} book={book} rank={i + 1} onAdd={setSelectedBook} adding={adding} />
                ))}
              </div>
            )}
          </section>

          {/* 추천 책 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">추천 책</h2>
              <span className="text-xs text-muted-foreground">블로거 추천 도서</span>
            </div>
            {rankingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {ranking?.recommended.map((book) => (
                  <BookItem key={book.isbn13 || book.isbn} book={book} onAdd={setSelectedBook} adding={adding} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 책 추가 다이얼로그 */}
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>책장에 추가</DialogTitle>
            <DialogDescription>{selectedBook?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">독서 상태를 선택하세요</p>
            <div className="grid grid-cols-3 gap-2">
              {(['wishlist', 'reading', 'completed'] as const).map((s) => {
                const labels = { wishlist: '읽고 싶어요', reading: '읽는 중', completed: '완독' }
                return (
                  <Button key={s} variant={statusChoice === s ? 'default' : 'outline'} onClick={() => setStatusChoice(s)} size="sm">
                    {labels[s]}
                  </Button>
                )
              })}
            </div>
            <Button className="w-full" onClick={addBook} disabled={!!adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              책장에 추가하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
