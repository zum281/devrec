import type {
  CategorizedCommits,
  OutputOptions,
  TieredCommits,
  TieredStats,
} from "@/types";
import { mergeCategorizedCommits } from "@/utils/categorize-commits-batch";
import { calculateStats } from "./calculate-stats";
import { formatCommitLine } from "./format-commit";
import {
  generateCategoryFirstSections,
  generateRepoFirstSections,
  type SectionFormatter,
} from "./generate-sections";

/**
 * Creates a markdown section formatter
 * @param locale - Locale for date formatting
 * @param showBranches - Whether to show branch information
 * @returns SectionFormatter for markdown output
 */
const createMarkdownSectionFormatter = (
  locale: string,
  showBranches: boolean,
): SectionFormatter => ({
  level1Header: (name: string) => `## ${name}\n\n`,
  level2Header: (name: string) => `### ${name}\n\n`,
  commitLine: commit =>
    formatCommitLine(commit, {
      format: "markdown",
      locale,
      showBranches,
      isColorsEnabled: false,
    }),
  sectionSeparator: () => "---\n\n",
});

/**
 * Generates summary section
 * @param categorizedCommits - Commits grouped by category
 * @param dateRange - Optional date range
 * @returns Summary markdown string
 */
const generateSummary = (
  categorizedCommits: CategorizedCommits,
  dateRange?: { since: string; until: string },
): string => {
  const { totalCommits, repos } = calculateStats(categorizedCommits);

  let summary = "## Summary\n\n";
  summary += `- **Total Commits**: ${totalCommits.toString()}\n`;
  summary += `- **Repositories**: ${[...repos].join(", ")}\n`;

  if (dateRange) {
    summary += `- **Date Range**: ${dateRange.since} to ${dateRange.until}\n`;
  }

  return summary + "\n---\n\n";
};

/**
 * Generates summary section with branch and importance information
 * @param stats - Tiered summary statistics
 * @param dateRange - Optional date range
 * @returns Summary markdown string
 */
const generateSummaryWithBranches = (
  stats: TieredStats,
  dateRange?: { since: string; until: string },
): string => {
  let summary = "## Summary\n\n";
  summary += `- **Total Commits**: ${stats.totalCommits.toString()}\n`;
  summary += `- **Merged to Main**: ${stats.mergedCommits.toString()}\n`;
  summary += `- **In Progress**: ${stats.unmergedCommits.toString()}\n`;

  if (stats.keyContributionCount > 0) {
    summary += `- **Key Contributions**: ${stats.keyContributionCount.toString()}\n`;
  }

  summary += `- **Repositories**: ${[...stats.repos].join(", ")}\n`;

  if (dateRange) {
    summary += `- **Date Range**: ${dateRange.since} to ${dateRange.until}\n`;
  }

  return summary + "\n---\n\n";
};

/**
 * Generates markdown output with category-first grouping
 * @param categorizedCommits - Commits grouped by category
 * @param locale - Locale for date formatting
 * @param showBranches - Whether to show branch names
 * @returns Markdown string
 */
const generateCategoryFirst = (
  categorizedCommits: CategorizedCommits,
  locale: string,
  showBranches = false,
): string => {
  const formatter = createMarkdownSectionFormatter(locale, showBranches);
  return generateCategoryFirstSections(categorizedCommits, formatter);
};

/**
 * Generates markdown output with repo-first grouping
 * @param categorizedCommits - Commits grouped by category
 * @param locale - Locale for date formatting
 * @param showBranches - Whether to show branch names
 * @returns Markdown string
 */
const generateRepoFirst = (
  categorizedCommits: CategorizedCommits,
  locale: string,
  showBranches = false,
): string => {
  const formatter = createMarkdownSectionFormatter(locale, showBranches);
  return generateRepoFirstSections(categorizedCommits, formatter);
};

/**
 * Checks if a CategorizedCommits has any commits
 * @param categorized - Commits grouped by category
 * @returns True if there are any commits
 */
const hasCommits = (categorized: CategorizedCommits): boolean =>
  Object.values(categorized).some(commits => commits.length > 0);

/**
 * Combines merged and unmerged categorized commits into one
 * @param merged - Merged categorized commits
 * @param unmerged - Unmerged categorized commits
 * @returns Combined categorized commits
 */
const combineMergedUnmerged = (
  merged: CategorizedCommits,
  unmerged: CategorizedCommits,
): CategorizedCommits => {
  const combined: CategorizedCommits = {};
  mergeCategorizedCommits(combined, merged);
  mergeCategorizedCommits(combined, unmerged);
  return combined;
};

/**
 * Renders a section of categorized commits using the appropriate grouping
 * @param categorized - Combined categorized commits
 * @param options - Output options
 * @returns Formatted markdown string
 */
const renderSection = (
  categorized: CategorizedCommits,
  options: OutputOptions,
): string =>
  options.groupBy === "repo"
    ? generateRepoFirst(categorized, options.locale, true)
    : generateCategoryFirst(categorized, options.locale, true);

/**
 * Generates markdown output for categorized commits
 * @param categorizedCommits - Commits grouped by category
 * @param options - Output configuration options
 * @param dateRange - Optional date range for summary
 * @returns Formatted markdown string
 */
export const generateMarkdownOutput = (
  categorizedCommits: CategorizedCommits,
  options: OutputOptions,
  dateRange?: { since: string; until: string },
): string => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let output = `# Dev Log: ${today}\n\n`;

  if (options.showSummary) {
    output += generateSummary(categorizedCommits, dateRange);
  }

  output +=
    options.groupBy === "repo"
      ? generateRepoFirst(categorizedCommits, options.locale)
      : generateCategoryFirst(categorizedCommits, options.locale);

  output += "_Generated by devrec_\n";

  return output;
};

/**
 * Generates markdown output with importance-tiered sections
 * @param tiered - Commits partitioned by importance tier
 * @param stats - Tiered summary statistics
 * @param options - Output configuration options
 * @param dateRange - Optional date range for summary
 * @returns Formatted markdown string
 */
export const generateMarkdownOutputWithBranches = (
  tiered: TieredCommits,
  stats: TieredStats,
  options: OutputOptions,
  dateRange?: { since: string; until: string },
): string => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let output = `# Dev Log: ${today}\n\n`;

  if (options.showSummary) {
    output += generateSummaryWithBranches(stats, dateRange);
  }

  const hasKeyContributions =
    hasCommits(tiered.keyContributions.merged) ||
    hasCommits(tiered.keyContributions.unmerged);
  const hasOtherWork =
    hasCommits(tiered.otherWork.merged) || hasCommits(tiered.otherWork.unmerged);

  if (hasKeyContributions && hasOtherWork) {
    output += "## Key Contributions\n\n";
    const keyCombined = combineMergedUnmerged(
      tiered.keyContributions.merged,
      tiered.keyContributions.unmerged,
    );
    output += renderSection(keyCombined, options);

    output += "## Other Work\n\n";
    const otherCombined = combineMergedUnmerged(
      tiered.otherWork.merged,
      tiered.otherWork.unmerged,
    );
    output += renderSection(otherCombined, options);
  } else if (hasKeyContributions) {
    output += "## Key Contributions\n\n";
    const keyCombined = combineMergedUnmerged(
      tiered.keyContributions.merged,
      tiered.keyContributions.unmerged,
    );
    output += renderSection(keyCombined, options);
  } else if (hasOtherWork) {
    const otherCombined = combineMergedUnmerged(
      tiered.otherWork.merged,
      tiered.otherWork.unmerged,
    );
    output += renderSection(otherCombined, options);
  }

  output += "_Generated by devrec_\n";

  return output;
};
