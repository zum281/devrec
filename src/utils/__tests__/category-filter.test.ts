import { describe, expect, test } from "vitest";
import { resolveCategoryFilter } from "../category-filter";

describe("resolveCategoryFilter", () => {
  describe("Tier 1: Exact match (case-sensitive)", () => {
    test("matches exact category names", () => {
      expect(resolveCategoryFilter("Feature")).toBe("Feature");
      expect(resolveCategoryFilter("Bug")).toBe("Bug");
      expect(resolveCategoryFilter("Refactor")).toBe("Refactor");
      expect(resolveCategoryFilter("Test")).toBe("Test");
      expect(resolveCategoryFilter("Chore")).toBe("Chore");
      expect(resolveCategoryFilter("Documentation")).toBe("Documentation");
      expect(resolveCategoryFilter("CI")).toBe("CI");
    });
  });

  describe("Tier 2: Case-insensitive exact match", () => {
    test("matches lowercase category names", () => {
      expect(resolveCategoryFilter("feature")).toBe("Feature");
      expect(resolveCategoryFilter("bug")).toBe("Bug");
      expect(resolveCategoryFilter("ci")).toBe("CI");
    });

    test("matches uppercase category names", () => {
      expect(resolveCategoryFilter("FEATURE")).toBe("Feature");
      expect(resolveCategoryFilter("BUG")).toBe("Bug");
    });

    test("matches mixed case category names", () => {
      expect(resolveCategoryFilter("fEaTuRe")).toBe("Feature");
      expect(resolveCategoryFilter("ChOrE")).toBe("Chore");
    });
  });

  describe("Tier 3: Case-insensitive prefix match", () => {
    test("matches partial category names unambiguously", () => {
      expect(resolveCategoryFilter("feat")).toBe("Feature");
      expect(resolveCategoryFilter("fe")).toBe("Feature");
      expect(resolveCategoryFilter("f")).toBe("Feature");
      expect(resolveCategoryFilter("bug")).toBe("Bug");
      expect(resolveCategoryFilter("ref")).toBe("Refactor");
      expect(resolveCategoryFilter("test")).toBe("Test");
      expect(resolveCategoryFilter("doc")).toBe("Documentation");
    });

    test("matches case-insensitive prefixes", () => {
      expect(resolveCategoryFilter("FEAT")).toBe("Feature");
      expect(resolveCategoryFilter("Bug")).toBe("Bug");
      expect(resolveCategoryFilter("REF")).toBe("Refactor");
    });
  });

  describe("Ambiguity detection", () => {
    test("throws error for ambiguous prefix 'c'", () => {
      expect(() => resolveCategoryFilter("c")).toThrow(
        'Ambiguous category filter "c" matches: Chore, CI. Please be more specific.',
      );
    });

    test("disambiguates with more characters", () => {
      expect(resolveCategoryFilter("ch")).toBe("Chore");
      expect(resolveCategoryFilter("ci")).toBe("CI");
    });

    test("provides clear error message with all matches", () => {
      try {
        resolveCategoryFilter("c");
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Chore");
        expect((error as Error).message).toContain("CI");
      }
    });
  });

  describe("Unknown category handling", () => {
    test("throws error for unknown category", () => {
      expect(() => resolveCategoryFilter("unknown")).toThrow(
        'Unknown category filter "unknown"',
      );
    });

    test("lists available categories in error", () => {
      try {
        resolveCategoryFilter("xyz");
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Available categories:");
        expect((error as Error).message).toContain("Feature");
        expect((error as Error).message).toContain("Bug");
      }
    });
  });

  describe("Priority precedence", () => {
    test("exact match takes precedence over prefix match", () => {
      expect(resolveCategoryFilter("Test")).toBe("Test");
    });

    test("case-insensitive exact takes precedence over prefix", () => {
      expect(resolveCategoryFilter("test")).toBe("Test");
    });
  });
});
