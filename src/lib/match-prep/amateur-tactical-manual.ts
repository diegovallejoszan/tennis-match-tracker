/**
 * Structured outline of the Amateur Tactical Survival Manual.
 * Translated from the original Spanish club-level guide; see sources.ts for citation.
 */

import type { OpponentType } from "./tactics";

export type AmateurStyleProfile = {
  /** English label used in the manual. */
  label: string;
  /** Original Spanish label from the source document. */
  spanishLabel: string;
  pace: string;
  ballHeight: string;
  signature: string;
  trap: string;
  protocol: string;
  appArchetypes: readonly OpponentType[];
};

export const AMATEUR_TACTICAL_STYLES: readonly AmateurStyleProfile[] = [
  {
    label: "Ball-Passer",
    spanishLabel: "El Pasabolas",
    pace: "Slow / Defensive",
    ballHeight: "Medium",
    signature: "Returns everything, takes no risks, and plays through the middle.",
    trap: "Drains your patience; makes you over-hit until you miss.",
    protocol:
      "Pull them out of their comfort zone with floaters or drop shots, then come forward to finish.",
    appArchetypes: ["moonballer_retriever"],
  },
  {
    label: "Lobber",
    spanishLabel: "El Globero",
    pace: "Slow / Defensive",
    ballHeight: "High",
    signature: "Under pressure, answers with an endless lob.",
    trap: "You come in without a plan; the lob catches you off guard and you lose the initiative.",
    protocol:
      "Positional anticipation. If you approach, stand ~2 meters farther back to cover the air space.",
    appArchetypes: ["moonballer_retriever"],
  },
  {
    label: "Lefty",
    spanishLabel: "El Zurdo",
    pace: "Variable",
    ballHeight: "Variable",
    signature: "Inverted visual references and reverse ball spin.",
    trap: "Your timing breaks down automatically.",
    protocol:
      "Anticipate their forehand drive to your backhand. Attack their backhand relentlessly—it is usually their least developed shot.",
    appArchetypes: ["all_court_player"],
  },
  {
    label: "Slice Architect",
    spanishLabel: "El Arquitecto del Slice",
    pace: "Slow / Defensive",
    ballHeight: "Low / Skidding",
    signature: "Serial slicer; everything stays low, slow, and heavy.",
    trap: "Creates anxiety and you end up hitting into the net.",
    protocol:
      "Lower your center of gravity and use topspin to lift the ball off the court. Play high balls to their weak shoulder.",
    appArchetypes: ["counterpuncher", "moonballer_retriever"],
  },
  {
    label: "Basher",
    spanishLabel: "El Pegador",
    pace: "Fast / Offensive",
    ballHeight: "Medium",
    signature: "Hunts winners from the first ball.",
    trap: "Psychological intimidation; their first game can feel devastating.",
    protocol:
      'Play high, slow, and with spin to break their tempo ("rhythmic anesthesia"). Hit deep through the middle to deny angles.',
    appArchetypes: ["aggressive_baseliner"],
  },
] as const;

/** Cross-style principles from "The Pattern Behind the Patterns". */
export const AMATEUR_TACTICAL_META_PRINCIPLES = [
  {
    condition: "They play fast",
    counter: "Take away their speed (Basher protocol).",
  },
  {
    condition: "They play slow",
    counter: "Take away their time (Ball-Passer protocol).",
  },
  {
    condition: "They play low / skidding",
    counter: "Force them to hit up (Slice Architect protocol).",
  },
] as const;
