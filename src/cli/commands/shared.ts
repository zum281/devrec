import type { Command } from "commander";

/**
 * Adds common output options to a command
 * @param command - Commander command instance
 * @returns Command with common options added
 */
export const addCommonOptions = (command: Command): Command => {
  return command
    .option("--format <type>", "Output format: plain or markdown", "plain")
    .option("--color <mode>", "Color mode: always, never, or auto", "auto")
    .option("--summary", "Show summary statistics", false)
    .option("--repo <name>", "Filter by repository name")
    .option("--category <name>", "Filter by category name");
};

/**
 * Common options type for command handlers
 */
export type CommandOptions = {
  format: string;
  color: string;
  summary: boolean;
  repo?: string;
  category?: string;
};
