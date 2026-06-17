/**
 * Structured outline of *Winning Ugly* (Brad Gilbert & Steve Jamison).
 * Paraphrased from chapter summaries; see sources.ts for citations.
 */

export type WinningUglyChapter = {
  number: number;
  title: string;
  summary: string;
};

/** Core pre-match / between-points questions (Ch. 7–8). */
export const WINNING_UGLY_GAME_PLAN_QUESTIONS = [
  "Who is doing what to whom right now?",
  "What do I want to prevent from happening?",
  "What do I want to make happen?",
  "How do I win the most points with my best weapon?",
  "What is their strength—and how do I keep it out of play?",
  "What is their weakness—and how do I attack it?",
] as const;

/** Gilbert’s opponent labels (Ch. 8) mapped to app archetypes in generator.ts. */
export const WINNING_UGLY_OPPONENT_STYLES = [
  {
    gilbertLabel: "Retriever",
    summary:
      "Human backboard: long rallies, comfortable staying deep. Beat with patience, bring them forward, and make slower balls harder than fast ones.",
    appArchetypes: ["moonballer_retriever", "counterpuncher"] as const,
  },
  {
    gilbertLabel: "Speedster",
    summary:
      "Uses court coverage and pace absorption. Hit deep through the middle to deny angles; crowd their position instead of feeding their run.",
    appArchetypes: ["counterpuncher", "aggressive_baseliner"] as const,
  },
  {
    gilbertLabel: "Soft hitter / Nerf baller",
    summary:
      "Low pace and junk rhythm. Take the ball early with a normal swing—don’t crush—and prioritize placement over power.",
    appArchetypes: ["moonballer_retriever"] as const,
  },
] as const;

export const WINNING_UGLY_OUTLINE: readonly WinningUglyChapter[] = [
  {
    number: 0,
    title: "Preface — Winning ugly",
    summary:
      "Win with thinking and patterns, not prettier strokes. Outprepare and out-adjust opponents who play without a plan.",
  },
  {
    number: 1,
    title: "Mental preparation: the pre-match advantage",
    summary:
      "Study the opponent before you walk on court. Build a mental compass: what to force and what to prevent, including temperament and emotional triggers.",
  },
  {
    number: 7,
    title: "The key to victory",
    summary:
      "Write a game plan from both players’ strengths and weaknesses. Take notes during and after matches to improve future plans.",
  },
  {
    number: 8,
    title: "Destroying your opponent’s game plan",
    summary:
      "Style counters: retrievers (patience, net, slower balls); speedsters (deep middle, don’t let them run); soft balls (placement, not power); protect weak wings conservatively.",
  },
  {
    number: 9,
    title: "The seven hidden ad points",
    summary:
      "Treat set-up points, dictate games, stretch leads, and closing-out phases as distinct tactical situations—adjust when the match slips away.",
  },
  {
    number: 17,
    title: "Tournament tough all the time",
    summary:
      "Recognize, analyse, capitalise. Have a plan, don’t rush, and use tempo control between points when you need to reset.",
  },
] as const;
