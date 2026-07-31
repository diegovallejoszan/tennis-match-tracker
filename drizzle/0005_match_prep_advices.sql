-- Phase 5c: saved LLM match-prep advice.
-- Prefer `pnpm db:push`; this file is a manual/reference migration.

CREATE TABLE IF NOT EXISTS "match_prep_advices" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "opponent_id" text,
  "planned_match_date" date NOT NULL,
  "advice_markdown" text NOT NULL,
  "context_snapshot" jsonb,
  "knowledge_base_version" varchar(20),
  "model_id" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "match_prep_advices"
    ADD CONSTRAINT "match_prep_advices_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "match_prep_advices"
    ADD CONSTRAINT "match_prep_advices_opponent_id_players_id_fk"
    FOREIGN KEY ("opponent_id") REFERENCES "public"."players"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
