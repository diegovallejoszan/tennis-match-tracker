import { describe, expect, it } from "vitest";

import {
  availabilityToJson,
  defaultPlayerFormValues,
  getAvailableDayAbbrevList,
  jsonToAvailability,
  parsePlayerForm,
  summarizeAvailabilityForDisplay,
  toDbPlayerValues,
} from "./players-validation";

const emptyDay = {
  earlyMorning: false,
  morning: false,
  lunch: false,
  afternoon: false,
  evening: false,
};

const validAvailability = {
  mon: { ...emptyDay, earlyMorning: true, evening: true },
  tue: { ...emptyDay },
  wed: { ...emptyDay },
  thu: { ...emptyDay },
  fri: { ...emptyDay },
  sat: { ...emptyDay },
  sun: { ...emptyDay },
};

describe("parsePlayerForm", () => {
  it("rejects empty name", () => {
    const r = parsePlayerForm({
      ...defaultPlayerFormValues(),
      name: "   ",
    });
    expect(r.success).toBe(false);
  });

  it("rejects name longer than 255 characters", () => {
    const r = parsePlayerForm({
      ...defaultPlayerFormValues(),
      name: "x".repeat(256),
    });
    expect(r.success).toBe(false);
  });

  it("rejects phone longer than 30 characters", () => {
    const r = parsePlayerForm({
      ...defaultPlayerFormValues(),
      name: "Ada",
      phone: "1".repeat(31),
    });
    expect(r.success).toBe(false);
  });

  it("accepts a minimal valid payload", () => {
    const r = parsePlayerForm({
      name: "  Alex  ",
      phone: "",
      playStyle: "",
      strengths: "",
      weaknesses: "",
      notes: "",
      availability: validAvailability,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Alex");
      expect(r.data.phone).toBe("");
    }
  });
});

describe("availabilityToJson", () => {
  it("returns null when no slot is selected", () => {
    const allOff = defaultPlayerFormValues().availability;
    expect(availabilityToJson(allOff)).toBeNull();
  });

  it("returns sparse day/slot objects", () => {
    const r = availabilityToJson(validAvailability);
    expect(r).toEqual({
      mon: { earlyMorning: true, evening: true },
    });
  });
});

describe("jsonToAvailability", () => {
  it("defaults all slots to false", () => {
    expect(jsonToAvailability(null)).toEqual(defaultPlayerFormValues().availability);
  });

  it("maps legacy day booleans to all time slots true", () => {
    expect(jsonToAvailability({ sat: true, sun: true })).toMatchObject({
      sat: {
        earlyMorning: true,
        morning: true,
        lunch: true,
        afternoon: true,
        evening: true,
      },
      sun: {
        earlyMorning: true,
        morning: true,
        lunch: true,
        afternoon: true,
        evening: true,
      },
    });
  });

  it("maps nested slot objects", () => {
    const loaded = jsonToAvailability({
      mon: { morning: true, lunch: true },
    });
    expect(loaded.mon).toMatchObject({
      morning: true,
      lunch: true,
      earlyMorning: false,
    });
  });
});

describe("getAvailableDayAbbrevList", () => {
  it("returns weekday abbreviations for nested slots", () => {
    expect(
      getAvailableDayAbbrevList({
        mon: { earlyMorning: true },
        wed: { afternoon: true },
      }),
    ).toEqual(["Mon", "Wed"]);
  });

  it("includes legacy day flags", () => {
    expect(getAvailableDayAbbrevList({ fri: true })).toEqual(["Fri"]);
  });
});

describe("summarizeAvailabilityForDisplay", () => {
  it("formats nested availability", () => {
    expect(
      summarizeAvailabilityForDisplay({
        mon: { earlyMorning: true, evening: true },
      }),
    ).toBe("Mon: Early morning, Evening");
  });

  it("formats legacy day flags", () => {
    expect(summarizeAvailabilityForDisplay({ wed: true })).toBe("Wed (any time)");
  });
});

describe("toDbPlayerValues", () => {
  it("maps form output to row shape", () => {
    const parsed = parsePlayerForm({
      name: "Bo",
      phone: "",
      playStyle: "serve and volley",
      strengths: "Net",
      weaknesses: "",
      notes: "",
      availability: {
        mon: { ...emptyDay, afternoon: true },
        tue: { ...emptyDay },
        wed: { ...emptyDay },
        thu: { ...emptyDay },
        fri: { ...emptyDay },
        sat: { ...emptyDay },
        sun: { ...emptyDay },
      },
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toDbPlayerValues(parsed.data, "user-1")).toEqual({
      userId: "user-1",
      name: "Bo",
      phone: null,
      playStyle: "serve and volley",
      strengths: "Net",
      weaknesses: null,
      notes: null,
      availability: { mon: { afternoon: true } },
    });
  });
});
