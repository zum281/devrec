import { confirm, input, select } from "@inquirer/prompts";
import type { Command } from "commander";
import { access, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname } from "node:path";
import { z } from "zod";
import { ConfigSchema } from "@/schemas/config.schema";
import type { BranchStrategy, Config, Repo } from "@/types";
import { handleCommandError } from "@/utils/process-exit";
import { validateRepoPath } from "@/utils/validate-repo";

/**
 * Collects author emails from user with validation
 */
const collectAuthorEmails = async (): Promise<Array<string>> => {
  const emails: Array<string> = [];
  let shouldAddMore = true;

  while (shouldAddMore) {
    const email = await input({
      message:
        emails.length === 0
          ? "Enter your git email address:"
          : "Enter another email address:",
      validate: (value: string) => {
        const result = z.email().safeParse(value);
        return result.success ? true : "Invalid email format";
      },
    });

    emails.push(email);

    shouldAddMore = await confirm({
      message: "Add another email?",
      default: false,
    });
  }

  return emails;
};

/**
 * Collects repository configurations from user with path validation
 */
const collectRepos = async (): Promise<Array<Repo>> => {
  const repos: Array<Repo> = [];
  let shouldAddMore = true;

  while (shouldAddMore) {
    const name = await input({
      message: repos.length === 0 ? "Enter repo name:" : "Enter another repo name:",
      validate: (value: string) => {
        return value.trim().length > 0 ? true : "Name required";
      },
    });

    const path = await input({
      message: `Enter path for ${name}:`,
      validate: async (value: string) => {
        const result = await validateRepoPath(value);
        if (result.valid) return true;

        switch (result.reason) {
          case "not-found": {
            return "Path does not exist";
          }
          case "not-git": {
            return "Not a git repository";
          }
          case "no-permission": {
            return "No read permission";
          }
        }
      },
    });

    repos.push({ name, path });

    shouldAddMore = await confirm({
      message: "Add another repo?",
      default: false,
    });
  }

  return repos;
};

/**
 * Registers the init command with Commander
 */
export const registerInitCommand = (program: Command): void => {
  program
    .command("init")
    .description("Create devrec configuration interactively")
    .action(async () => {
      try {
        const configPath = `${os.homedir()}/.config/devrec/config.json`;

        // Check if config already exists
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
        } catch {
          // Config doesn't exist, continue
        }

        // Collect configuration
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

        // Build config with defaults
        const config: Config = {
          authorEmails,
          repos,
          sprintLength: 2,
          groupBy: "repo",
          locale: "en-US",
          mainBranch,
          branchStrategy,
        };

        // Validate config
        const validated = ConfigSchema.parse(config);

        // Create directory if needed
        await mkdir(dirname(configPath), { recursive: true });

        // Write config file
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
