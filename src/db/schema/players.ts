import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { users } from "./auth";

export const players = pgTable("players", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  /** Per-day time slots; legacy rows may use `{ mon: true }` booleans. */
  availability: jsonb("availability").$type<Record<string, unknown> | null>(),
  playStyle: varchar("play_style", { length: 100 }),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
