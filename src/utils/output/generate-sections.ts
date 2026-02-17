import type { CategorizedCommits, CommitEntry } from "@/types";
import { groupByRepo, groupCommitsByRepo } from "@/utils/commits";

export type SectionFormatter = {
  level1Header: (name: string) => string;
  level2Header: (name: string) => string;
  commitLine: (commit: CommitEntry) => string;
  sectionSeparator: () => string;
};

/**
 * Generates sections with category-first grouping
 * @param categorized - Commits grouped by category
 * @param formatter - Formatter callbacks for headers, commits, separators
 * @returns Formatted output string
 */
export const generateCategoryFirstSections = (
  categorized: CategorizedCommits,
  formatter: SectionFormatter,
): string => {
  let output = "";

  for (const [category, commits] of Object.entries(categorized)) {
    output += formatter.level1Header(category);

    const byRepo = groupCommitsByRepo(commits);

    for (const [repoName, repoCommits] of Object.entries(byRepo)) {
      output += formatter.level2Header(repoName);

      for (const commit of repoCommits) {
        output += formatter.commitLine(commit);
      }
    }

    output += formatter.sectionSeparator();
  }

  return output;
};

/**
 * Generates sections with repo-first grouping
 * @param categorized - Commits grouped by category
 * @param formatter - Formatter callbacks for headers, commits, separators
 * @returns Formatted output string
 */
export const generateRepoFirstSections = (
  categorized: CategorizedCommits,
  formatter: SectionFormatter,
): string => {
  let output = "";
  const byRepo = groupByRepo(categorized);

  for (const [repoName, categories] of Object.entries(byRepo)) {
    output += formatter.level1Header(repoName);

    for (const [category, commits] of Object.entries(categories)) {
      output += formatter.level2Header(category);

      for (const commit of commits) {
        output += formatter.commitLine(commit);
      }
    }

    output += formatter.sectionSeparator();
  }

  return output;
};
