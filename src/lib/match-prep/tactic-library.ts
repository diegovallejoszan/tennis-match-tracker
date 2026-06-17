import { getTacticSourceById } from "./sources";
import { TacticSchema, trustTierToBaseConfidence, type Tactic } from "./tactics";

function cite(sourceId: string) {
  const s = getTacticSourceById(sourceId);
  return {
    sourceId: s.id,
    trustTier: s.trustTier,
    url: s.url,
    title: s.title,
    organization: s.organization,
  } as const;
}

function tactic(input: Omit<Tactic, "confidenceScore" | "citation"> & { sourceId: string }) {
  const citation = cite(input.sourceId);
  const confidenceScore = trustTierToBaseConfidence(citation.trustTier);
  return TacticSchema.parse({
    ...input,
    confidenceScore,
    citation,
  });
}

export const TACTIC_LIBRARY: readonly Tactic[] = [
  // Aggressive baseliner (Tier 1: USTA)
  tactic({
    id: "ab-avoid-extended-rallies",
    opponentType: "aggressive_baseliner",
    situation: "general",
    title: "Avoid playing their favorite extended baseline patterns",
    recommendation:
      "Shorten points when you can: mix in body serves, pull them wide, and look for the first safe chance to transition forward rather than trading hard for long stretches.",
    whyItWorks:
      "Aggressive baseliners thrive when they can groove on the baseline and dictate with repeated heavy groundstrokes. Taking away time/pattern repetition and changing the geometry forces them into lower-percentage decisions.",
    tags: ["percentage_tennis", "change_patterns", "take_time_away"],
    constraints: { format: "singles" },
    sourceId: "usta-aggressive-baseliner",
  }),
  tactic({
    id: "ab-serve-body-or-wide",
    opponentType: "aggressive_baseliner",
    situation: "serve",
    title: "Serve to body or move them wide (then play the open court)",
    recommendation:
      "Prioritize a high-percentage first serve and aim into the body to jam, or out wide to pull them off court; expect a shorter reply and finish into the open court.",
    whyItWorks:
      "Jamming the strike zone reduces clean return acceleration; pulling them wide disrupts their preferred contact point and court position, making the next ball easier to attack.",
    tags: ["serve_plus_one", "create_space"],
    constraints: { format: "singles" },
    sourceId: "usta-aggressive-baseliner",
  }),

  // Core matchplay principles + styles (Tier 1: ITF)
  tactic({
    id: "itf-plan-a-and-b",
    opponentType: "all_court_player",
    situation: "general",
    title: "Start with a simple Plan A, and keep a rehearsed Plan B",
    recommendation:
      "Decide on a primary pattern that uses your best weapon and targets a clear weakness. Also choose one alternate pattern you can switch to within a game if the first isn’t working.",
    whyItWorks:
      "Planning reduces random shot selection under pressure. A clear alternative keeps you from overreacting or changing too many variables at once when momentum shifts.",
    tags: ["game_plan", "use_weapons", "play_to_weakness"],
    constraints: { format: "singles" },
    sourceId: "itf-coach-education-tactics",
  }),
  tactic({
    id: "itf-move-them-with-height-depth-direction",
    opponentType: "counterpuncher",
    situation: "baseline_rally",
    title: "Move them with direction + depth (then finish on a shorter ball)",
    recommendation:
      "Use depth first to keep them behind the baseline, then change direction to open space. When you get a shorter ball, step in and finish to a large target rather than going for a line.",
    whyItWorks:
      "Counterpunchers are comfortable absorbing pace and extending rallies. Creating displacement with depth and controlled direction changes produces shorter replies you can attack safely.",
    tags: ["depth", "create_space", "controlled_aggression"],
    constraints: { format: "singles" },
    sourceId: "itf-coach-education-tactics",
  }),
  tactic({
    id: "itf-serve-and-volleyer-pass-lob-mix",
    opponentType: "serve_and_volleyer",
    situation: "return",
    title: "Make their first volley uncomfortable: low at feet + mix in lob looks",
    recommendation:
      "On returns, prioritize getting the ball low through the middle or at the feet. Mix occasional higher, dipping topspin or a well-timed lob look so they can’t simply close and punch comfortably.",
    whyItWorks:
      "Net rushers win when their first volley is above net height and on their terms. Low/dipping balls force volleys up and create passing/lob opportunities.",
    tags: ["return", "passing", "vary_trajectory"],
    constraints: { format: "singles" },
    sourceId: "itf-coach-education-tactics",
  }),

  // Tactical framework (Tier 1: LTA)
  tactic({
    id: "lta-play-to-weakness-deep",
    opponentType: "all_court_player",
    situation: "baseline_rally",
    title: "Probe weakness with deep crosscourt pressure",
    recommendation:
      "In neutral rallies, keep the ball deep to their weaker side (commonly backhand) until you earn a short ball. Then change direction to the open court.",
    whyItWorks:
      "Depth reduces the opponent’s time and angle options. Repeated deep pressure to a weaker wing increases forced errors and produces shorter replies you can attack.",
    tags: ["depth", "play_to_weakness", "percentages"],
    constraints: { format: "singles" },
    sourceId: "lta-skills-techniques-tactics",
  }),

  // Moonballer / retriever (Tier 2 supplement; many federations don’t use this label)
  tactic({
    id: "mb-hold-baseline-take-rise",
    opponentType: "moonballer_retriever",
    situation: "baseline_rally",
    title: "Hold your ground and take the ball earlier",
    recommendation:
      "Resist drifting back. Stay closer to the baseline, take high balls earlier when possible (on the rise or at peak), and use controlled, higher-margin targets.",
    whyItWorks:
      "Moonballers want you deep behind the baseline where your contact point drops, your angles shrink, and you feel rushed by time. Holding position keeps you in the point’s center of gravity.",
    tags: ["court_position", "take_time_away", "patience"],
    constraints: { format: "singles" },
    sourceId: "on-court-guide-strategy-booklet",
  }),
  tactic({
    id: "mb-forward-back-pattern",
    opponentType: "moonballer_retriever",
    situation: "general",
    title: "Add forward/backward movement to break the loop",
    recommendation:
      "After a few neutral exchanges, use a short slice or drop shot and follow it in. Be ready for the lob/floaty pass and don’t over-close—make them hit a passing shot under pressure.",
    whyItWorks:
      "High-arcing patterns are slow to develop, which gives you time to transition. Pulling them forward disrupts their comfort zone and creates easier balls to finish.",
    tags: ["variety", "transition", "net_play"],
    constraints: { format: "singles" },
    sourceId: "on-court-guide-strategy-booklet",
  }),

  // Winning Ugly (Brad Gilbert) — general matchplay & mental framework
  tactic({
    id: "wu-whos-doing-what",
    opponentType: "all_court_player",
    situation: "general",
    title: "Ask “Who’s doing what to whom?” at every changeover",
    recommendation:
      "On changeovers, answer: who is controlling the pattern, what you want to prevent, and what you want to force. Adjust only one or two variables (target, height, or pace)—not your whole game.",
    whyItWorks:
      "Gilbert’s core idea is that matches are won by pattern control, not by hitting prettier shots. Naming the pattern stops autopilot and makes adjustments deliberate.",
    tags: ["game_plan", "changeover", "pattern_recognition"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),
  tactic({
    id: "wu-strengths-to-weaknesses",
    opponentType: "all_court_player",
    situation: "general",
    title: "Feed your strength into their weakness (and hide your weak wing)",
    recommendation:
      "Write a one-line plan before you play: your best weapon → their clearest weakness. In rallies, accept conservative shots from your weaker side rather than gifting them your strength to attack.",
    whyItWorks:
      "You don’t need better shots overall—only better shot selection. Maximizing your weapon while minimizing theirs raises your win rate without raising risk on every ball.",
    tags: ["use_weapons", "play_to_weakness", "percentage_tennis"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),
  tactic({
    id: "wu-dont-change-winning-game",
    opponentType: "all_court_player",
    situation: "general",
    title: "When you’re ahead, don’t “upgrade” to flashier tennis",
    recommendation:
      "If a pattern is winning points, keep it—even if it feels too safe. Avoid hitting bigger or going for more lines just because you’re leading.",
    whyItWorks:
      "Comfort with a lead often triggers unnecessary risk. Gilbert stresses sticking with the plan that is already working until the opponent proves they can solve it.",
    tags: ["discipline", "percentage_tennis"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),
  tactic({
    id: "wu-pressure-points-steadier",
    opponentType: "all_court_player",
    situation: "general",
    title: "On big points, play steadier—not flashier",
    recommendation:
      "On break points, set points, and deuce: add margin (higher net clearance, bigger targets, one more ball deep) instead of going for highlight-reel winners.",
    whyItWorks:
      "Pressure magnifies errors more than it magnifies winners at most levels. Making opponents earn the point beats donating free points.",
    tags: ["pressure_points", "percentage_tennis"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),
  tactic({
    id: "wu-emotional-opponent-patience",
    opponentType: "all_court_player",
    situation: "baseline_rally",
    title: "If they get emotional, lengthen points and stay steady",
    recommendation:
      "When you know they tilt under frustration, refuse to rush: high margins, consistent depth, and no gratuitous pace changes until you see the error rate rise.",
    whyItWorks:
      "Gilbert used pre-match temperament scouting (e.g. Becker) to choose a patience plan. Staying in every point without forcing gives their emotions time to become a tactical liability.",
    tags: ["mental_game", "patience"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),

  // Winning Ugly — Retriever
  tactic({
    id: "wu-retriever-patience-net",
    opponentType: "moonballer_retriever",
    situation: "general",
    title: "Beat the retriever with patience—and occasional net forays",
    recommendation:
      "Expect long rallies. Mix in approaches and bring them to the net sometimes; against human backboards, slower, well-placed balls are often harder than fast ones.",
    whyItWorks:
      "Retrievers want rhythm and depth from behind the baseline. Changing court position and tempo breaks the loop they rely on.",
    tags: ["patience", "net_play", "variety"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),
  tactic({
    id: "wu-retriever-high-percentage-serves",
    opponentType: "moonballer_retriever",
    situation: "serve",
    title: "Prioritize high-percentage serves over free pace",
    recommendation:
      "If you are not getting aces anyway, favor spin and placement (and reliable second serves) over all-out first serves that hand them easy pace or cheap points off double faults.",
    whyItWorks:
      "Retrievers thrive on using your pace. A reliable serve starts the point on your terms without feeding their best skill.",
    tags: ["serve", "percentage_tennis"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),

  // Winning Ugly — Speedster
  tactic({
    id: "wu-speedster-deep-middle",
    opponentType: "counterpuncher",
    situation: "baseline_rally",
    title: "Don’t let the speedster run: deep through the middle",
    recommendation:
      "Aim deep down the middle to cut off angles and reduce their runway. Avoid slow, short crosscourts that invite them to sprint and counter.",
    whyItWorks:
      "Gilbert’s speedster profile wins with court coverage. Middle targets shrink the court and take away the side-to-side patterns they use best.",
    tags: ["depth", "middle_target", "neutralize_speed"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),
  tactic({
    id: "wu-speedster-crowd-position",
    opponentType: "counterpuncher",
    situation: "baseline_rally",
    title: "Crowd their court position",
    recommendation:
      "When you have time, hit to where they already are (deep to their feet) before you open the court. Make them hit on the move instead of setting up behind the ball.",
    whyItWorks:
      "Fast players want clean looks to explode. Attacking their position first reduces their preparation and neutralizes their best asset.",
    tags: ["court_position", "neutralize_speed"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),

  // Winning Ugly — Soft hitter / placement
  tactic({
    id: "wu-soft-ball-placement",
    opponentType: "moonballer_retriever",
    situation: "baseline_rally",
    title: "On soft balls, prioritize placement—not power",
    recommendation:
      "When they float or block the ball short and slow, resist the urge to crush it. Use normal swing tempo and aim to open space or move them forward.",
    whyItWorks:
      "Soft-hitters bait overhits. Gilbert stresses that power matters less than where the ball lands against junk rhythm players.",
    tags: ["placement", "percentage_tennis"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),
  tactic({
    id: "wu-soft-serve-move-in",
    opponentType: "moonballer_retriever",
    situation: "return",
    title: "On slow serves, step in—but swing normally",
    recommendation:
      "Against dinky first or second serves, move two or three steps inside the baseline and use your regular return swing—don’t try to smack a winner.",
    whyItWorks:
      "Extra court position supplies advantage without the error spike of an all-out block or swing. Small steps and a slightly shorter grip can add control.",
    tags: ["return", "court_position"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),

  // Winning Ugly — When they attack your backhand
  tactic({
    id: "wu-protect-backhand-conservative",
    opponentType: "aggressive_baseliner",
    situation: "passing_defense",
    title: "When they target your backhand, play within your limits",
    recommendation:
      "Use height, depth, and crosscourt margins on the defensive wing. Lob when stretched instead of attempting winners you don’t own.",
    whyItWorks:
      "Gilbert’s rule is to minimize your weakness under fire—not to prove you can hit heroic shots. Survival on the weak side keeps you in the point to work back to your strength.",
    tags: ["defense", "percentage_tennis", "lob"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-summary-tennis360",
  }),

  // Winning Ugly — also applies to fast aggressive baseliners
  tactic({
    id: "wu-speedster-deep-middle-ab",
    opponentType: "aggressive_baseliner",
    situation: "baseline_rally",
    title: "Against fast movers, take away angles with deep middle balls",
    recommendation:
      "When they cover the court well, go deep through the middle before you change direction. Earn a shorter or weaker ball before you open the court.",
    whyItWorks:
      "Speed-based baseliners punish wide, slow exchanges. Middle depth reduces their best running patterns and sets up safer attack balls.",
    tags: ["depth", "middle_target"],
    constraints: { format: "singles" },
    sourceId: "winning-ugly-gilbert",
  }),

  // Brain Game Tennis (Craig O'Shannessy) — data-driven patterns
  tactic({
    id: "bgt-win-the-first-four-shots",
    opponentType: "all_court_player",
    situation: "general",
    title: "Plan the first four shots before the point starts",
    recommendation:
      "Decide your serve/return target plus the next two shots (Serve+1 and Serve+2). Most points end early—having a two-shot follow-up plan beats improvising after the serve.",
    whyItWorks:
      "O’Shannessy’s match data shows rally length is short at all levels; points are disproportionately decided in the opening strike. Pre-planned patterns raise your first-strike win rate.",
    tags: ["first_strike", "patterns", "serve_plus_one"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),
  tactic({
    id: "bgt-extract-forehand-errors-early",
    opponentType: "aggressive_baseliner",
    situation: "baseline_rally",
    title: "Pressure the forehand early in 0–4 shot rallies",
    recommendation:
      "In the first two exchanges, aim to rush or stretch their forehand (depth, body, or angle) rather than defaulting only to the backhand. Many players defend backhands well but leak errors when the forehand swing is hurried.",
    whyItWorks:
      "ATP/WTA tagging shows a large share of points are won by forehand errors in the 0–4 shot range—often on the return, Serve+1, or Return+1.",
    tags: ["first_strike", "patterns", "0_4_shots"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),
  tactic({
    id: "bgt-ba-return-combo",
    opponentType: "serve_and_volleyer",
    situation: "return",
    title: "Try the B→A return pattern (middle, then open court)",
    recommendation:
      "Return deep to the middle (position B) to limit their Serve+1 angle, then attack to the open side (position A) on the next ball—especially if their forehand is bigger but less stable right after the serve.",
    whyItWorks:
      "Splitting the court into four zones makes targets explicit. Middle returns shrink passing lanes; the second ball punishes a weak first volley or floating Serve+1.",
    tags: ["return", "abcd_targets", "two_shot_pattern"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),
  tactic({
    id: "bgt-return-approach",
    opponentType: "serve_and_volleyer",
    situation: "return",
    title: "Mix in the return-and-approach on second serves",
    recommendation:
      "On predictable second serves, block or chip return down the middle with a short swing, then follow it in. Use active feet and redirect the serve’s pace rather than swinging big.",
    whyItWorks:
      "Approaching off the return steals time and flips roles before they can establish net dominance—especially effective when their second serve sits up.",
    tags: ["return", "approach", "pressure"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),
  tactic({
    id: "bgt-30-30-serve-plus-one-forehand",
    opponentType: "all_court_player",
    situation: "serve",
    title: "At 30–30, prioritize first serve + forehand to the middle",
    recommendation:
      "Play percentage tennis: body or safe first serve, then run around to a forehand if needed and drive deep through the middle to their backhand. Avoid corner-hunting unless you own that serve.",
    whyItWorks:
      "Score-line data favours starting the point with a made first serve and a forehand on the plus-one ball. Middle targets win the court-position battle before you hunt winners.",
    tags: ["pressure_points", "serve_plus_one", "percentages"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),
  tactic({
    id: "bgt-defence-to-neutral",
    opponentType: "counterpuncher",
    situation: "passing_defense",
    title: "When defending, change height, spin, and speed to reset",
    recommendation:
      "If you are pinned behind the baseline, vary trajectory (higher loop or slice) and depth before you go for winners. The goal is to climb back to neutral, not to end the point from defense.",
    whyItWorks:
      "Elite defenders win ~30–38% of points from defensive positions by using variety—not power. Different speeds and spins buy time to recover court position.",
    tags: ["defense", "neutralize", "variety"],
    constraints: { format: "singles" },
    sourceId: "brain-game-tennis",
  }),

  // Essential Tennis (Ian Westermann)
  tactic({
    id: "et-baseline-weapon-vs-pusher",
    opponentType: "moonballer_retriever",
    situation: "baseline_rally",
    title: "Build a baseline weapon instead of “out-pushing”",
    recommendation:
      "Improve reliable pace with core rotation and a longer, relaxed swing path plus topspin margin. Pressure them from the baseline first; only approach off clear advantages—not average balls.",
    whyItWorks:
      "Westermann stresses that trying to beat pushers by playing their game keeps you in their comfort zone. Consistent, heavier baseline balls force weaker replies you can attack or follow in on.",
    tags: ["technique", "topspin", "baseline_pressure"],
    constraints: { format: "singles" },
    sourceId: "essential-tennis",
  }),
  tactic({
    id: "et-large-targets",
    opponentType: "all_court_player",
    situation: "baseline_rally",
    title: "Aim 3–5 feet inside the lines on attackable balls",
    recommendation:
      "When they are out of position, pick a large target well inside the sideline—never the line itself. Account for their recovery: if they are scrambling, you may not need a perfect angle.",
    whyItWorks:
      "Recreational errors often come from targeting too small an area. Pros still use big margins; club players win more by reducing unforced errors than by painting lines.",
    tags: ["targets", "percentage_tennis", "unforced_errors"],
    constraints: { format: "singles" },
    sourceId: "essential-tennis",
  }),
  tactic({
    id: "et-high-junk-ball-contact",
    opponentType: "moonballer_retriever",
    situation: "baseline_rally",
    title: "On high junk balls, lift with the same grip—close the face if needed",
    recommendation:
      "Use your normal forehand/backhand grip at shoulder height or above. Generate lift with your legs and swing path; if you miss long, close the racket face slightly without changing grips.",
    whyItWorks:
      "Junk-ball players win when you change grips or swing wildly. A consistent contact routine on high balls keeps you in the rally and denies them free errors.",
    tags: ["contact_height", "junk_ball", "consistency"],
    constraints: { format: "singles" },
    sourceId: "essential-tennis",
  }),
  tactic({
    id: "et-short-ball-options",
    opponentType: "moonballer_retriever",
    situation: "approach_net",
    title: "On short balls: deep line slice, bring them in, or attack—pick one",
    recommendation:
      "Against baseliners who hate the net, a deep slice down the line or a purposeful short ball to pull them forward can be safer than charging on mediocre approaches. Save net rushes for true sitters.",
    whyItWorks:
      "Essential Tennis notes limited approach chances vs steady opponents; forcing them forward exploits weak overheads and breaks their baseline rhythm.",
    tags: ["approach", "slice", "tactics"],
    constraints: { format: "singles" },
    sourceId: "essential-tennis",
  }),

  // Fuzzy Yellow Balls — opponent-specific plays
  tactic({
    id: "fyb-play-to-strengths-avoid-errors",
    opponentType: "all_court_player",
    situation: "general",
    title: "Run plays that match your strengths and their weaknesses",
    recommendation:
      "Before the match, name one pattern you trust (e.g., deep crosscourt → change direction) and one mistake to avoid. Execute the same play repeatedly until they adjust.",
    whyItWorks:
      "The Singles Playbook framework is built on repeatable “plays” rather than shot-by-shot improvisation—reducing unforced errors while stressing what you do best.",
    tags: ["game_plan", "patterns", "club_tennis"],
    constraints: { format: "singles" },
    sourceId: "fuzzy-yellow-balls",
  }),
  tactic({
    id: "fyb-home-base-vs-baseliner",
    opponentType: "aggressive_baseliner",
    situation: "baseline_rally",
    title: "Use a “home base” rally pattern before you attack",
    recommendation:
      "Start with a safe deep crosscourt pattern (your home base) and high margins until you get a shorter or slower ball. Only then change direction or step in—don’t trade winners from the first ball.",
    whyItWorks:
      "FYB’s “Home Base” play vs aggressive baseliners is designed to survive their pace and wait for a ball you can attack, instead of engaging in early firefights you’re likely to lose.",
    tags: ["home_base", "patience", "crosscourt"],
    constraints: { format: "singles" },
    sourceId: "fuzzy-yellow-balls",
  }),
  tactic({
    id: "fyb-identify-opponent-type",
    opponentType: "all_court_player",
    situation: "general",
    title: "Label their style in the warm-up (basher, pusher, net rusher, etc.)",
    recommendation:
      "In the hit-up, note where they stand, how they serve, and whether they prefer pace or junk. Pick the playbook category that fits and commit to two patterns for the first set.",
    whyItWorks:
      "FYB organizes tactics by opponent archetype (aggressive baseliner, counterpuncher, serve-and-volleyer, all-court, etc.). Early labeling speeds up shot selection under pressure.",
    tags: ["scouting", "archetypes", "warmup"],
    constraints: { format: "singles" },
    sourceId: "fuzzy-yellow-balls",
  }),

  // Mouratoglou Coaching Corner
  tactic({
    id: "mo-exploit-identified-weakness",
    opponentType: "all_court_player",
    situation: "baseline_rally",
    title: "Direct traffic to the weakness you scouted",
    recommendation:
      "Once you spot an unreliable wing, poor movement, or shaky long rallies, funnel balls there with depth and margin. Combine direction changes only after you have them stretched.",
    whyItWorks:
      "Mouratoglou emphasizes reading the opponent first, then steering the rally to the weak link—forcing them out of comfort without needing superior power.",
    tags: ["play_to_weakness", "scouting", "depth"],
    constraints: { format: "singles" },
    sourceId: "mouratoglou-coaching-corner",
  }),
  tactic({
    id: "mo-patience-vs-rower",
    opponentType: "moonballer_retriever",
    situation: "general",
    title: "Vs defensive “rowers,” build the point—don’t force early winners",
    recommendation:
      "Stay patient: vary height and spin, mix slice and occasional drop shots, and attack in phases after deep balls push them back. Finish when you have space, not on the first neutral ball.",
    whyItWorks:
      "Mouratoglou warns that rushing points plays into retrievers’ strength (long exchanges). Phased attacks break rhythm and create real finishing chances.",
    tags: ["patience", "variety", "phased_attack"],
    constraints: { format: "singles" },
    sourceId: "mouratoglou-coaching-corner",
  }),
  tactic({
    id: "mo-disrupt-baseline-striker",
    opponentType: "aggressive_baseliner",
    situation: "baseline_rally",
    title: "Break a baseline striker’s rhythm with depth and variation",
    recommendation:
      "Keep balls deep to deny them easy attack balls. Alternate pace and height (topspin vs slice) so they cannot settle into one exchange speed, then step in on the short ball.",
    whyItWorks:
      "Baseline attackers win when pace and pattern stay predictable. Depth limits their initiative; rhythm changes force timing errors.",
    tags: ["depth", "variety", "rhythm"],
    constraints: { format: "singles" },
    sourceId: "mouratoglou-coaching-corner",
  }),
  tactic({
    id: "mo-backcourt-rhythm-change",
    opponentType: "counterpuncher",
    situation: "baseline_rally",
    title: "Alternate fast and slow balls from the baseline",
    recommendation:
      "Use topspin depth to pin them back, then surprise with a slower slice or higher loop before you accelerate again. Look for the short ball only after you have moved them.",
    whyItWorks:
      "Mouratoglou’s back-court tactics stress consistency plus intentional rhythm breaks—counterpunchers thrive when tempo never changes.",
    tags: ["slice", "topspin", "rhythm"],
    constraints: { format: "singles" },
    sourceId: "mouratoglou-coaching-corner",
  }),
  tactic({
    id: "mo-net-on-short-ball",
    opponentType: "aggressive_baseliner",
    situation: "approach_net",
    title: "Approach the net when depth pulls them off the court",
    recommendation:
      "After a deep ball forces a defensive reply or pulls them wide, close to the net to cut off time. Avoid random net rushes without a preceding advantage ball.",
    whyItWorks:
      "Mouratoglou ties net play to tactical patience: finishing at the net works when you have already won the court-position battle from the baseline.",
    tags: ["approach", "court_position", "finish"],
    constraints: { format: "singles" },
    sourceId: "mouratoglou-coaching-corner",
  }),

  // Amateur Tactical Survival Manual (5 club-level styles)
  tactic({
    id: "atm-ball-passer-float-and-finish",
    opponentType: "moonballer_retriever",
    situation: "approach_net",
    title: "Vs the ball-passer: floaters, drop shots, then finish at net",
    recommendation:
      "Do not try to overpower them from the baseline. Use soft floaters or drop shots to pull them forward, then approach and put away the weak reply.",
    whyItWorks:
      "Ball-passers thrive in slow, central rallies. Changing depth and direction—and taking time away at the net—breaks the passive pattern that drains your patience.",
    tags: ["pusher", "drop_shot", "approach", "patience"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
  tactic({
    id: "atm-lobber-positional-cover",
    opponentType: "moonballer_retriever",
    situation: "approach_net",
    title: "Vs the lobber: plan the approach and cover the lob",
    recommendation:
      "Before you come in, decide where the lob will go. Split-step early and stand roughly 2 meters farther back than usual so you can retreat for the overhead instead of getting surprised.",
    whyItWorks:
      "Lobbers reset pressure with height. Positional anticipation turns their best escape into a ball you can attack instead of a free point.",
    tags: ["lob", "court_position", "approach"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
  tactic({
    id: "atm-lefty-attack-backhand",
    opponentType: "all_court_player",
    situation: "baseline_rally",
    title: "Vs the lefty: anticipate the forehand-to-your-backhand, then attack theirs",
    recommendation:
      "Expect their forehand to jump to your backhand side. Prepare early, then funnel traffic to their backhand—the wing that is usually less developed for lefties.",
    whyItWorks:
      "Lefties invert your visual references and spin reads, which breaks timing. A clear target (their backhand) and early preparation reduce automatic errors.",
    tags: ["lefty", "play_to_weakness", "anticipation"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
  tactic({
    id: "atm-slice-architect-lift-high",
    opponentType: "counterpuncher",
    situation: "baseline_rally",
    title: "Vs the slice architect: stay low, lift with topspin, target the weak shoulder",
    recommendation:
      "Bend your knees and use topspin to lift skidding slice balls off the court. When you have space, play higher balls to their weaker shoulder instead of forcing flat drives into the net.",
    whyItWorks:
      "Serial slicers win by keeping the ball low and slow, which creates net errors and anxiety. Height and spin restore a comfortable contact point and take away their rhythm.",
    tags: ["slice", "topspin", "contact_height"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
  tactic({
    id: "atm-basher-rhythmic-anesthesia",
    opponentType: "aggressive_baseliner",
    situation: "baseline_rally",
    title: "Vs the basher: rhythmic anesthesia—high, slow, deep middle",
    recommendation:
      "Do not trade early firefights. Loop high with spin, slow the tempo, and hit deep through the middle until they give you a neutral or short ball.",
    whyItWorks:
      "Bashers feed on fast exchanges and early intimidation. Removing pace and angle options forces them to generate their own winners from uncomfortable positions.",
    tags: ["rhythm", "depth", "middle_target", "spin"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
  tactic({
    id: "atm-pattern-behind-patterns",
    opponentType: "all_court_player",
    situation: "general",
    title: "Impose structural discomfort—not prettier shots",
    recommendation:
      "Before the match, label their pace: fast (take away speed), slow (take away time), or low/skidding (force them to hit up). Pick the counter-protocol and commit for a full set.",
    whyItWorks:
      "Amateur matches repeat the same five styles. Matching your plan to their structural weakness beats trying to out-hit them on their terms.",
    tags: ["game_plan", "club_tennis", "style_counter"],
    constraints: { format: "singles" },
    sourceId: "amateur-tactical-survival-manual",
  }),
] as const;

