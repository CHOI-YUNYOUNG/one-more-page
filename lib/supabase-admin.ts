import { createClient } from '@supabase/supabase-js'

// 서비스 롤 키로 RLS를 우회하는 관리자 클라이언트. 서버 전용 — client component에서 import 금지.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
