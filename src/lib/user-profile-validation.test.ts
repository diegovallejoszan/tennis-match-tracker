import { describe, expect, it } from "vitest";

import {
  dbColumnsToProfileFormDefaults,
  parseUserProfileForm,
  userProfileFormToDbColumns,
} from "./user-profile-validation";

describe("parseUserProfileForm", () => {
  it("accepts empty optional fields", () => {
    const r = parseUserProfileForm({
      playStyle: "",
      strengths: "",
      weaknesses: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects play style over 100 chars", () => {
    const r = parseUserProfileForm({
      playStyle: "x".repeat(101),
      strengths: "",
      weaknesses: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("userProfileFormToDbColumns", () => {
  it("maps empty strings to null", () => {
    expect(
      userProfileFormToDbColumns({
        playStyle: "",
        strengths: "  ",
        weaknesses: "",
      }),
    ).toEqual({
      profilePlayStyle: null,
      profileStrengths: null,
      profileWeaknesses: null,
    });
  });

  it("preserves non-empty values", () => {
    expect(
      userProfileFormToDbColumns({
        playStyle: "Baseliner",
        strengths: "Serve",
        weaknesses: "Net",
      }),
    ).toEqual({
      profilePlayStyle: "Baseliner",
      profileStrengths: "Serve",
      profileWeaknesses: "Net",
    });
  });
});

describe("dbColumnsToProfileFormDefaults", () => {
  it("maps null to empty strings", () => {
    expect(
      dbColumnsToProfileFormDefaults({
        profilePlayStyle: null,
        profileStrengths: null,
        profileWeaknesses: null,
      }),
    ).toEqual({ playStyle: "", strengths: "", weaknesses: "" });
  });
});
