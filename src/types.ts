import type { z } from "zod";
import type { ConfigSchema, RepoSchema } from "./schemas/config.schema";
import type { PackageInfoSchema } from "./schemas/package.schema";

/**
 * Repository configuration type
 */
export type Repo = z.infer<typeof RepoSchema>;

/**
 * Configuration type inferred from ConfigSchema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Package metadata type
 */
export type PackageInfo = z.infer<typeof PackageInfoSchema>;

/**
 * Git commit with full details
 */
export type Commit = {
  hash: string;
  date: string;
  message: string;
};

/**
 * Commit with branch information
 */
export type CommitWithBranch = Commit & {
  branches: Array<string>;
  isMerged: boolean;
  primaryBranch?: string;
};

/**
 * Simplified commit entry for categorization
 */
export type CommitEntry = {
  hash: string;
  message: string;
  date: string;
  repoName: string;
  branch?: string;
};

/**
 * Commits grouped by category
 */
export type CategorizedCommits = Record<string, Array<CommitEntry>>;

/**
 * Summary statistics
 */
export type SummaryStats = {
  totalCommits: number;
  mergedCommits: number;
  unmergedCommits: number;
  repos: Set<string>;
};

/**
 * Branch scanning strategy
 */
export type BranchStrategy = "all" | "remote";

/**
 * Output format type
 */
export type OutputFormat = "plain" | "markdown";

/**
 * Color mode for terminal output
 */
export type ColorMode = "always" | "never" | "auto";

/**
 * Output configuration options
 */
export type OutputOptions = {
  format: OutputFormat;
  color: ColorMode;
  showSummary: boolean;
  groupBy: "repo" | "category";
  locale: string;
};

/**
 * Commit importance levels
 */
export type ImportanceLevel = "high" | "medium" | "low";
