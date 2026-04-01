-- User profile fields (play style, strengths, weaknesses).
-- Apply if you see: column "profilePlayStyle" does not exist
-- Option A: from project root with DATABASE_URL set → pnpm db:push
-- Option B: run this file against your Postgres (Railway query tab, psql, etc.)

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profilePlayStyle" varchar(100);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profileStrengths" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profileWeaknesses" text;
