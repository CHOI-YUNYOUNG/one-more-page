import { cn } from '@/lib/utils'

// 표지 이미지가 없는 책을 위한 기본 썸네일. 책 제목을 텍스트로 보여준다.
export function BookCoverPlaceholder({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-muted rounded flex items-center justify-center p-2 text-center',
        className
      )}
    >
      <span className="text-[11px] font-medium leading-snug line-clamp-4 text-muted-foreground break-keep">
        {title}
      </span>
    </div>
  )
}
