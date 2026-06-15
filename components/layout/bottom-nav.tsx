'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, Search, Home, CalendarCheck, User } from 'lucide-react'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/books/search', label: '검색', icon: Search },
  { href: '/books', label: '책장', icon: BookOpen },
  { href: '/attendance', label: '출석', icon: CalendarCheck },
  { href: '/profile', label: '프로필', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              </div>
              <span className={cn(
                'text-[10px] transition-colors',
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
