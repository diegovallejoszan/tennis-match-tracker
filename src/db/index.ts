import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth";
import * as matchPrepAdviceSchema from "./schema/match-prep-advice";
import * as matchesSchema from "./schema/matches";
import * as playersSchema from "./schema/players";
import * as userPreferencesSchema from "./schema/user-preferences";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...playersSchema,
    ...matchesSchema,
    ...userPreferencesSchema,
    ...matchPrepAdviceSchema,
  },
});

export * from "./schema/auth";
export * from "./schema/match-prep-advice";
export * from "./schema/matches";
export * from "./schema/players";
export * from "./schema/user-preferences";
