-- TASK-04: Add optimistic-lock versioning for notes.
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;