import type { CategorizedCommits } from "@/types";

export type CommitStats = {
  totalCommits: number;
  repos: Set<string>;
};

/**
 * Calculates summary statistics from categorized commits
 * @param categorizedCommits - Commits grouped by category
 * @returns Commit statistics
 */
export const calculateStats = (
  categorizedCommits: CategorizedCommits,
): CommitStats => {
  const totalCommits = Object.values(categorizedCommits).flat().length;
  const repos = new Set(
    Object.values(categorizedCommits)
      .flat()
      .map(c => c.repoName),
  );

  return { totalCommits, repos };
};
