'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase, UserBook, Highlight, ReadingPlan } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { HighlightForm } from '@/components/books/highlight-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MessageSquare, Sparkles, Loader2, Trash2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const userId = useUser()
  const [userBook, setUserBook] = useState<UserBook | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [currentPage, setCurrentPage] = useState('')

  const fetchData = useCallback(async () => {
    if (!userId) return
    const { data: ub } = await supabase
      .from('user_books')
      .select('*, book:books(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (ub) {
      setUserBook(ub as UserBook)
      setCurrentPage(String(ub.current_page || ''))
    }

    const { data: hl } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', ub?.book_id)
      .order('created_at', { ascending: false })
    if (hl) setHighlights(hl)
  }, [userId, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateAI = async () => {
    if (!userBook?.book) return
    setLoadingAI(true)
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: userBook.book.title,
          author: userBook.book.author,
          description: userBook.book.description,
          totalPages: userBook.total_pages,
        }),
      })
      const data = await res.json()
      await supabase
        .from('user_books')
        .update({
          ai_summary: data.summary,
          ai_reading_plan: data.reading_plan,
        })
        .eq('id', id)
      toast.success('AI 요약이 생성되었습니다!')
      fetchData()
    } catch {
      toast.error('AI 생성에 실패했습니다.')
    }
    setLoadingAI(false)
  }

  const updateStatus = async (status: string | null) => {
    if (!status) return
    await supabase.from('user_books').update({ status }).eq('id', id)
    fetchData()
  }

  const updatePage = async () => {
    const page = parseInt(currentPage)
    if (isNaN(page)) return
    await supabase.from('user_books').update({ current_page: page }).eq('id', id)
    toast.success('진행 상황이 저장되었습니다.')
    fetchData()
  }

  const updateRating = async (rating: string | null) => {
    if (!rating) return
    await supabase.from('user_books').update({ rating: parseInt(rating) }).eq('id', id)
    fetchData()
  }

  const deleteBook = async () => {
    await supabase.from('highlights').delete().eq('book_id', userBook?.book_id).eq('user_id', userId)
    await supabase.from('ai_conversations').delete().eq('book_id', userBook?.book_id).eq('user_id', userId)
    await supabase.from('user_books').delete().eq('id', id)
    toast.success('책이 삭제되었습니다.')
    router.push('/books')
  }

  if (!userBook) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const book = userBook.book!
  const plan = userBook.ai_reading_plan as ReadingPlan | null
  const progress =
    userBook.total_pages && userBook.current_page
      ? Math.round((userBook.current_page / userBook.total_pages) * 100)
      : 0

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/books">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">내 책장</span>
      </div>

      <div className="flex gap-6">
        <div className="shrink-0">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={120}
              height={170}
              className="rounded-lg shadow-md object-cover"
            />
          ) : (
            <div className="w-[120px] h-[170px] bg-muted rounded-lg flex items-center justify-center text-4xl shadow-md">
              📚
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-bold leading-snug">{book.title}</h1>
            <p className="text-muted-foreground">{book.author}</p>
            <p className="text-sm text-muted-foreground">{book.publisher} · {book.pub_date}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={userBook.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wishlist">읽고 싶어요</SelectItem>
                <SelectItem value="reading">읽는 중</SelectItem>
                <SelectItem value="completed">완독</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(userBook.rating || '')} onValueChange={updateRating}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="별점" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {'★'.repeat(n)}{'☆'.repeat(5 - n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                <Trash2 className="h-3 w-3" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>책을 삭제하시겠어요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    관련된 하이라이트와 대화 내역도 함께 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteBook}>삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {userBook.total_pages && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  className="w-20 h-7 text-xs"
                  placeholder="현재"
                  min={0}
                  max={userBook.total_pages}
                />
                <span className="text-xs text-muted-foreground">/ {userBook.total_pages}p</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={updatePage}>
                  저장
                </Button>
              </div>
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{progress}% 완료</p>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="w-full">
          <TabsTrigger value="summary" className="flex-1">AI 요약</TabsTrigger>
          <TabsTrigger value="plan" className="flex-1">독서 루틴</TabsTrigger>
          <TabsTrigger value="highlights" className="flex-1">하이라이트</TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 relative">
            <Link href={`/books/${id}/chat`} className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              AI 토론
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">AI 책 요약</CardTitle>
              <Button size="sm" variant="outline" onClick={generateAI} disabled={loadingAI}>
                {loadingAI ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {userBook.ai_summary ? '재생성' : 'AI 요약 생성'}
              </Button>
            </CardHeader>
            <CardContent>
              {userBook.ai_summary ? (
                <p className="text-sm leading-relaxed">{userBook.ai_summary}</p>
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p className="text-3xl">✨</p>
                  <p className="text-sm">AI가 이 책의 핵심을 요약해드려요</p>
                  <Button size="sm" onClick={generateAI} disabled={loadingAI}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    요약 생성하기
                  </Button>
                </div>
              )}

              {plan?.questions && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">읽으면서 생각해볼 질문들</h4>
                  <ul className="space-y-2">
                    {plan.questions.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary font-medium shrink-0">Q{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {plan ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">하루 {plan.daily_minutes}분 권장</Badge>
                  </div>
                  <div className="space-y-3">
                    {plan.weeks.map((week) => (
                      <div key={week.week} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{week.week}주차</Badge>
                          <span className="text-xs text-muted-foreground">{week.pages}p</span>
                        </div>
                        <p className="text-sm font-medium">{week.goal}</p>
                        <ul className="space-y-1">
                          {week.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1">
                              <span>•</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p className="text-3xl">📅</p>
                  <p className="text-sm">AI가 맞춤 독서 루틴을 짜드려요</p>
                  <Button size="sm" onClick={generateAI} disabled={loadingAI}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    루틴 생성하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          <HighlightForm
            bookId={book.id}
            highlights={highlights}
            onAdded={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
