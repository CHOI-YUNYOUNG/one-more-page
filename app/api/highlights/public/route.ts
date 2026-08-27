import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
)


export async function GET() {
  const { data, error } = await supabase
    .from('highlights')
    .select('id, user_id, book_id, page_number, content, note, created_at, book:books(title, author, cover_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ids = (data ?? []).map((h) => h.id)
  const counts = new Map<string, number>()
  if (ids.length > 0) {
    const { data: likeRows } = await supabase
      .from('highlight_likes')
      .select('highlight_id')
      .in('highlight_id', ids)
    for (const row of likeRows ?? []) {
      counts.set(row.highlight_id, (counts.get(row.highlight_id) ?? 0) + 1)
    }
  }

  const withCounts = (data ?? []).map((h) => ({ ...h, like_count: counts.get(h.id) ?? 0 }))

  return NextResponse.json(withCounts, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
