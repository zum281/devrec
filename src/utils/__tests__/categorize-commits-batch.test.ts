import { describe, it, expect, vi } from "vitest";
import type { CommitEntry, CategorizedCommits } from "@/types";
import {
  categorizeCommitsBatch,
  mergeCategorizedCommits,
} from "../categorize-commits-batch";

vi.mock("../category-patterns", () => ({
  categorizeCommit: vi.fn((message: string) => {
    if (message.startsWith("feat:")) return "feature";
    if (message.startsWith("fix:")) return "fix";
    if (message.startsWith("docs:")) return "docs";
    if (message.startsWith("skip:")) return null;
    return "other";
  }),
}));

const createCommit = (message: string, hash = "abc123"): CommitEntry => ({
  hash,
  message,
  date: "2024-01-01",
  repoName: "test-repo",
});

describe("categorize-commits-batch", () => {
  describe("categorizeCommitsBatch", () => {
    it("should categorize commits by their category", () => {
      const commits: Array<CommitEntry> = [
        createCommit("feat: add feature", "a1"),
        createCommit("fix: bug fix", "a2"),
        createCommit("feat: another feature", "a3"),
      ];

      const result = categorizeCommitsBatch(commits);

      expect(result).toEqual({
        feature: [commits[0], commits[2]],
        fix: [commits[1]],
      });
    });

    it("should handle empty commit array", () => {
      const result = categorizeCommitsBatch([]);

      expect(result).toEqual({});
    });

    it("should skip commits with null category", () => {
      const commits: Array<CommitEntry> = [
        createCommit("feat: feature", "a1"),
        createCommit("skip: ignored", "a2"),
        createCommit("fix: bug", "a3"),
      ];

      const result = categorizeCommitsBatch(commits);

      expect(result).toEqual({
        feature: [commits[0]],
        fix: [commits[2]],
      });
      expect(result).not.toHaveProperty("skip");
    });

    it("should handle all commits with null category", () => {
      const commits: Array<CommitEntry> = [
        createCommit("skip: one", "a1"),
        createCommit("skip: two", "a2"),
      ];

      const result = categorizeCommitsBatch(commits);

      expect(result).toEqual({});
    });

    it("should handle commits from multiple repos", () => {
      const commits: Array<CommitEntry> = [
        { ...createCommit("feat: feature"), repoName: "repo1" },
        { ...createCommit("fix: fix"), repoName: "repo2" },
        { ...createCommit("feat: another"), repoName: "repo1" },
      ];

      const result = categorizeCommitsBatch(commits);

      expect(result.feature).toHaveLength(2);
      expect(result.fix).toHaveLength(1);
    });

    it("should preserve commit order within categories", () => {
      const commits: Array<CommitEntry> = [
        createCommit("feat: first", "a1"),
        createCommit("feat: second", "a2"),
        createCommit("feat: third", "a3"),
      ];

      const result = categorizeCommitsBatch(commits);

      expect(result.feature[0].hash).toBe("a1");
      expect(result.feature[1].hash).toBe("a2");
      expect(result.feature[2].hash).toBe("a3");
    });
  });

  describe("mergeCategorizedCommits", () => {
    it("should merge source into target", () => {
      const target: CategorizedCommits = {
        feature: [createCommit("feat: existing", "a1")],
      };
      const source: CategorizedCommits = {
        feature: [createCommit("feat: new", "a2")],
        fix: [createCommit("fix: bug", "a3")],
      };

      mergeCategorizedCommits(target, source);

      expect(target).toEqual({
        feature: [
          createCommit("feat: existing", "a1"),
          createCommit("feat: new", "a2"),
        ],
        fix: [createCommit("fix: bug", "a3")],
      });
    });

    it("should handle empty source", () => {
      const target: CategorizedCommits = {
        feature: [createCommit("feat: test", "a1")],
      };
      const source: CategorizedCommits = {};

      mergeCategorizedCommits(target, source);

      expect(target).toEqual({
        feature: [createCommit("feat: test", "a1")],
      });
    });

    it("should handle empty target", () => {
      const target: CategorizedCommits = {};
      const source: CategorizedCommits = {
        feature: [createCommit("feat: test", "a1")],
        fix: [createCommit("fix: bug", "a2")],
      };

      mergeCategorizedCommits(target, source);

      expect(target).toEqual(source);
    });

    it("should create new categories if not in target", () => {
      const target: CategorizedCommits = {
        feature: [createCommit("feat: test", "a1")],
      };
      const source: CategorizedCommits = {
        fix: [createCommit("fix: bug", "a2")],
        docs: [createCommit("docs: update", "a3")],
      };

      mergeCategorizedCommits(target, source);

      expect(target).toHaveProperty("feature");
      expect(target).toHaveProperty("fix");
      expect(target).toHaveProperty("docs");
    });

    it("should append to existing categories", () => {
      const target: CategorizedCommits = {
        feature: [createCommit("feat: one", "a1"), createCommit("feat: two", "a2")],
      };
      const source: CategorizedCommits = {
        feature: [createCommit("feat: three", "a3")],
      };

      mergeCategorizedCommits(target, source);

      expect(target.feature).toHaveLength(3);
      expect(target.feature[2].hash).toBe("a3");
    });

    it("should not mutate source", () => {
      const target: CategorizedCommits = {
        feature: [createCommit("feat: test", "a1")],
      };
      const source: CategorizedCommits = {
        feature: [createCommit("feat: new", "a2")],
      };
      const sourceCopy = structuredClone(source);

      mergeCategorizedCommits(target, source);

      expect(source).toEqual(sourceCopy);
    });
  });
});
