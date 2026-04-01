import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const valuesFn = vi.fn().mockResolvedValue(undefined);
  const insertFn = vi.fn(() => ({ values: valuesFn }));
  const returningFn = vi.fn().mockResolvedValue([{ id: "p1" }]);
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn });
  const updateFn = vi.fn().mockReturnValue({ set: setFn });
  return { valuesFn, insertFn, returningFn, whereFn, setFn, updateFn };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    insert: mocks.insertFn,
    update: mocks.updateFn,
  },
  players: {},
}));

import { auth } from "@/lib/auth";
import { createPlayerAction, updatePlayerAction } from "./players";
import { defaultPlayerFormValues } from "@/lib/players-validation";

const validPayload = {
  ...defaultPlayerFormValues(),
  name: "Casey",
  phone: "555",
  availability: {
    ...defaultPlayerFormValues().availability,
    mon: {
      earlyMorning: true,
      morning: false,
      lunch: false,
      afternoon: false,
      evening: false,
    },
  },
};

describe("createPlayerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    mocks.valuesFn.mockResolvedValue(undefined);
  });

  it("returns error when not signed in", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const r = await createPlayerAction(validPayload);
    expect(r).toEqual({ error: "You must be signed in." });
    expect(mocks.insertFn).not.toHaveBeenCalled();
  });

  it("returns error for invalid payload", async () => {
    const r = await createPlayerAction({ name: "" });
    expect(r).toEqual({ error: "Please fix the highlighted fields." });
    expect(mocks.insertFn).not.toHaveBeenCalled();
  });

  it("inserts a row and returns ok for valid payload", async () => {
    const r = await createPlayerAction(validPayload);
    expect(r).toEqual({ ok: true });
    expect(mocks.insertFn).toHaveBeenCalledTimes(1);
    expect(mocks.valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        name: "Casey",
        phone: "555",
        availability: { mon: { earlyMorning: true } },
      }),
    );
  });
});

describe("updatePlayerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    mocks.returningFn.mockResolvedValue([{ id: "p1" }]);
  });

  it("returns ok when a row is updated", async () => {
    const r = await updatePlayerAction("p1", validPayload);
    expect(r).toEqual({ ok: true });
    expect(mocks.updateFn).toHaveBeenCalledTimes(1);
    expect(mocks.setFn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", name: "Casey" }),
    );
  });

  it("returns error when no row matched", async () => {
    mocks.returningFn.mockResolvedValueOnce([]);
    const r = await updatePlayerAction("missing", validPayload);
    expect(r).toEqual({
      error: "Player not found or you do not have access.",
    });
  });
});
