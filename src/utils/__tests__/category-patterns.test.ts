import { describe, expect, test } from "vitest";
import {
  categorizeCommit,
  extractMessageFromJira,
  isMergeCommit,
} from "../category-patterns";

describe("extractMessageFromJira", () => {
  test("extracts message with quotes", () => {
    expect(
      extractMessageFromJira('Resolve IT7CHE1-1103 "Feat/ work tracker"'),
    ).toBe("Feat/ work tracker");
  });

  test("extracts message without quotes", () => {
    expect(extractMessageFromJira("Resolve PROJ-123 feat: new feature")).toBe(
      "feat: new feature",
    );
  });

  test("handles case-insensitive Resolve", () => {
    expect(extractMessageFromJira("RESOLVE ABC-456 fix/bug")).toBe("fix/bug");
  });

  test("returns original if not Jira format", () => {
    expect(extractMessageFromJira("feat: something")).toBe("feat: something");
  });
});

describe("categorizeCommit", () => {
  test("categorizes colon separator", () => {
    expect(categorizeCommit("feat: new feature")).toBe("Feature");
    expect(categorizeCommit("fix: bug")).toBe("Bug");
    expect(categorizeCommit("refactor: cleanup")).toBe("Refactor");
  });

  test("categorizes slash separator", () => {
    expect(categorizeCommit("Refactor/work mode trees")).toBe("Refactor");
    expect(categorizeCommit("feat/tracker")).toBe("Feature");
    expect(categorizeCommit("fix/bug")).toBe("Bug");
  });

  test("handles case-insensitive prefixes", () => {
    expect(categorizeCommit("FEAT: feature")).toBe("Feature");
    expect(categorizeCommit("Fix/bug")).toBe("Bug");
    expect(categorizeCommit("REFACTOR: cleanup")).toBe("Refactor");
  });

  test("categorizes Jira commits", () => {
    expect(categorizeCommit('Resolve IT7CHE1-1103 "Feat/ work tracker"')).toBe(
      "Feature",
    );
    expect(categorizeCommit("Resolve ABC-123 fix: bug")).toBe("Bug");
  });

  test("returns Other for unmatched", () => {
    expect(categorizeCommit("random commit message")).toBe("Other");
  });

  test("returns null for merge commits", () => {
    expect(categorizeCommit("Merge branch 'feature/xyz'")).toBeNull();
  });
});

describe("isMergeCommit", () => {
  test("detects merge commits with standard case", () => {
    expect(isMergeCommit("Merge branch 'main'")).toBe(true);
    expect(isMergeCommit("Merge branch 'feature/new-feature'")).toBe(true);
  });

  test("detects merge commits with case variations", () => {
    expect(isMergeCommit("merge branch 'main'")).toBe(true);
    expect(isMergeCommit("MERGE branch 'main'")).toBe(true);
    expect(isMergeCommit("MeRgE branch 'main'")).toBe(true);
  });

  test("detects merge commits with whitespace", () => {
    expect(isMergeCommit("Merge branch 'main'")).toBe(true);
    expect(isMergeCommit("Merge branch main")).toBe(true);
  });

  test("returns false for non-merge messages", () => {
    expect(isMergeCommit("feat: new feature")).toBe(false);
    expect(isMergeCommit("fix: bug fix")).toBe(false);
    expect(isMergeCommit("This merge is good")).toBe(false);
    expect(isMergeCommit("merge: conflict resolved")).toBe(false);
  });
});
