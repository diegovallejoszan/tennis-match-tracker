import { describe, expect, it } from "vitest";
import { buildHelloResponse, helloResponseSchema } from "./hello";

describe("buildHelloResponse", () => {
  it("returns a schema-valid payload", () => {
    const fixedDate = new Date("2026-01-15T12:00:00.000Z");
    const payload = buildHelloResponse(fixedDate);

    expect(payload.message).toBe("Hello from Tennis Match Tracker");
    expect(payload.timestamp).toBe("2026-01-15T12:00:00.000Z");
    expect(() => helloResponseSchema.parse(payload)).not.toThrow();
  });
});
