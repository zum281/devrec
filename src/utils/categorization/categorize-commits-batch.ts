import type { CategorizedCommits, CommitEntry } from "@/types";
import { categorizeCommit } from "./category-patterns";

/**
 * Categorizes a batch of commits by their category
 * @param commits - Array of commits to categorize
 * @returns Commits grouped by category
 */
export const categorizeCommitsBatch = (
  commits: Array<CommitEntry>,
): CategorizedCommits => {
  const categorized: CategorizedCommits = {};

  for (const commit of commits) {
    const category = categorizeCommit(commit.message);
    if (category === null) continue;

    categorized[category] ??= [];
    categorized[category].push(commit);
  }

  return categorized;
};

/**
 * Merges source categorized commits into target
 * @param target - Target categorized commits object to merge into
 * @param source - Source categorized commits to merge from
 */
export const mergeCategorizedCommits = (
  target: CategorizedCommits,
  source: CategorizedCommits,
): void => {
  for (const [category, commits] of Object.entries(source)) {
    target[category] ??= [];
    target[category].push(...commits);
  }
};
