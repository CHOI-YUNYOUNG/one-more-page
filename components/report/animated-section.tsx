export function AnimatedSection({
  delayMs = 0,
  className,
  children,
}: {
  delayMs?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${className ?? ''}`}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}
