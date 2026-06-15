'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, Search, Home, CalendarCheck, Target } from 'lucide-react'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/books/search', label: '검색', icon: Search },
  { href: '/books', label: '책장', icon: BookOpen },
  { href: '/attendance', label: '출석', icon: CalendarCheck },
  { href: '/goals', label: '목표', icon: Target },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                active
                  ? 'text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
