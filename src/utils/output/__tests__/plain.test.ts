import chalk from "chalk";
import { describe, expect, test } from "vitest";
import type { CategorizedCommits, SummaryStats } from "@/types";
import { generatePlainOutput, generatePlainOutputWithBranches } from "../plain";

describe("generatePlainOutput", () => {
  const mockCommits: CategorizedCommits = {
    Features: [
      {
        hash: "abc123def456",
        message: "feat: new feature",
        date: "2024-03-15T10:00:00Z",
        repoName: "repo1",
      },
      {
        hash: "ghi789jkl012",
        message: "feat: another feature",
        date: "2024-03-16T10:00:00Z",
        repoName: "repo2",
      },
    ],
    Fixes: [
      {
        hash: "mno345pqr678",
        message: "fix: bug fix",
        date: "2024-03-17T10:00:00Z",
        repoName: "repo1",
      },
    ],
  };

  test("generates output with category grouping", () => {
    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).toContain("Features:");
    expect(result).toContain("repo1:");
    expect(result).toContain("repo2:");
    expect(result).toContain("Fixes:");
    expect(result).toContain("[abc123d] feat: new feature");
  });

  test("generates output with repo grouping", () => {
    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "repo",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).toContain("repo1:");
    expect(result).toContain("repo2:");
    expect(result).toContain("Features:");
    expect(result).toContain("Fixes:");
  });

  test("includes summary when showSummary is true", () => {
    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: true,
      color: "never",
    });

    expect(result).toContain("Summary:");
    expect(result).toContain("Total Commits: 3");
    expect(result).toContain("Repositories: repo1, repo2");
  });

  test("omits summary when showSummary is false", () => {
    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).not.toContain("Summary:");
  });

  test("applies ANSI color codes when color mode is always", () => {
    const originalLevel = chalk.level;
    chalk.level = 3;

    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "always",
    });

    // eslint-disable-next-line no-control-regex
    expect(result).toMatch(/\u001B\[/);
    // eslint-disable-next-line no-control-regex
    expect(result).toMatch(/\u001B\[1m/);
    // eslint-disable-next-line no-control-regex
    expect(result).toMatch(/\u001B\[34m/);
    // eslint-disable-next-line no-control-regex
    expect(result).toMatch(/\u001B\[(39|22)m/);
    expect(result).toContain("Features:");
    expect(result).toContain("feat: new feature");

    chalk.level = originalLevel;
  });

  test("does not apply colors when color mode is never", () => {
    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).not.toContain("\u001B[");
  });

  test("applies colors in auto mode when TTY is detected", () => {
    const isTTYBackup = process.stdout.isTTY;
    const originalLevel = chalk.level;
    process.stdout.isTTY = true;
    chalk.level = 3;

    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "auto",
    });

    // eslint-disable-next-line no-control-regex
    expect(result).toMatch(/\u001B\[/);

    process.stdout.isTTY = isTTYBackup;
    chalk.level = originalLevel;
  });

  test("does not apply colors in auto mode when TTY is not detected", () => {
    const isTTYBackup = process.stdout.isTTY;
    process.stdout.isTTY = false;

    const result = generatePlainOutput(mockCommits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "auto",
    });

    // eslint-disable-next-line no-control-regex
    expect(result).not.toMatch(/\u001B\[/);

    process.stdout.isTTY = isTTYBackup;
  });

  test("handles empty commits", () => {
    const result = generatePlainOutput(
      {},
      {
        format: "plain",
        groupBy: "category",
        locale: "en-US",
        showSummary: false,
        color: "never",
      },
    );

    expect(result).toBe("");
  });

  test("handles emoji in plain output", () => {
    const commitsWithEmoji: CategorizedCommits = {
      feature: [
        {
          hash: "abc123",
          message: "feat: add 🚀 rocket feature",
          date: "2024-01-15T10:00:00.000Z",
          repoName: "repo1",
        },
      ],
    };

    const result = generatePlainOutput(commitsWithEmoji, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).toContain("🚀");
  });

  test("handles very long commit messages in plain output", () => {
    const longMessage = "feat: " + "x".repeat(1000);
    const commitsWithLongMessage: CategorizedCommits = {
      feature: [
        {
          hash: "def456",
          message: longMessage,
          date: "2024-01-15T10:00:00.000Z",
          repoName: "repo1",
        },
      ],
    };

    const result = generatePlainOutput(commitsWithLongMessage, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(result).toContain(longMessage);
  });
});

describe("generatePlainOutputWithBranches", () => {
  test("generates output with both merged and unmerged sections", () => {
    const merged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: merged feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };
    const unmerged: CategorizedCommits = {
      Feature: [
        {
          hash: "def456",
          message: "feat: unmerged feature",
          date: "2024-03-16T10:00:00Z",
          repoName: "repo1",
          branch: "feature/test",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 2,
      mergedCommits: 1,
      unmergedCommits: 1,
      repos: new Set(["repo1"]),
    };

    const output = generatePlainOutputWithBranches(merged, unmerged, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("Merged Work:");
    expect(output).toContain("feat: merged feature");
    expect(output).toContain("In Progress (Unmerged):");
    expect(output).toContain("feat: unmerged feature");
    expect(output).toContain("[feature/test]");
  });

  test("shows summary when enabled", () => {
    const stats: SummaryStats = {
      totalCommits: 5,
      mergedCommits: 3,
      unmergedCommits: 2,
      repos: new Set(["repo1", "repo2"]),
    };

    const output = generatePlainOutputWithBranches({}, {}, stats, {
      format: "plain",
      color: "never",
      showSummary: true,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("Summary:");
    expect(output).toContain("Total Commits: 5");
    expect(output).toContain("Merged to Main: 3");
    expect(output).toContain("In Progress: 2");
    expect(output).toContain("Repositories: repo1, repo2");
  });

  test("omits merged section when no merged commits", () => {
    const unmerged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 1,
      mergedCommits: 0,
      unmergedCommits: 1,
      repos: new Set(["repo1"]),
    };

    const output = generatePlainOutputWithBranches({}, unmerged, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).not.toContain("Merged Work:");
    expect(output).toContain("In Progress (Unmerged):");
  });

  test("omits unmerged section when no unmerged commits", () => {
    const merged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 1,
      mergedCommits: 1,
      unmergedCommits: 0,
      repos: new Set(["repo1"]),
    };

    const output = generatePlainOutputWithBranches(merged, {}, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("Merged Work:");
    expect(output).not.toContain("In Progress (Unmerged):");
  });

  test("groups by repo when specified", () => {
    const merged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: repo1 feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
        {
          hash: "def456",
          message: "feat: repo2 feature",
          date: "2024-03-16T10:00:00Z",
          repoName: "repo2",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 2,
      mergedCommits: 2,
      unmergedCommits: 0,
      repos: new Set(["repo1", "repo2"]),
    };

    const output = generatePlainOutputWithBranches(merged, {}, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "repo",
      locale: "en-US",
    });

    expect(output).toContain("repo1:");
    expect(output).toContain("repo2:");
  });

  test("does not show branch names for merged commits", () => {
    const merged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
          branch: "feature/test",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 1,
      mergedCommits: 1,
      unmergedCommits: 0,
      repos: new Set(["repo1"]),
    };

    const output = generatePlainOutputWithBranches(merged, {}, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).not.toContain("[feature/test]");
  });

  test("handles color mode", () => {
    const merged: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };
    const stats: SummaryStats = {
      totalCommits: 1,
      mergedCommits: 1,
      unmergedCommits: 0,
      repos: new Set(["repo1"]),
    };

    const output = generatePlainOutputWithBranches(merged, {}, stats, {
      format: "plain",
      color: "always",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("feat: feature");
  });
});
