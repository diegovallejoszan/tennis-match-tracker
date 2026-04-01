import { z } from "zod";

export const WEEKDAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** Time-of-day windows (per weekday). */
export const TIME_SLOTS = [
  "earlyMorning",
  "morning",
  "lunch",
  "afternoon",
  "evening",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export const timeSlotLabels: Record<TimeSlot, string> = {
  earlyMorning: "Early morning",
  morning: "Morning",
  lunch: "Lunch time",
  afternoon: "Afternoon",
  evening: "Evening",
};

const weekdayLabels: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const dayAvailabilitySchema = z.object({
  earlyMorning: z.boolean(),
  morning: z.boolean(),
  lunch: z.boolean(),
  afternoon: z.boolean(),
  evening: z.boolean(),
});

export type DayAvailability = z.infer<typeof dayAvailabilitySchema>;

export const availabilityFormSchema = z.object({
  mon: dayAvailabilitySchema,
  tue: dayAvailabilitySchema,
  wed: dayAvailabilitySchema,
  thu: dayAvailabilitySchema,
  fri: dayAvailabilitySchema,
  sat: dayAvailabilitySchema,
  sun: dayAvailabilitySchema,
});

export const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be at most 30 characters"),
  playStyle: z
    .string()
    .trim()
    .max(100, "Play style must be at most 100 characters"),
  strengths: z.string().trim().max(10_000),
  weaknesses: z.string().trim().max(10_000),
  notes: z.string().trim().max(10_000),
  availability: availabilityFormSchema,
});

export type PlayerFormValues = z.infer<typeof playerFormSchema>;

/** Input shape for default values (same as form values). */
export type PlayerFormInput = PlayerFormValues;

function emptyDayAvailability(): DayAvailability {
  return {
    earlyMorning: false,
    morning: false,
    lunch: false,
    afternoon: false,
    evening: false,
  };
}

function allTimeSlotsTrue(): DayAvailability {
  return {
    earlyMorning: true,
    morning: true,
    lunch: true,
    afternoon: true,
    evening: true,
  };
}

export function parsePlayerForm(input: unknown) {
  return playerFormSchema.safeParse(input);
}

function emptyToNull(s: string): string | null {
  return s === "" ? null : s;
}

/** Normalize validated form strings for persistence (empty → null). */
export function normalizePlayerFormValues(
  data: PlayerFormValues,
): Omit<PlayerFormValues, "phone" | "playStyle" | "strengths" | "weaknesses" | "notes"> & {
  phone: string | null;
  playStyle: string | null;
  strengths: string | null;
  weaknesses: string | null;
  notes: string | null;
} {
  return {
    ...data,
    name: data.name.trim(),
    phone: emptyToNull(data.phone),
    playStyle: emptyToNull(data.playStyle),
    strengths: emptyToNull(data.strengths),
    weaknesses: emptyToNull(data.weaknesses),
    notes: emptyToNull(data.notes),
  };
}

/** Sparse JSON: only days/slots that are true. Null if nothing selected. */
export function availabilityToJson(
  a: PlayerFormValues["availability"],
): Record<string, Record<string, boolean>> | null {
  const out: Record<string, Record<string, boolean>> = {};
  for (const d of WEEKDAYS) {
    const slots: Record<string, boolean> = {};
    for (const slot of TIME_SLOTS) {
      if (a[d][slot]) slots[slot] = true;
    }
    if (Object.keys(slots).length > 0) out[d] = slots;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Load from DB. Supports legacy `{ mon: true }` (treated as all time slots that day).
 */
export function jsonToAvailability(
  j: Record<string, unknown> | null | undefined,
): PlayerFormInput["availability"] {
  const base: PlayerFormInput["availability"] = {
    mon: emptyDayAvailability(),
    tue: emptyDayAvailability(),
    wed: emptyDayAvailability(),
    thu: emptyDayAvailability(),
    fri: emptyDayAvailability(),
    sat: emptyDayAvailability(),
    sun: emptyDayAvailability(),
  };
  if (!j) return base;

  for (const d of WEEKDAYS) {
    const v = j[d];
    if (v === true) {
      base[d] = allTimeSlotsTrue();
      continue;
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      for (const slot of TIME_SLOTS) {
        if (o[slot] === true) base[d][slot] = true;
      }
    }
  }
  return base;
}

export function defaultPlayerFormValues(): PlayerFormInput {
  return {
    name: "",
    phone: "",
    playStyle: "",
    strengths: "",
    weaknesses: "",
    notes: "",
    availability: jsonToAvailability(null),
  };
}

export function toDbPlayerValues(data: PlayerFormValues, userId: string) {
  const n = normalizePlayerFormValues(data);
  return {
    userId,
    name: n.name,
    phone: n.phone,
    playStyle: n.playStyle,
    strengths: n.strengths,
    weaknesses: n.weaknesses,
    notes: n.notes,
    availability: availabilityToJson(n.availability),
  };
}

/** Abbreviated weekday labels for days with any availability (legacy + nested slots). */
export function getAvailableDayAbbrevList(
  raw: Record<string, unknown> | null,
): string[] {
  if (!raw || Object.keys(raw).length === 0) return [];

  const out: string[] = [];
  for (const d of WEEKDAYS) {
    const v = raw[d];
    if (v === true) {
      out.push(weekdayLabels[d]);
      continue;
    }
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    if (TIME_SLOTS.some((s) => o[s] === true)) {
      out.push(weekdayLabels[d]);
    }
  }
  return out;
}

/** Short line for player cards (legacy + new JSON shapes). */
export function summarizeAvailabilityForDisplay(
  raw: Record<string, unknown> | null,
): string | null {
  if (!raw || Object.keys(raw).length === 0) return null;

  const parts: string[] = [];
  for (const d of WEEKDAYS) {
    const v = raw[d];
    if (v === true) {
      parts.push(`${weekdayLabels[d]} (any time)`);
      continue;
    }
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    const slots = TIME_SLOTS.filter((s) => o[s] === true);
    if (slots.length === 0) continue;
    parts.push(
      `${weekdayLabels[d]}: ${slots.map((s) => timeSlotLabels[s]).join(", ")}`,
    );
  }
  return parts.length > 0 ? parts.join("; ") : null;
}
