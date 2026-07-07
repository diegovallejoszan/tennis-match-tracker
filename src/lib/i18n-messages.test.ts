import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("i18n message catalogs", () => {
  it("es has the same keys as en", () => {
    const enKeys = flattenKeys(en).sort();
    const esKeys = flattenKeys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("includes dashboard sparkline strings in both locales", () => {
    expect(en.dashboard.charts.sparkline.title).toBeTruthy();
    expect(es.dashboard.charts.sparkline.title).toBeTruthy();
    expect(en.nav.dashboard).toBe("Dashboard");
    expect(es.nav.dashboard).toBe("Panel");
  });
});
