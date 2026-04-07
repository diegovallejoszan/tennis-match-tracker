import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tables = {
    players: {},
    matches: {},
    matchPlayers: {},
  };

  const validPlayersWhere = vi.fn().mockResolvedValue([{ id: "op-1" }]);
  const selectFn = vi.fn(() => ({
    from: vi.fn(() => ({
      where: validPlayersWhere,
    })),
  }));

  const txInsertMatchReturning = vi.fn().mockResolvedValue([{ id: "m-1" }]);
  const txInsertMatchValues = vi
    .fn()
    .mockReturnValue({ returning: txInsertMatchReturning });

  const txInsertPlayersValues = vi.fn().mockResolvedValue(undefined);

  const txInsert = vi.fn((table: unknown) => {
    if (table === tables.matches) {
      return { values: txInsertMatchValues };
    }
    return { values: txInsertPlayersValues };
  });

  const txUpdateReturning = vi.fn().mockResolvedValue([{ id: "m-1" }]);
  const txUpdateWhere = vi.fn().mockReturnValue({ returning: txUpdateReturning });
  const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
  const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

  const txDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const txDelete = vi.fn().mockReturnValue({ where: txDeleteWhere });

  const transactionFn = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      insert: txInsert,
      update: txUpdate,
      delete: txDelete,
    }),
  );

  const dbDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const dbDelete = vi.fn().mockReturnValue({ where: dbDeleteWhere });

  return {
    tables,
    selectFn,
    validPlayersWhere,
    transactionFn,
    txInsert,
    txInsertMatchValues,
    txInsertMatchReturning,
    txInsertPlayersValues,
    txUpdate,
    txUpdateSet,
    txDelete,
    dbDelete,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.selectFn,
    transaction: mocks.transactionFn,
    delete: mocks.dbDelete,
  },
  players: mocks.tables.players,
  matches: mocks.tables.matches,
  matchPlayers: mocks.tables.matchPlayers,
}));

import { auth } from "@/lib/auth";
import {
  createMatchAction,
  deleteMatchAction,
  updateMatchAction,
} from "./matches";
import { defaultMatchFormValues } from "@/lib/matches-validation";

const opponentId = "550e8400-e29b-41d4-a716-446655440000";
const partnerId = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
const otherOpp = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const validPayload = {
  ...defaultMatchFormValues(),
  date: "2026-04-01",
  matchType: "single" as const,
  outcome: "win" as const,
  score: "6-4 6-3",
  notes: "Targeted second serve.",
  opponentIds: [opponentId],
  partnerId: "",
};

describe("createMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    mocks.validPlayersWhere.mockResolvedValue([{ id: opponentId }]);
    mocks.txInsertMatchReturning.mockResolvedValue([{ id: "m-1" }]);
  });

  it("returns error when not signed in", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await createMatchAction(validPayload);
    expect(result).toEqual({ error: "You must be signed in." });
    expect(mocks.transactionFn).not.toHaveBeenCalled();
  });

  it("returns error for invalid payload", async () => {
    const result = await createMatchAction({ date: "" });
    expect(result).toEqual({ error: "Please fix the highlighted fields." });
    expect(mocks.transactionFn).not.toHaveBeenCalled();
  });

  it("returns error for invalid players", async () => {
    mocks.validPlayersWhere.mockResolvedValueOnce([]);
    const result = await createMatchAction(validPayload);
    expect(result).toEqual({ error: "One or more selected players are invalid." });
    expect(mocks.transactionFn).not.toHaveBeenCalled();
  });

  it("creates match and opponent rows", async () => {
    const result = await createMatchAction(validPayload);
    expect(result).toEqual({ ok: true });
    expect(mocks.transactionFn).toHaveBeenCalledTimes(1);
    expect(mocks.txInsertMatchValues).toHaveBeenCalledTimes(1);
    expect(mocks.txInsertPlayersValues).toHaveBeenCalledTimes(1);
  });

  it("creates doubles match with partner and opponents", async () => {
    mocks.validPlayersWhere.mockResolvedValueOnce([
      { id: opponentId },
      { id: otherOpp },
      { id: partnerId },
    ]);
    const result = await createMatchAction({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "doubles",
      outcome: "loss",
      score: "4-6 6-4",
      opponentIds: [opponentId, otherOpp],
      partnerId,
      notes: "",
    });
    expect(result).toEqual({ ok: true });
    expect(mocks.txInsertPlayersValues).toHaveBeenCalledTimes(1);
  });
});

describe("updateMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    mocks.validPlayersWhere.mockResolvedValue([{ id: opponentId }]);
    mocks.txUpdateSet.mockClear();
  });

  it("updates a match and replaces opponents", async () => {
    const result = await updateMatchAction("m-1", validPayload);
    expect(result).toEqual({ ok: true });
    expect(mocks.transactionFn).toHaveBeenCalledTimes(1);
    expect(mocks.txUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.txDelete).toHaveBeenCalledTimes(1);
    expect(mocks.txInsertPlayersValues).toHaveBeenCalledTimes(1);
  });
});

describe("deleteMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("deletes by id for current user", async () => {
    await deleteMatchAction("m-1");
    expect(mocks.dbDelete).toHaveBeenCalledTimes(1);
  });
});
