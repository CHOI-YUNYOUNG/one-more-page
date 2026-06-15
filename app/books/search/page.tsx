'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { AladinBook } from '@/lib/aladin'
import { Search, Loader2, BookPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function BookSearchPage() {
  const userId = useUser()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AladinBook[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null)
  const [statusChoice, setStatusChoice] = useState<'wishlist' | 'reading' | 'completed'>('wishlist')

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.item || [])
    } catch {
      toast.error('검색에 실패했습니다.')
    }
    setLoading(false)
  }

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

    const { data: existing } = await supabase
      .from('books')
      .select('id')
      .eq('isbn', isbn)
      .single()

    const bookId = bookData?.id || existing?.id
    if (!bookId) {
      toast.error('책을 찾을 수 없습니다.')
      setAdding(null)
      return
    }

    const { error: ubError } = await supabase.from('user_books').upsert(
      {
        user_id: userId,
        book_id: bookId,
        status: statusChoice,
        total_pages: selectedBook.itemPage || null,
      },
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

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">책 검색</h1>
        <p className="text-muted-foreground text-sm mt-1">알라딘에서 읽고 싶은 책을 찾아보세요</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <Input
          placeholder="책 제목, 저자, ISBN을 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-1">검색</span>
        </Button>
      </form>

      <div className="space-y-3">
        {results.map((book) => (
          <Card key={book.isbn13 || book.isbn} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex gap-4">
              {book.cover ? (
                <Image
                  src={book.cover}
                  alt={book.title}
                  width={60}
                  height={85}
                  className="rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-[60px] h-[85px] bg-muted rounded flex items-center justify-center text-2xl shrink-0">
                  📚
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium text-sm leading-snug">{book.title}</h3>
                <p className="text-xs text-muted-foreground">{book.author} · {book.publisher}</p>
                <p className="text-xs text-muted-foreground">{book.pubDate}</p>
                {book.categoryName && (
                  <Badge variant="secondary" className="text-xs">{book.categoryName.split('>').pop()?.trim()}</Badge>
                )}
                <p className="text-xs text-foreground/70 line-clamp-2 mt-1">{book.description}</p>
              </div>
              <div className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBook(book)}
                  disabled={!!adding}
                >
                  <BookPlus className="h-4 w-4 mr-1" />
                  추가
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12 text-muted-foreground">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

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
                  <Button
                    key={s}
                    variant={statusChoice === s ? 'default' : 'outline'}
                    onClick={() => setStatusChoice(s)}
                    size="sm"
                  >
                    {labels[s]}
                  </Button>
                )
              })}
            </div>
            <Button
              className="w-full"
              onClick={addBook}
              disabled={!!adding}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              책장에 추가하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
