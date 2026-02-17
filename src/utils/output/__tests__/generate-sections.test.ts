import { describe, expect, it, vi } from "vitest";
import type { CategorizedCommits, CommitEntry } from "@/types";
import type { SectionFormatter } from "../generate-sections";
import {
  generateCategoryFirstSections,
  generateRepoFirstSections,
} from "../generate-sections";

const createMockCommit = (
  hash: string,
  message: string,
  repoName: string,
): CommitEntry => ({
  hash,
  message,
  date: "2024-01-15",
  repoName,
});

const createMockFormatter = (): SectionFormatter => ({
  level1Header: vi.fn((name: string) => `L1:${name}\n`),
  level2Header: vi.fn((name: string) => `L2:${name}\n`),
  commitLine: vi.fn((commit: CommitEntry) => `  - ${commit.message}\n`),
  sectionSeparator: vi.fn(() => "---\n"),
});

describe("generateCategoryFirstSections", () => {
  it("generates output with category → repo → commit order", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Add feature A", "repo1"),
        createMockCommit("def456", "Add feature B", "repo2"),
      ],
      fix: [createMockCommit("ghi789", "Fix bug", "repo1")],
    };

    const formatter = createMockFormatter();
    const result = generateCategoryFirstSections(categorized, formatter);

    expect(result).toBe(
      "L1:feature\n" +
        "L2:repo1\n" +
        "  - Add feature A\n" +
        "L2:repo2\n" +
        "  - Add feature B\n" +
        "---\n" +
        "L1:fix\n" +
        "L2:repo1\n" +
        "  - Fix bug\n" +
        "---\n",
    );
  });

  it("calls formatter callbacks in correct order", () => {
    const categorized: CategorizedCommits = {
      feature: [createMockCommit("abc123", "Add feature", "repo1")],
    };

    const formatter = createMockFormatter();
    generateCategoryFirstSections(categorized, formatter);

    expect(formatter.level1Header).toHaveBeenCalledWith("feature");
    expect(formatter.level2Header).toHaveBeenCalledWith("repo1");
    expect(formatter.commitLine).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Add feature" }),
    );
    expect(formatter.sectionSeparator).toHaveBeenCalled();
  });

  it("handles empty categorized commits", () => {
    const categorized: CategorizedCommits = {};
    const formatter = createMockFormatter();

    const result = generateCategoryFirstSections(categorized, formatter);

    expect(result).toBe("");
    expect(formatter.level1Header).not.toHaveBeenCalled();
  });

  it("handles single category with multiple repos", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Feature 1", "repo1"),
        createMockCommit("def456", "Feature 2", "repo2"),
        createMockCommit("ghi789", "Feature 3", "repo1"),
      ],
    };

    const formatter = createMockFormatter();
    const result = generateCategoryFirstSections(categorized, formatter);

    expect(result).toContain("L1:feature");
    expect(result).toContain("L2:repo1");
    expect(result).toContain("L2:repo2");
    expect(result).toContain("Feature 1");
    expect(result).toContain("Feature 2");
    expect(result).toContain("Feature 3");
  });

  it("groups commits by repo within each category", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Commit 1 repo1", "repo1"),
        createMockCommit("def456", "Commit 2 repo2", "repo2"),
        createMockCommit("ghi789", "Commit 3 repo1", "repo1"),
      ],
    };

    const formatter = createMockFormatter();
    const result = generateCategoryFirstSections(categorized, formatter);

    const repo1Index = result.indexOf("L2:repo1");
    const repo2Index = result.indexOf("L2:repo2");
    const commit1Index = result.indexOf("Commit 1 repo1");
    const commit3Index = result.indexOf("Commit 3 repo1");

    expect(repo1Index).toBeLessThan(commit1Index);
    expect(commit1Index).toBeLessThan(commit3Index);
    expect(commit3Index).toBeLessThan(repo2Index);
  });

  it("includes separator after each category", () => {
    const categorized: CategorizedCommits = {
      feature: [createMockCommit("abc123", "Feature", "repo1")],
      fix: [createMockCommit("def456", "Fix", "repo2")],
    };

    const formatter = createMockFormatter();
    const result = generateCategoryFirstSections(categorized, formatter);

    const separators = result.match(/---\n/g);
    expect(separators).toHaveLength(2);
    expect(formatter.sectionSeparator).toHaveBeenCalledTimes(2);
  });
});

describe("generateRepoFirstSections", () => {
  it("generates output with repo → category → commit order", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Add feature", "repo1"),
        createMockCommit("def456", "Another feature", "repo2"),
      ],
      fix: [createMockCommit("ghi789", "Fix bug", "repo1")],
    };

    const formatter = createMockFormatter();
    const result = generateRepoFirstSections(categorized, formatter);

    expect(result).toBe(
      "L1:repo1\n" +
        "L2:feature\n" +
        "  - Add feature\n" +
        "L2:fix\n" +
        "  - Fix bug\n" +
        "---\n" +
        "L1:repo2\n" +
        "L2:feature\n" +
        "  - Another feature\n" +
        "---\n",
    );
  });

  it("calls formatter callbacks in correct order", () => {
    const categorized: CategorizedCommits = {
      feature: [createMockCommit("abc123", "Add feature", "repo1")],
    };

    const formatter = createMockFormatter();
    generateRepoFirstSections(categorized, formatter);

    expect(formatter.level1Header).toHaveBeenCalledWith("repo1");
    expect(formatter.level2Header).toHaveBeenCalledWith("feature");
    expect(formatter.commitLine).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Add feature" }),
    );
    expect(formatter.sectionSeparator).toHaveBeenCalled();
  });

  it("handles empty categorized commits", () => {
    const categorized: CategorizedCommits = {};
    const formatter = createMockFormatter();

    const result = generateRepoFirstSections(categorized, formatter);

    expect(result).toBe("");
    expect(formatter.level1Header).not.toHaveBeenCalled();
  });

  it("handles single repo with multiple categories", () => {
    const categorized: CategorizedCommits = {
      feature: [createMockCommit("abc123", "Feature", "repo1")],
      fix: [createMockCommit("def456", "Fix", "repo1")],
      docs: [createMockCommit("ghi789", "Docs", "repo1")],
    };

    const formatter = createMockFormatter();
    const result = generateRepoFirstSections(categorized, formatter);

    expect(result).toContain("L1:repo1");
    expect(result).toContain("L2:feature");
    expect(result).toContain("L2:fix");
    expect(result).toContain("L2:docs");
  });

  it("groups categories within each repo", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Feature 1", "repo1"),
        createMockCommit("def456", "Feature 2", "repo2"),
      ],
      fix: [createMockCommit("ghi789", "Fix", "repo1")],
    };

    const formatter = createMockFormatter();
    const result = generateRepoFirstSections(categorized, formatter);

    const repo1Index = result.indexOf("L1:repo1");
    const featureIndex = result.indexOf("L2:feature");
    const fixIndex = result.indexOf("L2:fix");
    const repo2Index = result.indexOf("L1:repo2");

    expect(repo1Index).toBeLessThan(featureIndex);
    expect(featureIndex).toBeLessThan(fixIndex);
    expect(fixIndex).toBeLessThan(repo2Index);
  });

  it("includes separator after each repo", () => {
    const categorized: CategorizedCommits = {
      feature: [
        createMockCommit("abc123", "Feature", "repo1"),
        createMockCommit("def456", "Feature", "repo2"),
      ],
    };

    const formatter = createMockFormatter();
    const result = generateRepoFirstSections(categorized, formatter);

    const separators = result.match(/---\n/g);
    expect(separators).toHaveLength(2);
    expect(formatter.sectionSeparator).toHaveBeenCalledTimes(2);
  });
});

describe("integration with large datasets", () => {
  it("handles 100+ commits across multiple repos and categories", () => {
    const categorized: CategorizedCommits = {
      feature: [],
      fix: [],
      docs: [],
    };

    for (let i = 0; i < 40; i++) {
      categorized.feature.push(
        createMockCommit(
          `hash${i.toString()}`,
          `Feature ${i.toString()}`,
          `repo${(i % 3).toString()}`,
        ),
      );
    }
    for (let i = 0; i < 40; i++) {
      categorized.fix.push(
        createMockCommit(
          `hash${(i + 40).toString()}`,
          `Fix ${i.toString()}`,
          `repo${(i % 3).toString()}`,
        ),
      );
    }
    for (let i = 0; i < 30; i++) {
      categorized.docs.push(
        createMockCommit(
          `hash${(i + 80).toString()}`,
          `Docs ${i.toString()}`,
          `repo${(i % 3).toString()}`,
        ),
      );
    }

    const formatter = createMockFormatter();
    const result = generateCategoryFirstSections(categorized, formatter);

    expect(formatter.commitLine).toHaveBeenCalledTimes(110);
    expect(result).toContain("Feature 0");
    expect(result).toContain("Fix 39");
    expect(result).toContain("Docs 29");
  });
});
