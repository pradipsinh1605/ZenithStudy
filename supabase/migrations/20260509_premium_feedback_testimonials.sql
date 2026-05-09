-- TASK: Premium SaaS feedback and testimonial capture
-- Public landing-page submissions are insert-only; testimonial display can later read approved rows.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonial_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_type TEXT DEFAULT 'Other',
  message TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can submit testimonials" ON testimonial_submissions;
CREATE POLICY "Anyone can submit testimonials"
  ON testimonial_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Approved testimonials are public" ON testimonial_submissions;
CREATE POLICY "Approved testimonials are public"
  ON testimonial_submissions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');