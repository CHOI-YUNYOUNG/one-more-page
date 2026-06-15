'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeSelector } from './theme-selector'
import { BookOpen, Search, Home, CalendarCheck, User, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/books/search', label: '책 검색', icon: Search },
  { href: '/books', label: '내 책장', icon: BookOpen },
  { href: '/attendance', label: '출석 체크', icon: CalendarCheck },
  { href: '/profile', label: '프로필', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? '')
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col z-50">
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <span className="font-bold text-sidebar-foreground text-lg">One More Page</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {email && (
          <p className="text-xs text-muted-foreground truncate px-1">{email}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">테마</span>
          <ThemeSelector />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
