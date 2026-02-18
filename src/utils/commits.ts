import { GIT_SHORT_HASH_LENGTH } from "@/constants";
import type {
  CategorizedCommits,
  CommitEntry,
  CommitWithBranch,
  Config,
  OutputOptions,
  SummaryStats,
  TieredCommits,
  TieredStats,
} from "@/types";
import {
  categorizeCommitsBatch,
  mergeCategorizedCommits,
} from "@/utils/categorize-commits-batch";
import { resolveCategoryFilter } from "@/utils/category-filter";
import { categorizeCommit } from "@/utils/category-patterns";
import { getGitLog, getGitLogWithBranches } from "@/utils/git-log";
import { groupBy } from "@/utils/group-by";
import { partitionByImportance } from "@/utils/importance";
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
 * Categorizes and accumulates commits from a partition into tiered accumulators
 * @param commits - Commits to process
 * @param repoName - Repository name
 * @param target - Target MergedUnmergedCommits accumulator
 */
const accumulatePartition = (
  commits: Array<CommitWithBranch>,
  repoName: string,
  target: { merged: CategorizedCommits; unmerged: CategorizedCommits },
): { mergedCount: number; unmergedCount: number } => {
  const merged = commits.filter(c => c.isMerged);
  const unmerged = commits.filter(c => !c.isMerged);

  mergeCategorizedCommits(
    target.merged,
    categorizeCommitsBatch(toCommitEntries(merged, repoName)),
  );
  mergeCategorizedCommits(
    target.unmerged,
    categorizeCommitsBatch(toCommitEntries(unmerged, repoName)),
  );

  return { mergedCount: merged.length, unmergedCount: unmerged.length };
};

/**
 * Fetches commits with branch information, scores by importance, and separates into tiers
 * @param config - Configuration object with repos and author emails
 * @param dateRange - Optional date range
 * @returns Tiered commits and statistics
 */
export const fetchAndCategorizeCommitsWithBranches = async (
  config: Config,
  dateRange?: { since: string; until: string },
): Promise<{
  tiered: TieredCommits;
  stats: TieredStats;
}> => {
  const tiered: TieredCommits = {
    keyContributions: { merged: {}, unmerged: {} },
    otherWork: { merged: {}, unmerged: {} },
  };
  const repos = new Set<string>();
  let totalMerged = 0;
  let totalUnmerged = 0;
  let keyContributionCount = 0;

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

      repos.add(repo.name);

      const { key, other } = partitionByImportance(log);
      keyContributionCount += key.length;

      const keyCounts = accumulatePartition(
        key,
        repo.name,
        tiered.keyContributions,
      );
      const otherCounts = accumulatePartition(other, repo.name, tiered.otherWork);

      totalMerged += keyCounts.mergedCount + otherCounts.mergedCount;
      totalUnmerged += keyCounts.unmergedCount + otherCounts.unmergedCount;
    } catch (error) {
      console.error(`Failed to fetch git log for ${repo.name}:`, error);
    }
  }

  return {
    tiered,
    stats: {
      totalCommits: totalMerged + totalUnmerged,
      mergedCommits: totalMerged,
      unmergedCommits: totalUnmerged,
      repos,
      keyContributionCount,
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
 * Counts commits in a CategorizedCommits object
 * @param categorized - Commits grouped by category
 * @returns Total commit count
 */
const countCategorizedCommits = (categorized: CategorizedCommits): number =>
  Object.values(categorized).reduce((sum, commits) => sum + commits.length, 0);

/**
 * Filters tiered commits by repo and/or category
 * @param tiered - Tiered commits to filter
 * @param filters - Optional repo and/or category filters
 * @returns Filtered tiered commits
 */
export const filterTieredCommits = (
  tiered: TieredCommits,
  filters?: { repo?: string; category?: string },
): TieredCommits => ({
  keyContributions: {
    merged: filterCommits(tiered.keyContributions.merged, filters),
    unmerged: filterCommits(tiered.keyContributions.unmerged, filters),
  },
  otherWork: {
    merged: filterCommits(tiered.otherWork.merged, filters),
    unmerged: filterCommits(tiered.otherWork.unmerged, filters),
  },
});

/**
 * Calculates tiered stats from filtered tiered commits
 * @param tiered - Filtered tiered commits
 * @param repos - Original repo set
 * @returns Tiered statistics
 */
export const calculateTieredStats = (
  tiered: TieredCommits,
  repos: Set<string>,
): TieredStats => {
  const keyMerged = countCategorizedCommits(tiered.keyContributions.merged);
  const keyUnmerged = countCategorizedCommits(tiered.keyContributions.unmerged);
  const otherMerged = countCategorizedCommits(tiered.otherWork.merged);
  const otherUnmerged = countCategorizedCommits(tiered.otherWork.unmerged);

  return {
    totalCommits: keyMerged + keyUnmerged + otherMerged + otherUnmerged,
    mergedCommits: keyMerged + otherMerged,
    unmergedCommits: keyUnmerged + otherUnmerged,
    repos,
    keyContributionCount: keyMerged + keyUnmerged,
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
