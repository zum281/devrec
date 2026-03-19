import type { CommitWithBranch, ImportanceLevel } from "@/types";

/**
 * Detects commit importance by scanning the message for high-signal keywords.
 * Matches are case-insensitive and position-independent (anywhere in the message).
 * Returns the highest matching tier (high, then medium, then low as default fallback).
 * Operates on raw strings -- caller should pre-clean Jira prefixes if needed.
 *
 * @param commitMsg - The commit message to scan for importance keywords.
 * @returns The highest matching {@link ImportanceLevel}.
 */
export const detectImportanceByKeyword = (commitMsg: string): ImportanceLevel => {
  for (const [importance, patterns] of Object.entries(importancePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(commitMsg)) {
        return importance as ImportanceLevel;
      }
    }
  }

  return "low";
};

/**
 * Keyword patterns grouped by importance tier.
 * High: security incidents, breaking changes, hotfixes.
 * Medium: performance, migrations, deprecations, regressions.
 * Low: empty (catchall fallback).
 */
export const importancePatterns: Record<ImportanceLevel, Array<RegExp>> = {
  high: [
    /security/i,
    /critical/i,
    /breaking/i,
    /hotfix/i,
    /vulnerability/i,
    /urgent/i,
  ],
  medium: [/performance/i, /migration/i, /deprecat(e|ed|ion)/i, /regression/i],
  low: [],
} as const;

/**
 * Detects commit importance based on merge status into the main branch.
 * Merged commits receive a "medium" boost; unmerged commits return "low".
 * Intended as a standalone signal -- combined with keyword detection in the composite scorer.
 *
 * @param isMerged - Whether the commit has been merged into the main branch.
 * @returns The corresponding {@link ImportanceLevel}.
 */
export const detectImportanceByMergeStatus = (
  isMerged: boolean,
): ImportanceLevel => (isMerged ? "medium" : "low");

/**
 * Checks if a commit matches the highlight value via case-insensitive substring match
 * against the commit message, primaryBranch, or any branch entry.
 *
 * @param commit - The enriched commit to check.
 * @param highlight - The highlight string to match against.
 * @returns Whether the commit matches the highlight value.
 */
const isHighlightMatch = (
  commit: CommitWithBranch,
  highlight: string,
): boolean => {
  const lower = highlight.toLowerCase();

  if (commit.message.toLowerCase().includes(lower)) return true;
  if (commit.primaryBranch?.toLowerCase().includes(lower)) return true;

  return commit.branches.some(branch => branch.toLowerCase().includes(lower));
};

/**
 * Scores a commit's importance by combining keyword and merge-status signals.
 * If a highlight value is provided and the commit matches, returns "high" immediately.
 * Otherwise: keyword high results in high. Keyword medium + merged results in high (combined boost).
 * Keyword medium alone results in medium. Merged alone results in medium. Otherwise low.
 *
 * @param commit - The enriched commit to score.
 * @param highlight - Optional highlight string to force-boost matching commits.
 * @returns The final composite {@link ImportanceLevel}.
 */
export const scoreCommit = (
  commit: CommitWithBranch,
  highlight?: string,
): ImportanceLevel => {
  if (highlight && isHighlightMatch(commit, highlight)) return "high";

  const { isMerged, message } = commit;
  const keywordScore = detectImportanceByKeyword(message);

  if (keywordScore === "high" || (keywordScore === "medium" && isMerged))
    return "high";
  if (keywordScore === "medium" || isMerged) return "medium";

  return "low";
};

/**
 * Partitions commits into key (high/medium importance) and other (low importance) groups.
 *
 * @param commits - Enriched commits with branch and merge info.
 * @param highlight - Optional highlight string to force-boost matching commits.
 * @returns Object with `key` (high + medium) and `other` (low) commit arrays.
 */
export const partitionByImportance = (
  commits: Array<CommitWithBranch>,
  highlight?: string,
): { key: Array<CommitWithBranch>; other: Array<CommitWithBranch> } => {
  const key: Array<CommitWithBranch> = [];
  const other: Array<CommitWithBranch> = [];

  for (const commit of commits) {
    const level = scoreCommit(commit, highlight);
    if (level === "low") {
      other.push(commit);
    } else {
      key.push(commit);
    }
  }

  return { key, other };
};
