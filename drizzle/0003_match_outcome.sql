-- Outcome (win/loss) for singles and doubles matches.
-- Apply with `pnpm db:push` or run manually.

ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "outcome" varchar(10);
