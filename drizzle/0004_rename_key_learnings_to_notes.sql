-- Rename legacy key_learnings column to notes (if present).
-- Apply manually when upgrading; `pnpm db:push` syncs from schema.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matches'
      AND column_name = 'key_learnings'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matches'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE "matches" RENAME COLUMN "key_learnings" TO "notes";
  END IF;
END $$;
