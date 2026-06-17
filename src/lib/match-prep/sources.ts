export type SourceTrustTier = "tier1" | "tier2";

export type TacticSource = {
  id: string;
  title: string;
  organization: string;
  trustTier: SourceTrustTier;
  url: string;
};

/**
 * Curated, stable sources for tactical recommendations.
 * Prefer Tier 1 (governing bodies) whenever possible.
 */
export const TACTIC_SOURCES: readonly TacticSource[] = [
  {
    id: "itf-coach-education-tactics",
    title: "Strategy and tactics in tournament singles play (Coach Education Series)",
    organization: "International Tennis Federation (ITF)",
    trustTier: "tier1",
    url: "https://itfcoachingreview.com/index.php/journal/article/download/400/1059/1628",
  },
  {
    id: "usta-aggressive-baseliner",
    title: "Tactical Tennis: Beating an Aggressive Baseliner",
    organization: "USTA",
    trustTier: "tier1",
    url: "https://www.usta.com/en/home/improve/tips-and-instruction/national/tactical-tennis--playing-the-aggressive-baseliner.html",
  },
  {
    id: "lta-skills-techniques-tactics",
    title: "Tennis skills, techniques and tactics (units 12 and 07)",
    organization: "Lawn Tennis Association (LTA)",
    trustTier: "tier1",
    url: "https://www.lta.org.uk/4ab8ae/siteassets/roles/further-education/units-12-and-07-tennis-skills-techniques-and-tactics.pdf",
  },
  {
    id: "tennis-canada-wpdp",
    title: "Whole Player Development Pathway (WPDP)",
    organization: "Tennis Canada",
    trustTier: "tier1",
    url: "https://tenniscanadamediacentre.com/wp-content/uploads/2023/11/Whole-Player-Development-Pathway-WPDP.pdf",
  },
  {
    id: "acecoach-phases-of-play",
    title: "Tactical phases of play (Neutral / Offence / Defence)",
    organization: "ACECoach",
    trustTier: "tier2",
    url: "https://acecoach.com/phases-of-play/",
  },
  {
    id: "on-court-guide-strategy-booklet",
    title: "The On-Court Guide to Tennis (strategy booklet)",
    organization: "Coaching publication (compiled booklet)",
    trustTier: "tier2",
    url: "https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/2484d7dc-15b0-483a-a94b-ebf5aae47a74/2509/Tennis/Tennis%20Strategy%20Booklet.pdf",
  },
  {
    id: "winning-ugly-gilbert",
    title: "Winning Ugly: Mental Warfare in Tennis — Lessons from a Master (3rd ed.)",
    organization: "Brad Gilbert & Steve Jamison (book)",
    trustTier: "tier2",
    url: "https://www.goodreads.com/book/show/7540.Winning_Ugly",
  },
  {
    id: "winning-ugly-summary-tennis360",
    title: "Winning Ugly — chapter summary (coaching academy notes)",
    organization: "Tennis360 (summary of Gilbert & Jamison)",
    trustTier: "tier2",
    url: "https://www.tennis360.com.au/post/winning-ugly-brad-gilbert",
  },
  {
    id: "brain-game-tennis",
    title: "Brain Game Tennis — patterns, percentages & match analysis",
    organization: "Craig O'Shannessy / Brain Game Tennis",
    trustTier: "tier2",
    url: "https://braingametennis.com/craig-oshannessy/",
  },
  {
    id: "essential-tennis",
    title: "Essential Tennis — instruction, podcasts & match strategy",
    organization: "Ian Westermann / Essential Tennis",
    trustTier: "tier2",
    url: "https://www.essentialtennis.com/",
  },
  {
    id: "fuzzy-yellow-balls",
    title: "The Singles Playbook & video coaching",
    organization: "Fuzzy Yellow Balls (Will Hamilton)",
    trustTier: "tier2",
    url: "https://www.fuzzyyellowballs.com/singles-playbook/",
  },
  {
    id: "mouratoglou-coaching-corner",
    title: "Mouratoglou Coaching Corner — tactics & technique",
    organization: "Mouratoglou Academy",
    trustTier: "tier2",
    url: "https://www.mouratoglou.com/en/conseils-coaching/coaching-corner/",
  },
  {
    id: "amateur-tactical-survival-manual",
    title: "Tactical Survival Manual: The 5 Amateur Tennis Player Styles",
    organization: "Club-level tactical guide (translated from Spanish original)",
    trustTier: "tier2",
    url: "https://github.com/diegovallejoszan/tennis-match-tracker/blob/main/docs/match-prep/amateur-tactical-survival-manual.md",
  },
] as const;

export function getTacticSourceById(id: string): TacticSource {
  const found = TACTIC_SOURCES.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Unknown tactic source id: ${id}`);
  }
  return found;
}

