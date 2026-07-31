import { z } from "zod";

export const matchPrepAdviceRequestSchema = z.object({
  opponentId: z.string().uuid("Select an opponent"),
  plannedMatchDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
});

export type MatchPrepAdviceRequest = z.infer<typeof matchPrepAdviceRequestSchema>;

export function parseMatchPrepAdviceRequest(input: unknown) {
  return matchPrepAdviceRequestSchema.safeParse(input);
}
