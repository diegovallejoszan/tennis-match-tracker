import { date, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { players } from "./players";

export type MatchPrepContextSnapshot = {
  missingSections: string[];
  opponentId: string;
  opponentName: string | null;
  headToHeadCount: number;
  recentMatchCount: number;
  hasUserProfile: boolean;
};

export const matchPrepAdvices = pgTable("match_prep_advices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  opponentId: text("opponent_id").references(() => players.id, {
    onDelete: "set null",
  }),
  plannedMatchDate: date("planned_match_date", { mode: "string" }).notNull(),
  adviceMarkdown: text("advice_markdown").notNull(),
  /** Snapshot of prompt context metadata for audit / replay */
  contextSnapshot: jsonb("context_snapshot").$type<MatchPrepContextSnapshot | null>(),
  knowledgeBaseVersion: varchar("knowledge_base_version", { length: 20 }),
  modelId: varchar("model_id", { length: 100 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
