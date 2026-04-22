-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- StudyBuddy AI — Complete Database Schema
-- Supabase માં આ SQL run કરો (SQL Editor માં)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Enable UUID extension ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ━━━━━━━━━━━━━━━━━
-- 1. PROFILES TABLE
-- ━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  dob           DATE,
  phone         TEXT,
  city          TEXT,
  country       TEXT,
  bio           TEXT,
  goals         TEXT,
  daily_hours   INTEGER DEFAULT 4,
  exam_date     DATE,
  institution   TEXT,
  edu_level     TEXT,
  stream        TEXT,
  roll_no       TEXT,
  year_sem      TEXT,
  board         TEXT,
  awards        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━
-- 2. SUBJECTS TABLE
-- ━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#4F8EF7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━
-- 3. TASKS TABLE
-- ━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS tasks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject    TEXT,
  title      TEXT NOT NULL,
  deadline   DATE,
  priority   TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  done       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━
-- 4. NOTES TABLE
-- ━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject    TEXT,
  title      TEXT NOT NULL,
  content    TEXT DEFAULT '',
  starred    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━
-- 5. TIMETABLE TABLE
-- ━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS timetable (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject    TEXT NOT NULL,
  day        TEXT NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  room       TEXT,
  type       TEXT DEFAULT 'class' CHECK (type IN ('class','lab','study','exam')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━
-- 6. FLASHCARDS TABLE
-- ━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject     TEXT,
  front       TEXT NOT NULL,
  back        TEXT NOT NULL,
  difficulty  INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━
-- 7. STUDY SESSIONS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS study_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject       TEXT,
  duration_mins INTEGER NOT NULL,
  type          TEXT DEFAULT 'pomodoro' CHECK (type IN ('pomodoro', 'regular')),
  completed     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━
-- 8. USER XP TABLE
-- ━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS user_xp (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp    INTEGER DEFAULT 0,
  level       INTEGER DEFAULT 1,
  streak      INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE
);

-- ━━━━━━━━━━━━━━━━━━━━━━
-- 9. ROW LEVEL SECURITY
-- (Users can only see their own data)
-- ━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp         ENABLE ROW LEVEL SECURITY;

-- ── Policies: Only owner can access own data ──
CREATE POLICY "Users own data" ON profiles        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON subjects        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON tasks           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON notes           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON timetable       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON flashcards      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON study_sessions  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON user_xp         FOR ALL USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. AUTO CREATE PROFILE ON SIGNUP (Trigger)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  
  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);
  
  -- Default subjects
  INSERT INTO public.subjects (user_id, name, color) VALUES
    (NEW.id, 'Math',    '#4F8EF7'),
    (NEW.id, 'Physics', '#A78BFA'),
    (NEW.id, 'English', '#F87171'),
    (NEW.id, 'Biology', '#F5A623'),
    (NEW.id, 'History', '#22D3EE');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
