import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth";
import * as matchesSchema from "./schema/matches";
import * as playersSchema from "./schema/players";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, {
  schema: { ...authSchema, ...playersSchema, ...matchesSchema },
});

export * from "./schema/auth";
export * from "./schema/matches";
export * from "./schema/players";
