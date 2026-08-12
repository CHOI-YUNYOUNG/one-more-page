'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, Search, Home, User, Highlighter } from 'lucide-react'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/books/search', label: '검색', icon: Search },
  { href: '/books', label: '책장', icon: BookOpen },
  { href: '/my-highlights', label: '하이라이트', icon: Highlighter },
  { href: '/profile', label: '프로필', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-[4.5rem]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 min-w-[56px]"
            >
              <div className={cn(
                'flex items-center justify-center w-12 h-7 rounded-full transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className={cn('h-6 w-6', active && 'stroke-[2.5]')} />
              </div>
              <span className={cn(
                'text-[11px] transition-colors',
                active ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
