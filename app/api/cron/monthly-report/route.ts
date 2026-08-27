import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// 서버 UTC 시계를 기준으로, KST 달력 기준 "지난 달"의 [시작, 끝] UTC 구간을 계산한다.
function getPreviousMonthRangeKST() {
  const nowKST = new Date(Date.now() + KST_OFFSET_MS)
  const year = nowKST.getUTCFullYear()
  const month = nowKST.getUTCMonth() // 0-indexed, KST 기준 이번 달

  const startUtcMs = Date.UTC(year, month - 1, 1) - KST_OFFSET_MS
  const endUtcMs = Date.UTC(year, month, 1) - KST_OFFSET_MS - 1

  return { start: new Date(startUtcMs).toISOString(), end: new Date(endUtcMs).toISOString() }
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const admin = getSupabaseAdmin()
  const { start, end } = getPreviousMonthRangeKST()

  const { data: subscriptions, error: subError } = await admin.from('push_subscriptions').select('*')
  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const byUser = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions ?? []) {
    const list = byUser.get(sub.user_id) ?? []
    list.push(sub)
    byUser.set(sub.user_id, list)
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const [userId, subs] of byUser) {
    const [{ count: completedCount }, { count: highlightCount }] = await Promise.all([
      admin
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('finished_at', start)
        .lte('finished_at', end),
      admin
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end),
    ])

    if (!completedCount && !highlightCount) {
      skipped++
      continue
    }

    const payload = JSON.stringify({
      title: '한 장 더',
      body: '월간 리포트가 도착했어요! 한 장 더와 함께한 한 달. 같이 확인해요!',
      url: '/report',
    })

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err) {
        failed++
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  }

  return NextResponse.json({ sent, skipped, failed })
}
