'use client'

import { useEffect, useRef, useState } from 'react'
import { Quote } from 'lucide-react'

const TYPE_SPEED_MS = 35
const HOLD_MS = 1800
const FADE_MS = 300

export function HighlightTypewriter({ highlights, animate }: { highlights: string[]; animate: boolean }) {
  const [index, setIndex] = useState(0)
  const [display, setDisplay] = useState('')
  const [visible, setVisible] = useState(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (highlights.length === 0) return
    const text = highlights[index % highlights.length]

    if (!animate) {
      setDisplay(text)
      setVisible(true)
      return
    }

    setDisplay('')
    setVisible(true)
    for (let i = 1; i <= text.length; i++) {
      timers.current.push(setTimeout(() => setDisplay(text.slice(0, i)), i * TYPE_SPEED_MS))
    }
    timers.current.push(
      setTimeout(() => {
        setVisible(false)
        timers.current.push(
          setTimeout(() => setIndex((prev) => (prev + 1) % highlights.length), FADE_MS)
        )
      }, text.length * TYPE_SPEED_MS + HOLD_MS)
    )

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [index, animate, highlights])

  if (highlights.length === 0) return null

  return (
    <div className="rounded-2xl border bg-card p-5 min-h-[128px] flex flex-col justify-center">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
        <Quote className="h-3.5 w-3.5" />이 달의 하이라이트
      </p>
      <p
        className={`text-sm italic leading-relaxed text-foreground/80 whitespace-pre-wrap transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        “{display}”
      </p>
    </div>
  )
}
