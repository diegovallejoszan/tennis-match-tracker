import { describe, expect, it } from "vitest";

import { translateKnownError } from "./translate-error";

const en: Record<string, string> = {
  signedIn: "You must be signed in.",
  winVsScore: "Result is Win but the structured score favors your opponent",
  segmentLabel: "Segment {index}",
  gamesNegative: "{label}: games cannot be negative",
  tbIncomplete: "Tie break: winner needs at least {min} points",
};

function t(key: string, values?: Record<string, string | number>): string {
  let out = en[key] ?? key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

describe("translateKnownError", () => {
  it("maps static English messages", () => {
    expect(translateKnownError("You must be signed in.", t)).toBe(
      "You must be signed in.",
    );
    expect(
      translateKnownError(
        "Result is Win but the structured score favors your opponent",
        t,
      ),
    ).toBe(en.winVsScore);
  });

  it("maps dynamic segment messages", () => {
    expect(
      translateKnownError("Segment 2: games cannot be negative", t),
    ).toBe("Segment 2: games cannot be negative");
    expect(
      translateKnownError("Tie break: winner needs at least 7 points", t),
    ).toBe("Tie break: winner needs at least 7 points");
  });

  it("passes through unknown messages", () => {
    expect(translateKnownError("Something custom", t)).toBe("Something custom");
  });
});
