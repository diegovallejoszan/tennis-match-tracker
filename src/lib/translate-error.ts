/**
 * Maps known English validation / server error strings to next-intl `errors.*` keys.
 * Zod and integrity checks keep English messages for stable tests; UI translates them.
 */

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const ENGLISH_TO_ERROR_KEY: Record<string, string> = {
  "You must be signed in.": "signedIn",
  "Invalid language selection.": "invalidLanguage",
  "Please fix the highlighted fields.": "fixFields",
  "Failed to create player.": "createPlayerFailed",
  "Player not found or you do not have access.": "playerNotFound",
  "One or more selected players are invalid.": "invalidPlayers",
  "Match not found or you do not have access.": "matchNotFound",
  "Date is required": "dateRequired",
  "Invalid time format": "invalidTime",
  "Score must be at most 120 characters": "scoreMax",
  "Notes must be at most 10000 characters": "notesMax",
  "Select a match result": "selectResult",
  "Add at least one score segment": "addSegment",
  "Score is required": "scoreRequired",
  "Partner applies only to doubles": "partnerDoublesOnly",
  "Select at least one opponent": "selectOpponent",
  "Select a partner": "selectPartner",
  "Partner cannot also be an opponent": "partnerNotOpponent",
  "Name is required": "nameRequired",
  "Name must be at most 255 characters": "nameMax",
  "Phone must be at most 30 characters": "phoneMax",
  "Play style must be at most 100 characters": "playStyleMax",
  "Add score segments or a legacy score for completed matches": "missingScore",
  "Generated score exceeds maximum length": "scoreTooLong",
  "Sets are tied — match may be incomplete": "tiedMatch",
  "Result is Win but the structured score favors your opponent": "winVsScore",
  "Result is Loss but the structured score favors you": "lossVsScore",
  "Match is marked non-finished but the score suggests a completed match":
    "looksFinished",
  "Invalid id": "invalidId",
  "Invalid opponent id": "invalidId",
  "Tie break: points cannot be negative": "tbNegative",
  "Tie break cannot end tied": "tbTied",
  "Tie break: must win by 2 points": "tbMargin",
};

export function errorKeyForMessage(message: string): string | null {
  return ENGLISH_TO_ERROR_KEY[message] ?? null;
}

function translateDynamicSegmentMessage(
  message: string,
  t: TranslateFn,
): string | null {
  const tbIncomplete = message.match(
    /^Tie break: winner needs at least (\d+) points$/,
  );
  if (tbIncomplete) {
    return t("tbIncomplete", { min: Number(tbIncomplete[1]) });
  }

  const segment = message.match(/^Segment (\d+): (.+)$/);
  if (!segment) return null;

  const index = Number(segment[1]);
  const rest = segment[2] ?? "";
  const label = t("segmentLabel", { index });

  if (rest === "games cannot be negative") {
    return t("gamesNegative", { label });
  }
  if (rest === "unknown segment type") {
    return t("unknownSegment", { label });
  }

  const tooHigh = rest.match(
    /^score looks too high for a (\d+)-game set$/,
  );
  if (tooHigh) {
    return t("gamesTooHigh", { label, target: Number(tooHigh[1]) });
  }

  const setTied = rest.match(
    /^set cannot end in a tie unless (\d+)-\1 \(add a tie break\)$/,
  );
  if (setTied) {
    return t("setTied", { label, target: Number(setTied[1]) });
  }

  const incomplete = rest.match(/^winner needs at least (\d+) games$/);
  if (incomplete) {
    return t("setIncomplete", { label, target: Number(incomplete[1]) });
  }

  const margin = rest.match(
    /^must win by 2 games at (\d+)-(\d+) or play a tie break at (\d+)-\3$/,
  );
  if (margin) {
    return t("setMargin", {
      label,
      target: Number(margin[1]),
      lose: Number(margin[2]),
    });
  }

  const invalidSeven = rest.match(
    /^invalid (\d+)-(\d+) — use a tie break after (\d+)-\3$/,
  );
  if (invalidSeven) {
    return t("setInvalidSeven", {
      label,
      win: Number(invalidSeven[1]),
      lose: Number(invalidSeven[2]),
      target: Number(invalidSeven[3]),
    });
  }

  return null;
}

export function translateKnownError(
  message: string,
  t: TranslateFn,
): string {
  const key = errorKeyForMessage(message);
  if (key) return t(key);

  const dynamic = translateDynamicSegmentMessage(message, t);
  if (dynamic) return dynamic;

  return message;
}

export function translateKnownErrors(
  messages: string[],
  t: TranslateFn,
): string[] {
  return messages.map((m) => translateKnownError(m, t));
}
