import type { Command } from "commander";
import type { ColorMode, OutputFormat, OutputOptions } from "@/types";
import {
  fetchAndCategorizeCommits,
  filterCommits,
  outputCommits,
} from "@/utils/commits";
import { readConfig } from "@/utils/read-config";
import { addCommonOptions, type CommandOptions } from "./shared";

/**
 * Registers the all command
 * @param program - Commander program instance
 */
export const registerAllCommand = (program: Command): void => {
  addCommonOptions(program.command("all"))
    .description("Show all commits across all time")
    .action(async (options: CommandOptions) => {
      try {
        const config = await readConfig();

        const categorizedCommits = await fetchAndCategorizeCommits(config);

        const filteredCommits = filterCommits(categorizedCommits, {
          repo: options.repo,
          category: options.category,
        });

        const outputOptions: OutputOptions = {
          format: options.format as OutputFormat,
          color: options.color as ColorMode,
          showSummary: options.summary,
          groupBy: config.groupBy,
          locale: config.locale,
        };

        await outputCommits(filteredCommits, outputOptions);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error("Failed to fetch all commits:", error);
        }
        process.exit(1);
      }
    });
};
