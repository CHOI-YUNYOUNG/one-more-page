import { forwardRef } from 'react'
import { UserBook } from '@/lib/supabase'
import { Star, BookOpen, Highlighter } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export type MonthlyReportData = {
  month: Date
  completedBooks: UserBook[]
  highlightCount: number
}

function average(nums: number[]) {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export const MonthlyReportCard = forwardRef<HTMLDivElement, MonthlyReportData>(
  ({ month, completedBooks, highlightCount }, ref) => {
    const ratings = completedBooks.map((b) => b.rating).filter((r): r is number => !!r)
    const avgRating = average(ratings)
    const reviews = completedBooks.filter((b) => b.review && b.review.trim().length > 0)

    return (
      <div ref={ref} className="bg-card text-card-foreground rounded-2xl border p-6 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">한 장 더와 함께한</p>
          <h2 className="text-2xl font-bold">{format(month, 'yyyy년 M월', { locale: ko })}</h2>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-primary/5 rounded-xl py-3 space-y-1">
            <BookOpen className="h-4 w-4 mx-auto text-primary" />
            <p className="text-lg font-bold">{completedBooks.length}</p>
            <p className="text-[11px] text-muted-foreground">완독</p>
          </div>
          <div className="bg-primary/5 rounded-xl py-3 space-y-1">
            <Star className="h-4 w-4 mx-auto text-primary" />
            <p className="text-lg font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
            <p className="text-[11px] text-muted-foreground">평균 별점</p>
          </div>
          <div className="bg-primary/5 rounded-xl py-3 space-y-1">
            <Highlighter className="h-4 w-4 mx-auto text-primary" />
            <p className="text-lg font-bold">{highlightCount}</p>
            <p className="text-[11px] text-muted-foreground">하이라이트</p>
          </div>
        </div>

        {completedBooks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">이 달에 완독한 책</p>
            <ul className="space-y-1.5">
              {completedBooks.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate">{b.book?.title}</span>
                  {b.rating ? (
                    <span className="flex items-center gap-0.5 text-primary shrink-0">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs">{b.rating}</span>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">이 달에 남긴 총평 {reviews.length}개</p>
            <div className="space-y-2">
              {reviews.map((b) => (
                <p key={b.id} className="text-xs italic text-foreground/80 line-clamp-2">
                  “{b.review}”
                </p>
              ))}
            </div>
          </div>
        )}

        {completedBooks.length === 0 && highlightCount === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            이 달은 기록이 없어요. 다음 달엔 한 장 더 남겨봐요.
          </p>
        )}
      </div>
    )
  }
)
MonthlyReportCard.displayName = 'MonthlyReportCard'
