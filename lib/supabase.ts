import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabase().from(...args),
  rpc: (...args: Parameters<SupabaseClient['rpc']>) => getSupabase().rpc(...args),
}

export type Book = {
  id: string
  isbn: string
  title: string
  author: string | null
  publisher: string | null
  cover_url: string | null
  description: string | null
  category: string | null
  pub_date: string | null
  created_at: string
}

export type UserBook = {
  id: string
  user_id: string
  book_id: string
  status: 'wishlist' | 'reading' | 'completed'
  rating: number | null
  total_pages: number | null
  current_page: number
  started_at: string | null
  finished_at: string | null
  ai_summary: string | null
  ai_reading_plan: ReadingPlan | null
  created_at: string
  book?: Book
}

export type ReadingPlan = {
  weeks: {
    week: number
    pages: string
    goal: string
    tips: string[]
  }[]
  questions: string[]
  daily_minutes: number
}

export type Highlight = {
  id: string
  user_id: string
  book_id: string
  page_number: number | null
  content: string
  note: string | null
  created_at: string
}

export type ChatMessage = {
  role: 'user' | 'model'
  content: string
  created_at: string
}

export type AiConversation = {
  id: string
  user_id: string
  book_id: string
  messages: ChatMessage[]
  updated_at: string
}

export type Attendance = {
  id: string
  user_id: string
  date: string
  created_at: string
}

export type ReadingGoal = {
  id: string
  user_id: string
  target_days: number
  current_streak: number
  max_streak: number
  last_checkin: string | null
  start_date: string
  created_at: string
}
