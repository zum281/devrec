import { describe, expect, test } from "vitest";
import { formatDate } from "../format-date";

describe("formatDate", () => {
  test("should format date with default locale", () => {
    const dateString = "2024-01-15T10:30:00.000Z";
    const result = formatDate(dateString, "en-US");

    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  test("should include time in formatted output", () => {
    const dateString = "2024-01-15T14:30:00.000Z";
    const result = formatDate(dateString, "en-US");

    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  test("should handle different date formats consistently", () => {
    const dateString1 = "2024-12-25T12:00:00.000Z";
    const dateString2 = "2024-12-25T14:30:00.000Z";

    const result1 = formatDate(dateString1, "en-US");
    const result2 = formatDate(dateString2, "en-US");

    expect(result1).toContain("Dec");
    expect(result1).toContain("2024");
    expect(result2).toContain("Dec");
    expect(result2).toContain("2024");
  });
});

describe("locale formatting", () => {
  const testDate = "2024-03-15T14:30:00.000Z";

  test("formats date in French (fr-FR)", () => {
    const result = formatDate(testDate, "fr-FR");
    expect(result).toContain("15");
    expect(result).toContain("mars");
    expect(result).toContain("2024");
  });

  test("formats date in German (de-DE)", () => {
    const result = formatDate(testDate, "de-DE");
    expect(result).toContain("15");
    expect(result).toContain("März");
    expect(result).toContain("2024");
  });

  test("formats date in Japanese (ja-JP)", () => {
    const result = formatDate(testDate, "ja-JP");
    expect(result).toContain("15");
    expect(result).toContain("3");
    expect(result).toContain("2024");
  });

  test("formats date in Spanish (es-ES)", () => {
    const result = formatDate(testDate, "es-ES");
    expect(result).toContain("15");
    expect(result).toContain("mar");
    expect(result).toContain("2024");
  });

  test("formats date in Italian (it-IT)", () => {
    const result = formatDate(testDate, "it-IT");
    expect(result).toContain("15");
    expect(result).toContain("mar");
    expect(result).toContain("2024");
  });

  test("formats date in Portuguese (pt-BR)", () => {
    const result = formatDate(testDate, "pt-BR");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});

describe("invalid date handling", () => {
  test("handles invalid ISO string gracefully", () => {
    expect(() => formatDate("invalid-date", "en-US")).not.toThrow();
  });

  test("handles empty string", () => {
    expect(() => formatDate("", "en-US")).not.toThrow();
  });

  test("handles very old dates (pre-1970)", () => {
    const oldDate = "1950-01-01T00:00:00.000Z";
    const result = formatDate(oldDate, "en-US");
    expect(result).toContain("1950");
  });

  test("handles future dates", () => {
    const futureDate = "2099-12-31T12:00:00.000Z";
    const result = formatDate(futureDate, "en-US");
    expect(result).toContain("2099");
  });
});

describe("timezone handling", () => {
  test("handles Z timezone suffix", () => {
    const dateZ = "2024-03-15T10:30:00.000Z";
    const result = formatDate(dateZ, "en-US");
    expect(result).toBeTruthy();
  });

  test("handles positive timezone offset", () => {
    const datePlus = "2024-03-15T10:30:00.000+05:00";
    const result = formatDate(datePlus, "en-US");
    expect(result).toBeTruthy();
  });

  test("handles negative timezone offset", () => {
    const dateMinus = "2024-03-15T10:30:00.000-08:00";
    const result = formatDate(dateMinus, "en-US");
    expect(result).toBeTruthy();
  });
});

describe("date boundary conditions", () => {
  test("handles leap year date", () => {
    const leapDate = "2024-02-29T12:00:00.000Z";
    const result = formatDate(leapDate, "en-US");
    expect(result).toContain("29");
    expect(result).toContain("Feb");
  });

  test("handles year boundary (Dec 31 -> Jan 1)", () => {
    const endOfYear = "2024-12-31T12:00:00.000Z";
    const result = formatDate(endOfYear, "en-US");
    expect(result).toContain("31");
    expect(result).toContain("Dec");
  });

  test("handles month boundary", () => {
    const monthEnd = "2024-01-31T12:00:00.000Z";
    const result = formatDate(monthEnd, "en-US");
    expect(result).toContain("31");
    expect(result).toContain("Jan");
  });

  test("handles midnight (00:00)", () => {
    const midnight = "2024-03-15T00:00:00.000Z";
    const result = formatDate(midnight, "en-US");
    expect(result).toBeTruthy();
  });

  test("handles noon (12:00)", () => {
    const noon = "2024-03-15T12:00:00.000Z";
    const result = formatDate(noon, "en-US");
    expect(result).toBeTruthy();
  });
});
