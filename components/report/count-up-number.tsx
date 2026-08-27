'use client'

import { useEffect, useRef, useState } from 'react'

export function CountUpNumber({
  value,
  decimals = 0,
  duration = 1200,
  animate = true,
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  animate?: boolean
  className?: string
}) {
  const [display, setDisplay] = useState(animate ? 0 : value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration, animate])

  return (
    <span className={className}>
      {display.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
