'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'sepia' | 'forest'

const THEME_KEY = 'bookmind_theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return { theme, setTheme }
}
