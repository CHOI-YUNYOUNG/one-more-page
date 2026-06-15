'use client'

import { useTheme, Theme } from '@/hooks/use-theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette } from 'lucide-react'

const themes: { value: Theme; label: string; emoji: string }[] = [
  { value: 'light', label: '라이트', emoji: '☀️' },
  { value: 'dark', label: '다크', emoji: '🌙' },
  { value: 'sepia', label: '세피아', emoji: '📜' },
  { value: 'forest', label: '포레스트', emoji: '🌲' },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const current = themes.find((t) => t.value === theme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <Palette className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={theme === t.value ? 'font-semibold' : ''}
          >
            <span className="mr-2">{t.emoji}</span>
            {t.label}
            {theme === t.value && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
