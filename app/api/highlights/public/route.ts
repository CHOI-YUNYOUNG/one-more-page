import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
)

function secondsUntilNext9amKST(): number {
  const now = new Date()
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const next9am = new Date(kstNow)
  next9am.setUTCHours(0, 0, 0, 0) // midnight UTC = 9am KST
  next9am.setUTCHours(0, 0, 0, 0)
  // 9am KST = 0am UTC
  const todayMidnightUTC = new Date(now)
  todayMidnightUTC.setUTCHours(0, 0, 0, 0)
  const todayNineKST = new Date(todayMidnightUTC) // 0am UTC = 9am KST

  if (now >= todayNineKST) {
    todayNineKST.setUTCDate(todayNineKST.getUTCDate() + 1)
  }
  return Math.max(60, Math.floor((todayNineKST.getTime() - now.getTime()) / 1000))
}

export async function GET() {
  const { data, error } = await supabase
    .from('highlights')
    .select('id, user_id, book_id, page_number, content, note, created_at, book:books(title, author, cover_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ttl = secondsUntilNext9amKST()
  const isDev = process.env.NODE_ENV === 'development'
  return NextResponse.json(data ?? [], {
    headers: {
      'Cache-Control': isDev
        ? 'no-store'
        : `public, s-maxage=${ttl}, stale-while-revalidate=3600`,
    },
  })
}
