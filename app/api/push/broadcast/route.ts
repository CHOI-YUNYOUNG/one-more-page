import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// 관리자가 문구를 직접 지정해 전체 구독자에게 푸시 알림을 보내는 엔드포인트.
// curl -X POST -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" \
//   -d '{"title":"한 장 더","body":"새로운 기능이 생겼어요!","url":"/"}' \
//   https://one-more-page-one.vercel.app/api/push/broadcast
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, body, url } = await request.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'title, body는 필수입니다.' }, { status: 400 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const admin = getSupabaseAdmin()
  const { data: subscriptions, error: subError } = await admin.from('push_subscriptions').select('*')
  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const payload = JSON.stringify({ title, body, url: url || '/' })

  let sent = 0
  let failed = 0

  for (const sub of subscriptions ?? []) {
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

  return NextResponse.json({ sent, failed })
}
