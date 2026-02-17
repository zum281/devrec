import chalk from "chalk";
import { GIT_SHORT_HASH_LENGTH } from "@/constants";
import type { CommitEntry } from "@/types";
import { formatDate } from "./format-date";

export type FormatCommitOptions = {
  format: "plain" | "markdown";
  locale: string;
  showBranches: boolean;
  isColorsEnabled: boolean;
};

/**
 * Formats a single commit line with hash, message, date, and optional branch
 * @param commit - Commit to format
 * @param options - Formatting options
 * @returns Formatted commit line with newline
 */
export const formatCommitLine = (
  commit: CommitEntry,
  options: FormatCommitOptions,
): string => {
  const shortHash = commit.hash.slice(0, GIT_SHORT_HASH_LENGTH);
  const formattedDate = formatDate(commit.date, options.locale);

  return options.format === "markdown"
    ? formatMarkdownCommit(commit, shortHash, formattedDate, options.showBranches)
    : formatPlainCommit(
        commit,
        shortHash,
        formattedDate,
        options.showBranches,
        options.isColorsEnabled,
      );
};

/**
 * Formats commit for markdown output
 * Format: - [hash] message `[branch]` _(date)_
 */
function formatMarkdownCommit(
  commit: CommitEntry,
  shortHash: string,
  formattedDate: string,
  showBranches: boolean,
): string {
  const branchInfo = showBranches && commit.branch ? ` \`[${commit.branch}]\`` : "";
  return `    - [${shortHash}] ${commit.message}${branchInfo} _(${formattedDate})_\n`;
}

/**
 * Formats commit for plain text output with optional colors
 * Format: - [hash] message [branch] (date)
 */
function formatPlainCommit(
  commit: CommitEntry,
  shortHash: string,
  formattedDate: string,
  showBranches: boolean,
  isColorsEnabled: boolean,
): string {
  const hashPart = isColorsEnabled ? chalk.dim(`[${shortHash}]`) : `[${shortHash}]`;

  const branchInfo =
    showBranches && commit.branch
      ? isColorsEnabled
        ? chalk.cyan(` [${commit.branch}]`)
        : ` [${commit.branch}]`
      : "";

  const datePart = isColorsEnabled
    ? chalk.gray(`(${formattedDate})`)
    : `(${formattedDate})`;

  return `    - ${hashPart} ${commit.message}${branchInfo} ${datePart}\n`;
}
