import type { Command } from "commander";
import type { ColorMode, OutputFormat, OutputOptions } from "@/types";
import {
  calculateStatsFromFiltered,
  fetchAndCategorizeCommitsWithBranches,
  filterCommits,
} from "@/utils/commits";
import { handleCommandError } from "@/utils/process-exit";
import { readConfig } from "@/utils/read-config";
import { addCommonOptions, type CommandOptions } from "./shared";

type DateRangeFunction =
  | (() => { since: string; until: string })
  | ((sprintLength: number) => { since: string; until: string });

/**
 * Creates a time-range command with shared logic
 * @param name - Command name (e.g., "today", "yesterday")
 * @param description - Command description
 * @param getDateRange - Function that returns date range
 * @returns Command registration function
 */
export const createTimeRangeCommand = (
  name: string,
  description: string,
  getDateRange: DateRangeFunction,
) => {
  return (program: Command): void => {
    addCommonOptions(program.command(name))
      .description(description)
      .action(async (options: CommandOptions) => {
        try {
          const config = await readConfig();
          const dateRange =
            name === "sprint"
              ? (
                  getDateRange as (sprintLength: number) => {
                    since: string;
                    until: string;
                  }
                )(config.sprintLength)
              : (getDateRange as () => { since: string; until: string })();

          const outputOptions: OutputOptions = {
            format: options.format as OutputFormat,
            color: options.color as ColorMode,
            showSummary: options.summary,
            groupBy: config.groupBy,
            locale: config.locale,
          };

          const { merged, unmerged, stats } =
            await fetchAndCategorizeCommitsWithBranches(config, dateRange);

          const filteredMerged = filterCommits(merged, {
            repo: options.repo,
            category: options.category,
          });
          const filteredUnmerged = filterCommits(unmerged, {
            repo: options.repo,
            category: options.category,
          });

          const filteredStats = calculateStatsFromFiltered(
            filteredMerged,
            filteredUnmerged,
            stats.repos,
          );

          if (outputOptions.format === "markdown") {
            const { generateMarkdownOutputWithBranches } =
              await import("@/utils/output/markdown");
            const output = generateMarkdownOutputWithBranches(
              filteredMerged,
              filteredUnmerged,
              filteredStats,
              outputOptions,
              dateRange,
            );
            console.log(output);
          } else {
            const { generatePlainOutputWithBranches } =
              await import("@/utils/output/plain");
            const output = generatePlainOutputWithBranches(
              filteredMerged,
              filteredUnmerged,
              filteredStats,
              outputOptions,
            );
            console.log(output);
          }
        } catch (error) {
          handleCommandError(error, `Failed to fetch ${name}'s commits`);
        }
      });
  };
};
