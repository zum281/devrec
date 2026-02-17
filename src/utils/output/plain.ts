import chalk from "chalk";
import type {
  CategorizedCommits,
  ColorMode,
  OutputOptions,
  SummaryStats,
} from "@/types";
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
 * Generates plain output with branch information
 * @param merged - Merged commits grouped by category
 * @param unmerged - Unmerged commits grouped by category
 * @param stats - Summary statistics
 * @param options - Output configuration options
 * @returns Formatted plain string
 */
export const generatePlainOutputWithBranches = (
  merged: CategorizedCommits,
  unmerged: CategorizedCommits,
  stats: SummaryStats,
  options: OutputOptions,
): string => {
  const isColorsEnabled = shouldUseColors(options.color);
  let output = "";

  if (options.showSummary) {
    output += isColorsEnabled ? chalk.bold("Summary:\n") : "Summary:\n";
    output += `  Total Commits: ${stats.totalCommits.toString()}\n`;
    output += `  Merged to Main: ${stats.mergedCommits.toString()}\n`;
    output += `  In Progress: ${stats.unmergedCommits.toString()}\n`;
    output += `  Repositories: ${[...stats.repos].join(", ")}\n\n`;
  }

  if (stats.mergedCommits > 0) {
    output += isColorsEnabled
      ? chalk.bold.green("Merged Work:\n")
      : "Merged Work:\n";
    output += generateCategorizedOutput(merged, options, false, isColorsEnabled);
    output += "\n";
  }

  if (stats.unmergedCommits > 0) {
    output += isColorsEnabled
      ? chalk.bold.yellow("In Progress (Unmerged):\n")
      : "In Progress (Unmerged):\n";
    output += generateCategorizedOutput(unmerged, options, true, isColorsEnabled);
  }

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
