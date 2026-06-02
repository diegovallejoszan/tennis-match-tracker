import {
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { players } from "./players";
import { users } from "./auth";

export const MATCH_OUTCOMES = ["win", "loss", "non_finished"] as const;

export const SCORE_SEGMENT_TYPES = [
  "set",
  "long_set",
  "tie_break",
  "super_tie_break",
] as const;

export const matches = pgTable("matches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  time: time("time", { withTimezone: false }),
  matchType: varchar("match_type", { length: 20 }).notNull(),
  /**
   * Competitive matches: "win" | "loss" | "non_finished".
   * Practice matches: null.
   */
  outcome: varchar("outcome", { length: 20 }),
  /** Auto-generated from segments, or legacy free-text from Phase 3. */
  score: varchar("score", { length: 120 }),
  /** Typed and/or transcribed from audio. */
  notes: text("notes"),
  /** Optional URL when audio is stored (blob storage). */
  notesAudioUrl: varchar("notes_audio_url", { length: 500 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const matchScoreSegments = pgTable("match_score_segments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  segmentOrder: integer("segment_order").notNull(),
  segmentType: varchar("segment_type", { length: 20 }).notNull(),
  userGamesOrPoints: integer("user_games_or_points").notNull(),
  opponentGamesOrPoints: integer("opponent_games_or_points").notNull(),
});

export const matchPlayers = pgTable("match_players", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
});
