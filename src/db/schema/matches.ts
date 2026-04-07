import { date, pgTable, text, time, timestamp, varchar } from "drizzle-orm/pg-core";

import { players } from "./players";
import { users } from "./auth";

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
  /** Set for competitive singles/doubles: "win" | "loss". Null for practice. */
  outcome: varchar("outcome", { length: 10 }),
  score: varchar("score", { length: 50 }),
  /** Free-form match notes: learnings, observations, etc. */
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
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
