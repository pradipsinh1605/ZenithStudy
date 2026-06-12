-- TASK-03: Enforce user-isolated RLS on ZenithStudy public tables.
-- Safe to rerun: only creates policies when they are missing.

DO $$
DECLARE
  target_table text;
  tables text[] := ARRAY[
    'profiles',
    'subjects',
    'tasks',
    'notes',
    'timetable',
    'flashcards',
    'study_sessions',
    'user_xp',
    'ai_chat_history'
  ];
BEGIN
  FOREACH target_table IN ARRAY tables LOOP
    IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = target_table
          AND policyname = 'Users can select own rows'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "Users can select own rows" ON public.%I FOR SELECT USING (auth.uid() = user_id)',
          target_table
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = target_table
          AND policyname = 'Users can insert own rows'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "Users can insert own rows" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)',
          target_table
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = target_table
          AND policyname = 'Users can update own rows'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "Users can update own rows" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
          target_table
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = target_table
          AND policyname = 'Users can delete own rows'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "Users can delete own rows" ON public.%I FOR DELETE USING (auth.uid() = user_id)',
          target_table
        );
      END IF;
    END IF;
  END LOOP;
END $$;