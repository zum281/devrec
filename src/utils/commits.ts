import { GIT_SHORT_HASH_LENGTH } from "@/constants";
import type {
  CategorizedCommits,
  CommitEntry,
  CommitWithBranch,
  Config,
  OutputOptions,
  SummaryStats,
} from "@/types";
import {
  categorizeCommitsBatch,
  mergeCategorizedCommits,
} from "@/utils/categorize-commits-batch";
import { resolveCategoryFilter } from "@/utils/category-filter";
import { categorizeCommit } from "@/utils/category-patterns";
import { getGitLog, getGitLogWithBranches } from "@/utils/git-log";
import { groupBy } from "@/utils/group-by";
import { logRepoValidationWarning } from "@/utils/repo-warnings";
import { validateRepoPath } from "@/utils/validate-repo";

/**
 * Fetches, categorizes, and returns commits from all configured repositories
 * @param config - Configuration object with repos and author emails
 * @param dateRange - Optional date range (if not provided, fetches all commits)
 * @returns Commits grouped by category
 */
export const fetchAndCategorizeCommits = async (
  config: Config,
  dateRange?: { since: string; until: string },
): Promise<CategorizedCommits> => {
  const categorizedCommits: CategorizedCommits = {};

  for (const repo of config.repos) {
    const validation = await validateRepoPath(repo.path);

    if (!validation.valid) {
      logRepoValidationWarning(repo.name, repo.path, validation);
      continue;
    }

    try {
      const log = await getGitLog(config.authorEmails, repo.path, dateRange);

      for (const commit of log) {
        const category = categorizeCommit(commit.message);

        if (category === null) {
          continue;
        }

        categorizedCommits[category] ??= [];

        categorizedCommits[category].push({
          hash: commit.hash,
          message: commit.message,
          date: commit.date,
          repoName: repo.name,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch git log for ${repo.name}:`, error);
    }
  }

  return categorizedCommits;
};

/**
 * Converts commits with branch info to commit entries
 * @param commits - Commits with branch information
 * @param repoName - Repository name
 * @returns Array of commit entries
 */
const toCommitEntries = (
  commits: Array<CommitWithBranch>,
  repoName: string,
): Array<CommitEntry> => {
  return commits.map(commit => ({
    hash: commit.hash,
    message: commit.message,
    date: commit.date,
    repoName,
    branch: commit.primaryBranch,
  }));
};

/**
 * Fetches commits with branch information and separates merged/unmerged
 * @param config - Configuration object with repos and author emails
 * @param dateRange - Optional date range
 * @returns Object with merged and unmerged categorized commits
 */
export const fetchAndCategorizeCommitsWithBranches = async (
  config: Config,
  dateRange?: { since: string; until: string },
): Promise<{
  merged: CategorizedCommits;
  unmerged: CategorizedCommits;
  stats: SummaryStats;
}> => {
  const mergedCommits: CategorizedCommits = {};
  const unmergedCommits: CategorizedCommits = {};
  const repos = new Set<string>();
  let totalMerged = 0;
  let totalUnmerged = 0;

  for (const repo of config.repos) {
    const validation = await validateRepoPath(repo.path);

    if (!validation.valid) {
      logRepoValidationWarning(repo.name, repo.path, validation);
      continue;
    }

    try {
      const log = await getGitLogWithBranches(
        config.authorEmails,
        repo.path,
        config,
        dateRange,
      );

      const merged = log.filter(c => c.isMerged);
      const unmerged = log.filter(c => !c.isMerged);

      repos.add(repo.name);
      totalMerged += merged.length;
      totalUnmerged += unmerged.length;

      const categorizedMerged = categorizeCommitsBatch(
        toCommitEntries(merged, repo.name),
      );
      const categorizedUnmerged = categorizeCommitsBatch(
        toCommitEntries(unmerged, repo.name),
      );

      mergeCategorizedCommits(mergedCommits, categorizedMerged);
      mergeCategorizedCommits(unmergedCommits, categorizedUnmerged);
    } catch (error) {
      console.error(`Failed to fetch git log for ${repo.name}:`, error);
    }
  }

  return {
    merged: mergedCommits,
    unmerged: unmergedCommits,
    stats: {
      totalCommits: totalMerged + totalUnmerged,
      mergedCommits: totalMerged,
      unmergedCommits: totalUnmerged,
      repos,
    },
  };
};

/**
 * Calculates stats from filtered merged/unmerged commits
 * @param merged - Filtered merged commits
 * @param unmerged - Filtered unmerged commits
 * @param repos - Original repo set
 * @returns Updated stats
 */
export const calculateStatsFromFiltered = (
  merged: CategorizedCommits,
  unmerged: CategorizedCommits,
  repos: Set<string>,
): SummaryStats => {
  const mergedCount = Object.values(merged).reduce(
    (sum, commits) => sum + commits.length,
    0,
  );
  const unmergedCount = Object.values(unmerged).reduce(
    (sum, commits) => sum + commits.length,
    0,
  );

  return {
    totalCommits: mergedCount + unmergedCount,
    mergedCommits: mergedCount,
    unmergedCommits: unmergedCount,
    repos,
  };
};

/**
 * Groups commits by repo, then by category within each repo
 * @param categorizedCommits - Commits grouped by category
 * @returns Commits grouped by repo → category
 */
export const groupByRepo = (
  categorizedCommits: CategorizedCommits,
): Record<string, CategorizedCommits> => {
  const byRepo: Record<string, CategorizedCommits> = {};

  for (const [category, commits] of Object.entries(categorizedCommits)) {
    for (const commit of commits) {
      byRepo[commit.repoName] ??= {};
      byRepo[commit.repoName][category] ??= [];
      byRepo[commit.repoName][category].push(commit);
    }
  }

  return byRepo;
};

/**
 * Groups a single category's commits by repo
 * @param commits - Array of commits
 * @returns Commits grouped by repo name
 */
export const groupCommitsByRepo = (
  commits: Array<CommitEntry>,
): Record<string, Array<CommitEntry>> => {
  return groupBy(commits, commit => commit.repoName);
};

/**
 * Filters categorized commits by repo name and/or category
 * @param categorizedCommits - Commits grouped by category
 * @param filters - Optional repo and/or category filters
 * @returns Filtered commits grouped by category
 */
export const filterCommits = (
  categorizedCommits: CategorizedCommits,
  filters?: { repo?: string; category?: string },
): CategorizedCommits => {
  if (!filters?.repo && !filters?.category) {
    return categorizedCommits;
  }

  const resolvedCategory = filters.category
    ? resolveCategoryFilter(filters.category)
    : undefined;

  const filtered: CategorizedCommits = {};

  for (const [category, commits] of Object.entries(categorizedCommits)) {
    if (resolvedCategory && category !== resolvedCategory) {
      continue;
    }

    const filteredCommits = filters.repo
      ? commits.filter(commit => commit.repoName === filters.repo)
      : commits;

    if (filteredCommits.length > 0) {
      filtered[category] = filteredCommits;
    }
  }

  return filtered;
};

/**
 * Outputs categorized commits to console
 * @param categorizedCommits - Commits grouped by category
 */
export const printCategorizedCommits = (
  categorizedCommits: CategorizedCommits,
): void => {
  for (const [category, commits] of Object.entries(categorizedCommits)) {
    console.log(`\n${category}:`);
    for (const commit of commits) {
      console.log(
        `  - [${commit.hash.slice(0, GIT_SHORT_HASH_LENGTH)}] ${commit.message}`,
      );
    }
  }
};

/**
 * Outputs categorized commits based on options
 * @param categorizedCommits - Commits grouped by category
 * @param options - Output configuration options
 * @param dateRange - Optional date range for summary
 */
export const outputCommits = async (
  categorizedCommits: CategorizedCommits,
  options: OutputOptions,
  dateRange?: { since: string; until: string },
): Promise<void> => {
  let output: string;

  if (options.format === "markdown") {
    const { generateMarkdownOutput } = await import("@/utils/output/markdown");
    output = generateMarkdownOutput(categorizedCommits, options, dateRange);
  } else {
    const { generatePlainOutput } = await import("@/utils/output/plain");
    output = generatePlainOutput(categorizedCommits, options);
  }

  console.log(output);
};
