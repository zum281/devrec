import { describe, expect, test } from "vitest";
import type { CategorizedCommits } from "@/types";
import { calculateStats } from "../calculate-stats";

describe("calculateStats", () => {
  test("should calculate stats for single category with single repo", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          date: "2024-01-15T10:00:00.000Z",
          message: "Add feature",
          repoName: "repo1",
        },
        {
          hash: "def456",
          date: "2024-01-15T11:00:00.000Z",
          message: "Update feature",
          repoName: "repo1",
        },
      ],
    };

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(2);
    expect(result.repos.size).toBe(1);
    expect(result.repos.has("repo1")).toBe(true);
  });

  test("should calculate stats for multiple categories", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          date: "2024-01-15T10:00:00.000Z",
          message: "Add feature",
          repoName: "repo1",
        },
      ],
      Bug: [
        {
          hash: "def456",
          date: "2024-01-15T11:00:00.000Z",
          message: "Fix bug",
          repoName: "repo2",
        },
      ],
    };

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(2);
    expect(result.repos.size).toBe(2);
    expect(result.repos.has("repo1")).toBe(true);
    expect(result.repos.has("repo2")).toBe(true);
  });

  test("should handle multiple repos in same category", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          date: "2024-01-15T10:00:00.000Z",
          message: "Add feature",
          repoName: "repo1",
        },
        {
          hash: "def456",
          date: "2024-01-15T11:00:00.000Z",
          message: "Add another feature",
          repoName: "repo2",
        },
        {
          hash: "ghi789",
          date: "2024-01-15T12:00:00.000Z",
          message: "Update feature",
          repoName: "repo1",
        },
      ],
    };

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(3);
    expect(result.repos.size).toBe(2);
    expect(result.repos.has("repo1")).toBe(true);
    expect(result.repos.has("repo2")).toBe(true);
  });

  test("should handle empty commits", () => {
    const commits: CategorizedCommits = {};

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(0);
    expect(result.repos.size).toBe(0);
  });

  test("should handle category with no commits", () => {
    const commits: CategorizedCommits = {
      Feature: [],
    };

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(0);
    expect(result.repos.size).toBe(0);
  });

  test("should deduplicate repos across categories", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          date: "2024-01-15T10:00:00.000Z",
          message: "Add feature",
          repoName: "repo1",
        },
      ],
      Bug: [
        {
          hash: "def456",
          date: "2024-01-15T11:00:00.000Z",
          message: "Fix bug",
          repoName: "repo1",
        },
      ],
    };

    const result = calculateStats(commits);

    expect(result.totalCommits).toBe(2);
    expect(result.repos.size).toBe(1);
    expect(result.repos.has("repo1")).toBe(true);
  });
});
