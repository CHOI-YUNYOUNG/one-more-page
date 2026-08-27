import { CountUpNumber } from './count-up-number'

export function ReportHero({
  bookCount,
  totalPages,
  heightValue,
  heightUnit,
  animate,
}: {
  bookCount: number
  totalPages: number
  heightValue: number
  heightUnit: string
  animate: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 text-center text-white shadow-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 animate-gradient-shift">
      <p className="text-sm font-medium text-white/80 tracking-wide">이번 달, 당신은</p>
      <p className="mt-2 text-6xl font-extrabold leading-none tracking-tight">
        <CountUpNumber value={bookCount} animate={animate} />
        <span className="text-2xl font-bold ml-1 align-middle">권</span>
      </p>
      <p className="mt-2 text-sm text-white/80">의 책을 완독했어요!</p>

      <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
        <div>
          <p className="text-3xl font-bold leading-none">
            <CountUpNumber value={totalPages} animate={animate} />
            <span className="text-base font-semibold ml-0.5 align-middle">장</span>
          </p>
          <p className="mt-1.5 text-xs text-white/70">읽은 페이지</p>
        </div>
        <div>
          <p className="text-3xl font-bold leading-none">
            <CountUpNumber value={heightValue} decimals={1} animate={animate} />
            <span className="text-base font-semibold ml-0.5 align-middle">{heightUnit}</span>
          </p>
          <p className="mt-1.5 text-xs text-white/70">쌓으면 이만큼! 😎🚀</p>
        </div>
      </div>
    </div>
  )
}
