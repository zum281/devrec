import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CategorizedCommits, Config } from "@/types";
import {
  calculateStatsFromFiltered,
  fetchAndCategorizeCommits,
  filterCommits,
  groupByRepo,
  groupCommitsByRepo,
  outputCommits,
  printCategorizedCommits,
} from "../commits";
import { createCommitEntry } from "./fixtures";

vi.mock("../validate-repo");
vi.mock("../git-log");

describe("groupByRepo", () => {
  test("groups empty commits", () => {
    const result = groupByRepo({});
    expect(result).toEqual({});
  });

  test("groups commits by repo", () => {
    const commits: CategorizedCommits = {
      Features: [
        {
          hash: "abc123",
          message: "feat: new feature",
          date: "2024-03-15",
          repoName: "repo1",
        },
        {
          hash: "def456",
          message: "feat: another feature",
          date: "2024-03-16",
          repoName: "repo2",
        },
      ],
      Fixes: [
        {
          hash: "ghi789",
          message: "fix: bug fix",
          date: "2024-03-17",
          repoName: "repo1",
        },
      ],
    };

    const result = groupByRepo(commits);

    expect(result).toEqual({
      repo1: {
        Features: [
          {
            hash: "abc123",
            message: "feat: new feature",
            date: "2024-03-15",
            repoName: "repo1",
          },
        ],
        Fixes: [
          {
            hash: "ghi789",
            message: "fix: bug fix",
            date: "2024-03-17",
            repoName: "repo1",
          },
        ],
      },
      repo2: {
        Features: [
          {
            hash: "def456",
            message: "feat: another feature",
            date: "2024-03-16",
            repoName: "repo2",
          },
        ],
      },
    });
  });
});

describe("groupCommitsByRepo", () => {
  test("groups empty array", () => {
    const result = groupCommitsByRepo([]);
    expect(result).toEqual({});
  });

  test("groups commits from single repo", () => {
    const commits = [
      {
        hash: "abc123",
        message: "feat: feature 1",
        date: "2024-03-15",
        repoName: "repo1",
      },
      {
        hash: "def456",
        message: "feat: feature 2",
        date: "2024-03-16",
        repoName: "repo1",
      },
    ];

    const result = groupCommitsByRepo(commits);

    expect(result).toEqual({
      repo1: [
        {
          hash: "abc123",
          message: "feat: feature 1",
          date: "2024-03-15",
          repoName: "repo1",
        },
        {
          hash: "def456",
          message: "feat: feature 2",
          date: "2024-03-16",
          repoName: "repo1",
        },
      ],
    });
  });

  test("groups commits from multiple repos", () => {
    const commits = [
      {
        hash: "abc123",
        message: "feat: feature 1",
        date: "2024-03-15",
        repoName: "repo1",
      },
      {
        hash: "def456",
        message: "feat: feature 2",
        date: "2024-03-16",
        repoName: "repo2",
      },
      {
        hash: "ghi789",
        message: "feat: feature 3",
        date: "2024-03-17",
        repoName: "repo1",
      },
    ];

    const result = groupCommitsByRepo(commits);

    expect(result).toEqual({
      repo1: [
        {
          hash: "abc123",
          message: "feat: feature 1",
          date: "2024-03-15",
          repoName: "repo1",
        },
        {
          hash: "ghi789",
          message: "feat: feature 3",
          date: "2024-03-17",
          repoName: "repo1",
        },
      ],
      repo2: [
        {
          hash: "def456",
          message: "feat: feature 2",
          date: "2024-03-16",
          repoName: "repo2",
        },
      ],
    });
  });
});

describe("printCategorizedCommits", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("prints empty commits", () => {
    printCategorizedCommits({});
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  test("prints categorized commits", () => {
    const commits: CategorizedCommits = {
      Features: [
        {
          hash: "abc123def456",
          message: "feat: new feature",
          date: "2024-03-15",
          repoName: "repo1",
        },
      ],
    };

    printCategorizedCommits(commits);

    expect(consoleLogSpy).toHaveBeenCalledWith("\nFeatures:");
    expect(consoleLogSpy).toHaveBeenCalledWith("  - [abc123d] feat: new feature");
  });
});

describe("outputCommits", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("outputs markdown format", async () => {
    const commits: CategorizedCommits = {
      Features: [
        {
          hash: "abc123",
          message: "feat: new feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };

    await outputCommits(
      commits,
      {
        format: "markdown",
        groupBy: "category",
        locale: "en-US",
        showSummary: false,
        color: "auto",
      },
      { since: "Mon Mar 11 2024", until: "Fri Mar 15 2024" },
    );

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("# Dev Log:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("## Features"),
    );
  });

  test("outputs plain format", async () => {
    const commits: CategorizedCommits = {
      Features: [
        {
          hash: "abc123",
          message: "feat: new feature",
          date: "2024-03-15T10:00:00Z",
          repoName: "repo1",
        },
      ],
    };

    await outputCommits(commits, {
      format: "plain",
      groupBy: "category",
      locale: "en-US",
      showSummary: false,
      color: "never",
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Features:"),
    );
  });
});

describe("fetchAndCategorizeCommits", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("skips repo when path does not exist", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    vi.mocked(validateRepoPath).mockResolvedValue({
      valid: false,
      reason: "not-found",
    });

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [{ name: "missing-repo", path: "/invalid/path" }],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: Repo 'missing-repo' not found at path: /invalid/path",
    );
    expect(result).toEqual({});
  });

  test("skips repo when path is not a git repository", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    vi.mocked(validateRepoPath).mockResolvedValue({
      valid: false,
      reason: "not-git",
    });

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [{ name: "not-git", path: "/some/directory" }],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: Path '/some/directory' for repo 'not-git' is not a git repository",
    );
    expect(result).toEqual({});
  });

  test("skips repo when no permission to read", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    vi.mocked(validateRepoPath).mockResolvedValue({
      valid: false,
      reason: "no-permission",
    });

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [{ name: "restricted-repo", path: "/restricted/path" }],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: No permission to read repo 'restricted-repo' at path: /restricted/path",
    );
    expect(result).toEqual({});
  });

  test("continues with valid repos after skipping invalid ones", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    const { getGitLog } = await import("../git-log");

    vi.mocked(validateRepoPath)
      .mockResolvedValueOnce({ valid: false, reason: "not-found" })
      .mockResolvedValueOnce({ valid: true });

    vi.mocked(getGitLog).mockResolvedValue([
      {
        hash: "abc123",
        date: "2024-03-15T10:00:00Z",
        message: "feat: new feature",
      },
    ]);

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [
        { name: "invalid-repo", path: "/invalid" },
        { name: "valid-repo", path: "/valid" },
      ],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: Repo 'invalid-repo' not found at path: /invalid",
    );
    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("valid-repo");
  });
});

describe("filterCommits", () => {
  const sampleCommits: CategorizedCommits = {
    Feature: [
      {
        hash: "abc123",
        message: "feat: add login",
        date: "2024-03-15",
        repoName: "repo1",
      },
      {
        hash: "def456",
        message: "feat: add signup",
        date: "2024-03-16",
        repoName: "repo2",
      },
    ],
    Bug: [
      {
        hash: "ghi789",
        message: "fix: login bug",
        date: "2024-03-17",
        repoName: "repo1",
      },
    ],
    Chore: [
      {
        hash: "jkl012",
        message: "chore: update deps",
        date: "2024-03-18",
        repoName: "repo2",
      },
    ],
  };

  test("returns all commits when no filters provided", () => {
    const result = filterCommits(sampleCommits);
    expect(result).toEqual(sampleCommits);
  });

  test("returns all commits when empty filters provided", () => {
    const result = filterCommits(sampleCommits, {});
    expect(result).toEqual(sampleCommits);
  });

  test("filters commits by repo name", () => {
    const result = filterCommits(sampleCommits, { repo: "repo1" });

    expect(result).toHaveProperty("Feature");
    expect(result).toHaveProperty("Bug");
    expect(result).not.toHaveProperty("Chore");

    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("repo1");

    expect(result.Bug).toHaveLength(1);
    expect(result.Bug[0].repoName).toBe("repo1");
  });

  test("filters commits by category", () => {
    const result = filterCommits(sampleCommits, { category: "Feature" });

    expect(result).toHaveProperty("Feature");
    expect(result).not.toHaveProperty("Bug");
    expect(result).not.toHaveProperty("Chore");

    expect(result.Feature).toHaveLength(2);
  });

  test("filters commits by both repo and category", () => {
    const result = filterCommits(sampleCommits, {
      repo: "repo1",
      category: "Feature",
    });

    expect(result).toHaveProperty("Feature");
    expect(result).not.toHaveProperty("Bug");
    expect(result).not.toHaveProperty("Chore");

    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("repo1");
    expect(result.Feature[0].message).toBe("feat: add login");
  });

  test("returns empty object when no commits match repo filter", () => {
    const result = filterCommits(sampleCommits, { repo: "nonexistent" });
    expect(result).toEqual({});
  });

  test("throws error for nonexistent category filter", () => {
    expect(() => filterCommits(sampleCommits, { category: "Nonexistent" })).toThrow(
      "Unknown category filter",
    );
  });

  test("excludes categories with no commits after repo filtering", () => {
    const result = filterCommits(sampleCommits, { repo: "repo2" });

    expect(result).toHaveProperty("Feature");
    expect(result).toHaveProperty("Chore");
    expect(result).not.toHaveProperty("Bug");
  });

  test("filters by case-insensitive exact category", () => {
    const result = filterCommits(sampleCommits, { category: "feature" });
    expect(result).toHaveProperty("Feature");
    expect(result).not.toHaveProperty("Bug");
    expect(result).not.toHaveProperty("Chore");
  });

  test("filters by category prefix", () => {
    const result = filterCommits(sampleCommits, { category: "feat" });
    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(2);
  });

  test("throws error for ambiguous category prefix", () => {
    expect(() => filterCommits(sampleCommits, { category: "c" })).toThrow(
      "Ambiguous category filter",
    );
  });

  test("throws error for unknown category", () => {
    expect(() => filterCommits(sampleCommits, { category: "unknown" })).toThrow(
      "Unknown category filter",
    );
  });

  test("maintains backward compatibility with exact match", () => {
    const result = filterCommits(sampleCommits, { category: "Feature" });
    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(2);
  });
});

describe("Multi-repo scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("fetches commits from 2 valid repos", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    const { getGitLog } = await import("../git-log");

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    vi.mocked(getGitLog)
      .mockResolvedValueOnce([
        {
          hash: "abc123",
          date: "2024-03-15T10:00:00Z",
          message: "feat: frontend feature",
        },
        {
          hash: "def456",
          date: "2024-03-16T10:00:00Z",
          message: "fix: frontend bug",
        },
      ])
      .mockResolvedValueOnce([
        {
          hash: "ghi789",
          date: "2024-03-17T10:00:00Z",
          message: "chore: backend cleanup",
        },
      ]);

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [
        { name: "frontend", path: "/path/to/frontend" },
        { name: "backend", path: "/path/to/backend" },
      ],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(result).toHaveProperty("Feature");
    expect(result).toHaveProperty("Bug");
    expect(result).toHaveProperty("Chore");

    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("frontend");
    expect(result.Feature[0].message).toBe("feat: frontend feature");

    expect(result.Bug).toHaveLength(1);
    expect(result.Bug[0].repoName).toBe("frontend");

    expect(result.Chore).toHaveLength(1);
    expect(result.Chore[0].repoName).toBe("backend");
    expect(result.Chore[0].message).toBe("chore: backend cleanup");
  });

  test("fetches commits from 2 repos with same category", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    const { getGitLog } = await import("../git-log");

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    vi.mocked(getGitLog)
      .mockResolvedValueOnce([
        {
          hash: "abc123",
          date: "2024-03-15T10:00:00Z",
          message: "feat: frontend feature",
        },
      ])
      .mockResolvedValueOnce([
        {
          hash: "def456",
          date: "2024-03-16T10:00:00Z",
          message: "feat: backend feature",
        },
      ]);

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [
        { name: "frontend", path: "/path/to/frontend" },
        { name: "backend", path: "/path/to/backend" },
      ],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(2);

    expect(result.Feature[0].repoName).toBe("frontend");
    expect(result.Feature[0].message).toBe("feat: frontend feature");

    expect(result.Feature[1].repoName).toBe("backend");
    expect(result.Feature[1].message).toBe("feat: backend feature");
  });

  test("groups commits from multiple repos", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: frontend feature",
          date: "2024-03-15",
          repoName: "frontend",
        },
        {
          hash: "def456",
          message: "feat: backend feature",
          date: "2024-03-16",
          repoName: "backend",
        },
      ],
      Bug: [
        {
          hash: "ghi789",
          message: "fix: frontend bug",
          date: "2024-03-17",
          repoName: "frontend",
        },
      ],
      Chore: [
        {
          hash: "jkl012",
          message: "chore: backend cleanup",
          date: "2024-03-18",
          repoName: "backend",
        },
      ],
    };

    const result = groupByRepo(commits);

    expect(result).toHaveProperty("frontend");
    expect(result).toHaveProperty("backend");

    expect(result.frontend).toHaveProperty("Feature");
    expect(result.frontend).toHaveProperty("Bug");
    expect(result.frontend.Feature).toHaveLength(1);
    expect(result.frontend.Bug).toHaveLength(1);

    expect(result.backend).toHaveProperty("Feature");
    expect(result.backend).toHaveProperty("Chore");
    expect(result.backend.Feature).toHaveLength(1);
    expect(result.backend.Chore).toHaveLength(1);
  });

  test("filters by exact repo name with multiple repos", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: frontend feature",
          date: "2024-03-15",
          repoName: "frontend",
        },
        {
          hash: "def456",
          message: "feat: backend feature",
          date: "2024-03-16",
          repoName: "backend",
        },
      ],
      Bug: [
        {
          hash: "ghi789",
          message: "fix: backend bug",
          date: "2024-03-17",
          repoName: "backend",
        },
      ],
    };

    const result = filterCommits(commits, { repo: "frontend" });

    expect(result).toHaveProperty("Feature");
    expect(result).not.toHaveProperty("Bug");

    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("frontend");
    expect(result.Feature[0].message).toBe("feat: frontend feature");
  });

  test("filters with non-matching repo name", () => {
    const commits: CategorizedCommits = {
      Feature: [
        {
          hash: "abc123",
          message: "feat: frontend feature",
          date: "2024-03-15",
          repoName: "frontend",
        },
        {
          hash: "def456",
          message: "feat: backend feature",
          date: "2024-03-16",
          repoName: "backend",
        },
      ],
    };

    const result = filterCommits(commits, { repo: "nonexistent" });

    expect(result).toEqual({});
  });

  test("handles one repo empty, one with commits", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    const { getGitLog } = await import("../git-log");

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    vi.mocked(getGitLog)
      .mockResolvedValueOnce([
        {
          hash: "abc123",
          date: "2024-03-15T10:00:00Z",
          message: "feat: frontend feature",
        },
      ])
      .mockResolvedValueOnce([]);

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [
        { name: "frontend", path: "/path/to/frontend" },
        { name: "backend", path: "/path/to/backend" },
      ],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(1);
    expect(result.Feature[0].repoName).toBe("frontend");

    expect(getGitLog).toHaveBeenCalledTimes(2);
  });

  test("handles duplicate repo names", async () => {
    const { validateRepoPath } = await import("../validate-repo");
    const { getGitLog } = await import("../git-log");

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    vi.mocked(getGitLog)
      .mockResolvedValueOnce([
        {
          hash: "abc123",
          date: "2024-03-15T10:00:00Z",
          message: "feat: first app feature",
        },
      ])
      .mockResolvedValueOnce([
        {
          hash: "def456",
          date: "2024-03-16T10:00:00Z",
          message: "feat: second app feature",
        },
      ]);

    const config: Config = {
      authorEmails: ["test@example.com"],
      repos: [
        { name: "app", path: "/path/to/app1" },
        { name: "app", path: "/path/to/app2" },
      ],
      sprintLength: 2,
      groupBy: "category",
      locale: "en-US",
      mainBranch: "main",
      branchStrategy: "remote",
    };

    const result = await fetchAndCategorizeCommits(config);

    expect(result).toHaveProperty("Feature");
    expect(result.Feature).toHaveLength(2);

    expect(result.Feature[0].repoName).toBe("app");
    expect(result.Feature[0].message).toBe("feat: first app feature");

    expect(result.Feature[1].repoName).toBe("app");
    expect(result.Feature[1].message).toBe("feat: second app feature");
  });
});

describe("calculateStatsFromFiltered", () => {
  test("calculates stats from empty commits", () => {
    const stats = calculateStatsFromFiltered({}, {}, new Set(["repo1"]));
    expect(stats).toEqual({
      totalCommits: 0,
      mergedCommits: 0,
      unmergedCommits: 0,
      repos: new Set(["repo1"]),
    });
  });

  test("calculates stats with only merged commits", () => {
    const merged: CategorizedCommits = {
      Feature: [createCommitEntry(), createCommitEntry()],
    };
    const stats = calculateStatsFromFiltered(merged, {}, new Set(["repo1"]));
    expect(stats.totalCommits).toBe(2);
    expect(stats.mergedCommits).toBe(2);
    expect(stats.unmergedCommits).toBe(0);
    expect(stats.repos).toEqual(new Set(["repo1"]));
  });

  test("calculates stats with only unmerged commits", () => {
    const unmerged: CategorizedCommits = {
      Feature: [createCommitEntry(), createCommitEntry()],
      Bug: [createCommitEntry()],
    };
    const stats = calculateStatsFromFiltered({}, unmerged, new Set(["repo1"]));
    expect(stats.totalCommits).toBe(3);
    expect(stats.mergedCommits).toBe(0);
    expect(stats.unmergedCommits).toBe(3);
    expect(stats.repos).toEqual(new Set(["repo1"]));
  });

  test("calculates stats with both merged and unmerged", () => {
    const merged: CategorizedCommits = {
      Feature: [createCommitEntry()],
    };
    const unmerged: CategorizedCommits = {
      Feature: [createCommitEntry(), createCommitEntry()],
      Bug: [createCommitEntry()],
    };
    const stats = calculateStatsFromFiltered(
      merged,
      unmerged,
      new Set(["repo1", "repo2"]),
    );
    expect(stats.totalCommits).toBe(4);
    expect(stats.mergedCommits).toBe(1);
    expect(stats.unmergedCommits).toBe(3);
    expect(stats.repos).toEqual(new Set(["repo1", "repo2"]));
  });

  test("calculates stats across multiple categories", () => {
    const merged: CategorizedCommits = {
      Feature: [createCommitEntry(), createCommitEntry()],
      Bug: [createCommitEntry()],
    };
    const unmerged: CategorizedCommits = {
      Feature: [createCommitEntry()],
      Chore: [createCommitEntry(), createCommitEntry()],
    };
    const stats = calculateStatsFromFiltered(merged, unmerged, new Set(["repo1"]));
    expect(stats.totalCommits).toBe(6);
    expect(stats.mergedCommits).toBe(3);
    expect(stats.unmergedCommits).toBe(3);
  });
});
