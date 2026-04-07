-- Match tracking tables (Phase 3).
-- Apply with `pnpm db:push` (recommended) or run manually in Postgres.

CREATE TABLE IF NOT EXISTS "matches" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "time" time,
  "match_type" varchar(20) NOT NULL,
  "score" varchar(50),
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_players" (
  "id" text PRIMARY KEY NOT NULL,
  "match_id" text NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
  "player_id" text NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL
);
