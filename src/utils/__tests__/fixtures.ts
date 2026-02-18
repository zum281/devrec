import { vi } from "vitest";
import type {
  CategorizedCommits,
  ColorMode,
  Commit,
  CommitEntry,
  CommitWithBranch,
  Config,
  OutputFormat,
  OutputOptions,
  Repo,
} from "@/types";

export const FIXED_DATE = new Date("2024-03-15T10:00:00Z");

export const MOCK_DATES = {
  today: "2024-03-15T10:00:00Z",
  yesterday: "2024-03-14T10:00:00Z",
  tomorrow: "2024-03-16T10:00:00Z",
  lastWeek: "2024-03-08T10:00:00Z",
  nextWeek: "2024-03-22T10:00:00Z",
} as const;

/**
 * Creates a basic git commit
 */
export const createCommit = (overrides?: Partial<Commit>): Commit => ({
  hash: "abc123def456",
  date: MOCK_DATES.today,
  message: "feat: test feature",
  ...overrides,
});

/**
 * Creates a commit with branch information
 */
export const createCommitWithBranch = (
  overrides?: Partial<CommitWithBranch>,
): CommitWithBranch => ({
  hash: "abc123def456",
  date: MOCK_DATES.today,
  message: "feat: test feature",
  branches: ["main"],
  isMerged: false,
  ...overrides,
});

/**
 * Creates a commit entry with repo name
 */
export const createCommitEntry = (
  overrides?: Partial<CommitEntry>,
): CommitEntry => ({
  hash: "abc123",
  message: "feat: test feature",
  date: MOCK_DATES.today,
  repoName: "repo1",
  ...overrides,
});

/**
 * Creates categorized commits structure
 */
export const createCategorizedCommits = (
  structure?: CategorizedCommits,
): CategorizedCommits => {
  if (structure) {
    return structure;
  }

  return {
    Features: [
      createCommitEntry({
        hash: "abc123",
        message: "feat: new feature",
        date: MOCK_DATES.today,
        repoName: "repo1",
      }),
    ],
  };
};

/**
 * Creates a repo configuration
 */
export const createRepo = (overrides?: Partial<Repo>): Repo => ({
  name: "repo1",
  path: "/path/to/repo",
  ...overrides,
});

/**
 * Creates a full config object
 */
export const createConfig = (overrides?: Partial<Config>): Config => ({
  authorEmails: ["test@example.com"],
  repos: [createRepo()],
  sprintLength: 2,
  groupBy: "category",
  locale: "en-US",
  mainBranch: "main",
  branchStrategy: "all",
  ...overrides,
});

/**
 * Creates output options
 */
export const createOutputOptions = (
  overrides?: Partial<OutputOptions>,
): OutputOptions => ({
  format: "plain" as OutputFormat,
  color: "never" as ColorMode,
  showSummary: false,
  groupBy: "category",
  locale: "en-US",
  ...overrides,
});

/**
 * Creates console spy for error, log, or warn
 */
export const setupConsoleSpy = (method: "error" | "log" | "warn") => {
  return vi.spyOn(console, method).mockImplementation(vi.fn());
};

/**
 * Creates process.exit spy
 */
export const setupProcessExitSpy = () => {
  return vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
};

/**
 * Creates multiple commits for a single repo
 */
export const createMultipleCommits = (
  count: number,
  repoName = "repo1",
): Array<CommitEntry> => {
  return Array.from({ length: count }, (_, index) =>
    createCommitEntry({
      hash: `hash${String(index)}`,
      message: `feat: feature ${String(index + 1)}`,
      date: MOCK_DATES.today,
      repoName,
    }),
  );
};

/**
 * Creates categorized commits with multiple categories
 */
export const createMultiCategoryCommits = (): CategorizedCommits => ({
  Features: [
    createCommitEntry({
      hash: "abc123",
      message: "feat: new feature",
      repoName: "repo1",
    }),
    createCommitEntry({
      hash: "def456",
      message: "feat: another feature",
      date: MOCK_DATES.yesterday,
      repoName: "repo2",
    }),
  ],
  Fixes: [
    createCommitEntry({
      hash: "ghi789",
      message: "fix: bug fix",
      date: MOCK_DATES.today,
      repoName: "repo1",
    }),
  ],
  Chore: [
    createCommitEntry({
      hash: "jkl012",
      message: "chore: update deps",
      date: MOCK_DATES.yesterday,
      repoName: "repo2",
    }),
  ],
});

/**
 * Creates commits across multiple repos
 */
export const createMultiRepoCommits = (repoCount: number): CategorizedCommits => {
  const commits: CategorizedCommits = { Features: [] };

  for (let index = 0; index < repoCount; index++) {
    commits.Features.push(
      createCommitEntry({
        hash: `hash${String(index)}`,
        message: `feat: feature in repo${String(index + 1)}`,
        repoName: `repo${String(index + 1)}`,
      }),
    );
  }

  return commits;
};
