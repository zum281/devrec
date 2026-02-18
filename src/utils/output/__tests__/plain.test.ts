import chalk from "chalk";
import { describe, expect, test } from "vitest";
import type { CategorizedCommits, TieredCommits, TieredStats } from "@/types";
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

    const ESC = String.fromCodePoint(27);
    expect(result).toContain(`${ESC}[`);
    expect(result).toContain(`${ESC}[1m`);
    expect(result).toContain(`${ESC}[34m`);
    expect(result.includes(`${ESC}[39m`) || result.includes(`${ESC}[22m`)).toBe(
      true,
    );
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

    const ESC = String.fromCodePoint(27);
    expect(result).toContain(`${ESC}[`);

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

    const ESC = String.fromCodePoint(27);
    expect(result).not.toContain(`${ESC}[`);

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
  const createTiered = (overrides?: Partial<TieredCommits>): TieredCommits => ({
    keyContributions: { merged: {}, unmerged: {} },
    otherWork: { merged: {}, unmerged: {} },
    ...overrides,
  });

  const createStats = (overrides?: Partial<TieredStats>): TieredStats => ({
    totalCommits: 0,
    mergedCommits: 0,
    unmergedCommits: 0,
    repos: new Set<string>(),
    keyContributionCount: 0,
    ...overrides,
  });

  test("shows Key Contributions and Other Work when both tiers have commits", () => {
    const tiered = createTiered({
      keyContributions: {
        merged: {
          Feature: [
            {
              hash: "abc123",
              message: "feat: security patch",
              date: "2024-03-15T10:00:00Z",
              repoName: "repo1",
            },
          ],
        },
        unmerged: {},
      },
      otherWork: {
        merged: {
          Chore: [
            {
              hash: "def456",
              message: "chore: update deps",
              date: "2024-03-16T10:00:00Z",
              repoName: "repo1",
            },
          ],
        },
        unmerged: {},
      },
    });
    const stats = createStats({
      totalCommits: 2,
      mergedCommits: 2,
      repos: new Set(["repo1"]),
      keyContributionCount: 1,
    });

    const output = generatePlainOutputWithBranches(tiered, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("Key Contributions:");
    expect(output).toContain("feat: security patch");
    expect(output).toContain("Other Work:");
    expect(output).toContain("chore: update deps");
  });

  test("skips tier headers when only other work exists", () => {
    const tiered = createTiered({
      otherWork: {
        merged: {
          Feature: [
            {
              hash: "abc123",
              message: "feat: feature",
              date: "2024-03-15T10:00:00Z",
              repoName: "repo1",
            },
          ],
        },
        unmerged: {},
      },
    });
    const stats = createStats({
      totalCommits: 1,
      mergedCommits: 1,
      repos: new Set(["repo1"]),
    });

    const output = generatePlainOutputWithBranches(tiered, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).not.toContain("Key Contributions:");
    expect(output).not.toContain("Other Work:");
    expect(output).toContain("feat: feature");
  });

  test("shows summary with key contribution count", () => {
    const tiered = createTiered();
    const stats = createStats({
      totalCommits: 5,
      mergedCommits: 3,
      unmergedCommits: 2,
      repos: new Set(["repo1", "repo2"]),
      keyContributionCount: 2,
    });

    const output = generatePlainOutputWithBranches(tiered, stats, {
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
    expect(output).toContain("Key Contributions: 2");
    expect(output).toContain("Repositories: repo1, repo2");
  });

  test("omits key contribution count from summary when zero", () => {
    const tiered = createTiered();
    const stats = createStats({ totalCommits: 1, repos: new Set(["repo1"]) });

    const output = generatePlainOutputWithBranches(tiered, stats, {
      format: "plain",
      color: "never",
      showSummary: true,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).not.toContain("Key Contributions:");
  });

  test("shows branch for unmerged and checkmark for merged", () => {
    const tiered = createTiered({
      otherWork: {
        merged: {
          Feature: [
            {
              hash: "abc123",
              message: "feat: merged",
              date: "2024-03-15T10:00:00Z",
              repoName: "repo1",
            },
          ],
        },
        unmerged: {
          Feature: [
            {
              hash: "def456",
              message: "feat: unmerged",
              date: "2024-03-16T10:00:00Z",
              repoName: "repo1",
              branch: "feat/test",
            },
          ],
        },
      },
    });
    const stats = createStats({
      totalCommits: 2,
      mergedCommits: 1,
      unmergedCommits: 1,
      repos: new Set(["repo1"]),
    });

    const output = generatePlainOutputWithBranches(tiered, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "category",
      locale: "en-US",
    });

    expect(output).toContain("\u2713");
    expect(output).toContain("[feat/test]");
  });

  test("groups by repo when specified", () => {
    const tiered = createTiered({
      otherWork: {
        merged: {
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
        },
        unmerged: {},
      },
    });
    const stats = createStats({
      totalCommits: 2,
      mergedCommits: 2,
      repos: new Set(["repo1", "repo2"]),
    });

    const output = generatePlainOutputWithBranches(tiered, stats, {
      format: "plain",
      color: "never",
      showSummary: false,
      groupBy: "repo",
      locale: "en-US",
    });

    expect(output).toContain("repo1:");
    expect(output).toContain("repo2:");
  });
});
