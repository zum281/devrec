import chalk from "chalk";
import type {
  CategorizedCommits,
  ColorMode,
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
 * Determines if colors should be used based on TTY and color mode
 * @param colorMode - Color mode setting
 * @returns True if colors should be used
 */
const shouldUseColors = (colorMode: ColorMode): boolean => {
  if (colorMode === "always") return true;
  if (colorMode === "never") return false;
  return process.stdout.isTTY;
};

/**
 * Creates a plain text section formatter
 * @param isColorsEnabled - Whether colors should be used
 * @param locale - Locale for date formatting
 * @param showBranches - Whether to show branch information
 * @returns SectionFormatter for plain text output
 */
const createPlainSectionFormatter = (
  isColorsEnabled: boolean,
  locale: string,
  showBranches: boolean,
): SectionFormatter => ({
  level1Header: (name: string) =>
    isColorsEnabled ? chalk.bold.blue(`\n${name}:\n`) : `\n${name}:\n`,
  level2Header: (name: string) =>
    isColorsEnabled ? chalk.bold(`  ${name}:\n`) : `  ${name}:\n`,
  commitLine: commit =>
    formatCommitLine(commit, {
      format: "plain",
      locale,
      showBranches,
      isColorsEnabled,
    }),
  sectionSeparator: () => "",
});

/**
 * Generates plain text output
 * @param categorizedCommits - Commits grouped by category
 * @param options - Output configuration options
 * @returns Formatted plain text string
 */
export const generatePlainOutput = (
  categorizedCommits: CategorizedCommits,
  options: OutputOptions,
): string => {
  const isColorsEnabled = shouldUseColors(options.color);
  let output = "";

  if (options.showSummary) {
    const { totalCommits, repos } = calculateStats(categorizedCommits);

    output += isColorsEnabled ? chalk.bold("Summary:\n") : "Summary:\n";
    output += `  Total Commits: ${totalCommits.toString()}\n`;
    output += `  Repositories: ${[...repos].join(", ")}\n\n`;
  }

  const formatter = createPlainSectionFormatter(
    isColorsEnabled,
    options.locale,
    false,
  );

  output +=
    options.groupBy === "repo"
      ? generateRepoFirstSections(categorizedCommits, formatter)
      : generateCategoryFirstSections(categorizedCommits, formatter);

  return output;
};

/**
 * Helper to generate categorized output section
 * @param categorized - Categorized commits
 * @param options - Output options
 * @param showBranches - Whether to show branch names
 * @param isColorsEnabled - Whether colors are enabled
 * @returns Formatted output string
 */
const generateCategorizedOutput = (
  categorized: CategorizedCommits,
  options: OutputOptions,
  showBranches: boolean,
  isColorsEnabled: boolean,
): string => {
  const formatter = createPlainSectionFormatter(
    isColorsEnabled,
    options.locale,
    showBranches,
  );

  return options.groupBy === "repo"
    ? generateRepoFirstSections(categorized, formatter)
    : generateCategoryFirstSections(categorized, formatter);
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
 * Generates plain output with importance-tiered sections
 * @param tiered - Commits partitioned by importance tier
 * @param stats - Tiered summary statistics
 * @param options - Output configuration options
 * @returns Formatted plain string
 */
export const generatePlainOutputWithBranches = (
  tiered: TieredCommits,
  stats: TieredStats,
  options: OutputOptions,
): string => {
  const isColorsEnabled = shouldUseColors(options.color);
  let output = "";

  if (options.showSummary) {
    output += isColorsEnabled ? chalk.bold("Summary:\n") : "Summary:\n";
    output += `  Total Commits: ${stats.totalCommits.toString()}\n`;
    output += `  Merged to Main: ${stats.mergedCommits.toString()}\n`;
    output += `  In Progress: ${stats.unmergedCommits.toString()}\n`;

    if (stats.keyContributionCount > 0) {
      output += `  Key Contributions: ${stats.keyContributionCount.toString()}\n`;
    }

    output += `  Repositories: ${[...stats.repos].join(", ")}\n\n`;
  }

  const hasKeyContributions =
    hasCommits(tiered.keyContributions.merged) ||
    hasCommits(tiered.keyContributions.unmerged);
  const hasOtherWork =
    hasCommits(tiered.otherWork.merged) || hasCommits(tiered.otherWork.unmerged);

  if (hasKeyContributions && hasOtherWork) {
    output += isColorsEnabled
      ? chalk.bold.magenta("Key Contributions:\n")
      : "Key Contributions:\n";
    const keyCombined = combineMergedUnmerged(
      tiered.keyContributions.merged,
      tiered.keyContributions.unmerged,
    );
    output += generateCategorizedOutput(
      keyCombined,
      options,
      true,
      isColorsEnabled,
    );
    output += "\n";

    output += isColorsEnabled ? chalk.bold("Other Work:\n") : "Other Work:\n";
    const otherCombined = combineMergedUnmerged(
      tiered.otherWork.merged,
      tiered.otherWork.unmerged,
    );
    output += generateCategorizedOutput(
      otherCombined,
      options,
      true,
      isColorsEnabled,
    );
  } else if (hasKeyContributions) {
    output += isColorsEnabled
      ? chalk.bold.magenta("Key Contributions:\n")
      : "Key Contributions:\n";
    const keyCombined = combineMergedUnmerged(
      tiered.keyContributions.merged,
      tiered.keyContributions.unmerged,
    );
    output += generateCategorizedOutput(
      keyCombined,
      options,
      true,
      isColorsEnabled,
    );
  } else if (hasOtherWork) {
    const otherCombined = combineMergedUnmerged(
      tiered.otherWork.merged,
      tiered.otherWork.unmerged,
    );
    output += generateCategorizedOutput(
      otherCombined,
      options,
      true,
      isColorsEnabled,
    );
  }

  return output;
};
