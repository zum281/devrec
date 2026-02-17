import { confirm, input, select } from "@inquirer/prompts";
import type { Command } from "commander";
import { access, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname } from "node:path";
import { ConfigSchema } from "@/schemas/config.schema";
import type { BranchStrategy, Config } from "@/types";
import { collectAuthorEmails, collectRepos } from "@/utils/init-prompts";
import { handleCommandError } from "@/utils/process-exit";

export const registerInitCommand = (program: Command): void => {
  program
    .command("init")
    .description("Create devrec configuration interactively")
    .action(async () => {
      try {
        const configPath = `${os.homedir()}/.config/devrec/config.json`;

        try {
          await access(configPath);
          const shouldOverwrite = await confirm({
            message: "Config already exists. Overwrite?",
            default: false,
          });

          if (!shouldOverwrite) {
            console.log("Init cancelled.");
            process.exit(0);
          }
        } catch { /* config doesn't exist, continue */ }

        const authorEmails = await collectAuthorEmails();
        const repos = await collectRepos();

        const mainBranch = await input({
          message: "Main branch name:",
          default: "main",
        });

        const branchStrategy = (await select({
          message: "Which branches should devrec scan?",
          choices: [
            { value: "all", name: "All branches" },
            { value: "remote", name: "Only remote branches" },
          ],
        })) as BranchStrategy;

        const config: Config = {
          authorEmails,
          repos,
          sprintLength: 2,
          groupBy: "repo",
          locale: "en-US",
          mainBranch,
          branchStrategy,
        };

        const validated = ConfigSchema.parse(config);

        await mkdir(dirname(configPath), { recursive: true });

        await writeFile(configPath, JSON.stringify(validated, null, 2), "utf8");

        console.log(`Config created at: ${configPath}`);
      } catch (error) {
        if (error instanceof Error && error.name === "ExitPromptError") {
          console.log("\nInit cancelled.");
          process.exit(0);
        }

        handleCommandError(error, "Failed to create config");
      }
    });
};
