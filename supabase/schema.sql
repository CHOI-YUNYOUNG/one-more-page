-- One More Page - Supabase Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn text UNIQUE NOT NULL,
  title text NOT NULL,
  author text,
  publisher text,
  cover_url text,
  description text,
  category text,
  pub_date text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  status text CHECK (status IN ('wishlist', 'reading', 'completed')) DEFAULT 'wishlist',
  rating int CHECK (rating BETWEEN 1 AND 5),
  total_pages int,
  current_page int DEFAULT 0,
  started_at date,
  finished_at date,
  ai_summary text,
  ai_reading_plan jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  page_number int,
  content text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS reading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  target_days int NOT NULL DEFAULT 30,
  current_streak int DEFAULT 0,
  max_streak int DEFAULT 0,
  last_checkin date,
  start_date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for personal use (no auth)
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_books DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals DISABLE ROW LEVEL SECURITY;
