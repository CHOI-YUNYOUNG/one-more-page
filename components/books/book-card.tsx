'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserBook } from '@/lib/supabase'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; color: string }> = {
  wishlist: { label: '읽고 싶어요', color: 'secondary' },
  reading: { label: '읽는 중', color: 'default' },
  completed: { label: '완독', color: 'outline' },
}

export function BookCard({ userBook }: { userBook: UserBook }) {
  const book = userBook.book!
  const status = statusLabel[userBook.status]
  const progress =
    userBook.total_pages && userBook.current_page
      ? Math.round((userBook.current_page / userBook.total_pages) * 100)
      : null

  return (
    <Link href={`/books/${userBook.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex gap-3">
          <div className="shrink-0">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
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
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug line-clamp-2">{book.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">{book.author}</p>
            <p className="text-xs text-muted-foreground truncate">{book.publisher}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={status.color as 'default' | 'secondary' | 'outline'} className="text-xs">
                {status.label}
              </Badge>
              {userBook.rating && (
                <span className="text-xs text-muted-foreground">
                  {'★'.repeat(userBook.rating)}{'☆'.repeat(5 - userBook.rating)}
                </span>
              )}
            </div>
            {progress !== null && (
              <div className="mt-2">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{progress}% 완료</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
