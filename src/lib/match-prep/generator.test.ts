import { describe, expect, it } from "vitest";

import {
  classifyOpponentTypeFromText,
  getMatchPrepTactics,
} from "./generator";

describe("classifyOpponentTypeFromText", () => {
  it("maps Gilbert retriever labels", () => {
    expect(classifyOpponentTypeFromText("human backboard retriever")).toBe(
      "moonballer_retriever",
    );
  });

  it("maps Gilbert speedster labels", () => {
    expect(classifyOpponentTypeFromText("speedster, fast feet")).toBe("counterpuncher");
  });

  it("maps soft hitter labels", () => {
    expect(classifyOpponentTypeFromText("nerf baller, soft hitter")).toBe(
      "moonballer_retriever",
    );
  });

  it("maps Spanish manual style labels", () => {
    expect(classifyOpponentTypeFromText("El Pasabolas")).toBe("moonballer_retriever");
    expect(classifyOpponentTypeFromText("globero")).toBe("moonballer_retriever");
    expect(classifyOpponentTypeFromText("El Pegador")).toBe("aggressive_baseliner");
    expect(classifyOpponentTypeFromText("zurdo")).toBe("all_court_player");
    expect(classifyOpponentTypeFromText("arquitecto del slice")).toBe("counterpuncher");
  });

  it("maps labels from the singles strategy booklets", () => {
    expect(classifyOpponentTypeFromText("runner / pusher")).toBe(
      "moonballer_retriever",
    );
    expect(classifyOpponentTypeFromText("huge forehand")).toBe(
      "aggressive_baseliner",
    );
    expect(classifyOpponentTypeFromText("strong groundstroke player")).toBe(
      "aggressive_baseliner",
    );
  });
});

describe("getMatchPrepTactics", () => {
  it("includes Winning Ugly tactics for retriever archetype", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "moonballer_retriever",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    const ids = tactics.map((t) => t.id);
    expect(ids).toContain("wu-retriever-patience-net");
    expect(ids).toContain("wu-soft-ball-placement");
  });

  it("includes Winning Ugly framework tactics for all-court default", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "all_court_player",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    expect(tactics.some((t) => t.id === "wu-whos-doing-what")).toBe(true);
  });

  it("includes Brain Game Tennis tactics for serve-and-volleyer", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "serve_and_volleyer",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    expect(tactics.some((t) => t.citation.sourceId === "brain-game-tennis")).toBe(true);
  });

  it("includes Mouratoglou tactics for aggressive baseliner", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "aggressive_baseliner",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    expect(tactics.some((t) => t.citation.sourceId === "mouratoglou-coaching-corner")).toBe(
      true,
    );
  });

  it("includes Amateur Tactical Manual tactics for ball-passers", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "moonballer_retriever",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    expect(tactics.some((t) => t.id === "atm-ball-passer-float-and-finish")).toBe(true);
    expect(tactics.some((t) => t.id === "atm-lobber-positional-cover")).toBe(true);
  });

  it("includes Amateur Tactical Manual basher protocol", () => {
    const tactics = getMatchPrepTactics({
      opponentType: "aggressive_baseliner",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    expect(tactics.some((t) => t.id === "atm-basher-rhythmic-anesthesia")).toBe(true);
  });

  it("includes Capestany booklet tactics across opponent styles", () => {
    const aggressive = getMatchPrepTactics({
      opponentType: "aggressive_baseliner",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    const netPlayer = getMatchPrepTactics({
      opponentType: "serve_and_volleyer",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });

    expect(
      aggressive.some(
        (t) => t.citation.sourceId === "on-court-guide-strategy-booklet",
      ),
    ).toBe(true);
    expect(netPlayer.some((t) => t.id === "ocg-serve-volley-return-early-low")).toBe(
      true,
    );
  });

  it("includes GMU singles strategy tactics", () => {
    const allCourt = getMatchPrepTactics({
      opponentType: "all_court_player",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });
    const counterpuncher = getMatchPrepTactics({
      opponentType: "counterpuncher",
      format: "singles",
      surface: "unknown",
      playerLevel: "unknown",
    });

    expect(
      allCourt.some((t) => t.citation.sourceId === "gmu-singles-strategy"),
    ).toBe(true);
    expect(
      counterpuncher.some((t) => t.id === "gmu-counterpuncher-change-dimensions"),
    ).toBe(true);
  });
});
