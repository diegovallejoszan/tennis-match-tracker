import { z } from "zod";

export const helloResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string()
});

export type HelloResponse = z.infer<typeof helloResponseSchema>;

export function buildHelloResponse(now: Date = new Date()): HelloResponse {
  return {
    message: "Hello from Tennis Match Tracker",
    timestamp: now.toISOString()
  };
}
