#!/usr/bin/env node
import { Command } from "commander";
import { readPackageInfo } from "@/utils/read-package";
import { registerAllCommand } from "./commands/all";
import { registerInitCommand } from "./commands/init";
import { registerSprintCommand } from "./commands/sprint";
import { registerTodayCommand } from "./commands/today";
import { registerWeekCommand } from "./commands/week";
import { registerYesterdayCommand } from "./commands/yesterday";

/**
 * Main CLI entry point for devrec
 */
export const main = async (): Promise<void> => {
  const packageInfo = await readPackageInfo();
  const program = new Command();

  program
    .name(packageInfo.name)
    .version(packageInfo.version)
    .description(packageInfo.description);

  registerInitCommand(program);
  registerTodayCommand(program);
  registerYesterdayCommand(program);
  registerWeekCommand(program);
  registerSprintCommand(program);
  registerAllCommand(program);

  program.parse();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
