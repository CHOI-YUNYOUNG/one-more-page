'use client'

import { useEffect, useRef, useState } from 'react'
import { Quote } from 'lucide-react'

const TYPE_SPEED_MS = 35
const GAP_MS = 400 // 한 줄 다 타이핑된 후 다음 줄 시작 전 대기

export function HighlightTypewriter({ highlights, animate }: { highlights: string[]; animate: boolean }) {
  const [displays, setDisplays] = useState<string[]>(() => (animate ? highlights.map(() => '') : highlights))
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (!animate) {
      setDisplays(highlights)
      return
    }

    setDisplays(highlights.map(() => ''))

    // 각 하이라이트를 순서대로 한 번씩만 타이핑하고 멈춘다 (반복 없음).
    let cumulativeDelay = 0
    highlights.forEach((text, lineIndex) => {
      for (let i = 1; i <= text.length; i++) {
        const delay = cumulativeDelay + i * TYPE_SPEED_MS
        timers.current.push(
          setTimeout(() => {
            setDisplays((prev) => {
              const next = [...prev]
              next[lineIndex] = text.slice(0, i)
              return next
            })
          }, delay)
        )
      }
      cumulativeDelay += text.length * TYPE_SPEED_MS + GAP_MS
    })

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [highlights, animate])

  if (highlights.length === 0) return null

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Quote className="h-3.5 w-3.5" />이 달의 하이라이트
      </p>
      {displays.map((text, i) => (
        <p
          key={i}
          className="text-sm italic leading-relaxed text-foreground/80 whitespace-pre-wrap min-h-[1.25em]"
        >
          “{text}”
        </p>
      ))}
    </div>
  )
}
