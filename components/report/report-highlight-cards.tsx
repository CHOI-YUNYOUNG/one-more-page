import Image from 'next/image'
import { Star, Highlighter, BookOpen, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type TopRatedBook = { title: string; cover_url: string | null; rating: number }
export type TopHighlightedBook = { title: string; cover_url: string | null; count: number }
export type FirstReadBook = { title: string; cover_url: string | null; started_at: string }
export type TopGenre = { genre: string; count: number }

function StoryCard({
  gradient,
  label,
  icon,
  cover,
  title,
  children,
}: {
  gradient: string
  label: string
  icon: React.ReactNode
  cover?: string | null
  title?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white flex items-center gap-4 min-h-[128px] shadow-lg transition-transform duration-200 active:scale-[0.98]',
        gradient
      )}
    >
      {cover ? (
        <div className="shrink-0 rotate-[-4deg] shadow-xl rounded-md overflow-hidden ring-4 ring-white/20">
          <Image src={cover} alt={title ?? ''} width={64} height={92} className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 h-16 w-16 rounded-full bg-white/15 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/80">
          {icon}
          {label}
        </p>
        {children}
      </div>
    </div>
  )
}

export function TopRatedCard({ book }: { book: TopRatedBook }) {
  return (
    <StoryCard
      gradient="bg-gradient-to-br from-amber-400 to-orange-600"
      label="이 달의 최고 별점"
      icon={<Star className="h-4 w-4" />}
      cover={book.cover_url}
      title={book.title}
    >
      <p className="mt-1 font-bold text-lg leading-snug line-clamp-2">{book.title}</p>
      <div className="mt-1 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn('h-3.5 w-3.5', i < book.rating ? 'fill-current' : 'opacity-30')} />
        ))}
      </div>
    </StoryCard>
  )
}

export function MostHighlightedCard({ book }: { book: TopHighlightedBook }) {
  return (
    <StoryCard
      gradient="bg-gradient-to-br from-fuchsia-500 to-purple-700"
      label="이 달의 최다 하이라이트"
      icon={<Highlighter className="h-4 w-4" />}
      cover={book.cover_url}
      title={book.title}
    >
      <p className="mt-1 font-bold text-lg leading-snug line-clamp-2">{book.title}</p>
      <p className="text-sm text-white/80 mt-0.5">하이라이트 {book.count}개</p>
    </StoryCard>
  )
}

export function FirstReadCard({ book }: { book: FirstReadBook }) {
  return (
    <StoryCard
      gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
      label="이 달 처음 펼친 책"
      icon={<BookOpen className="h-4 w-4" />}
      cover={book.cover_url}
      title={book.title}
    >
      <p className="mt-1 font-bold text-lg leading-snug line-clamp-2">{book.title}</p>
      <p className="text-sm text-white/80 mt-0.5">
        {format(new Date(book.started_at), 'M월 d일', { locale: ko })}에 시작했어요
      </p>
    </StoryCard>
  )
}

export function TopGenreCard({ genre }: { genre: TopGenre }) {
  return (
    <StoryCard
      gradient="bg-gradient-to-br from-indigo-500 to-blue-700"
      label="이 달 가장 많이 읽은 장르"
      icon={<Tag className="h-4 w-4" />}
    >
      <p className="mt-1 font-bold text-xl leading-snug">{genre.genre}</p>
      <p className="text-sm text-white/80 mt-0.5">{genre.count}권</p>
    </StoryCard>
  )
}
