import { checkbox, confirm, input, search } from "@inquirer/prompts";
import { basename } from "node:path";
import { z } from "zod";
import type { Repo } from "@/types";
import { scanGlobalGitEmail } from "@/utils/git-email-scanner";
import { scanGitRepos, toDisplay } from "@/utils/git-repo-scanner";
import { pathSearchSource } from "@/utils/path-search";
import { validateRepoPath } from "@/utils/validate-repo";

/**
 * Collects emails manually one at a time with Zod validation.
 * Used as fallback when no global email is detected or to add extras.
 */
export const collectEmailsManually = async (): Promise<Array<string>> => {
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
 * Collects author emails by detecting the global git config email
 * and allowing manual additions.
 */
export const collectAuthorEmails = async (): Promise<Array<string>> => {
  const emails: Array<string> = [];

  const globalEmail = await scanGlobalGitEmail();

  if (globalEmail) {
    const shouldUse = await confirm({
      message: `Use ${globalEmail} from git config?`,
      default: true,
    });

    if (shouldUse) {
      emails.push(globalEmail);
    }
  }

  const shouldAddManually =
    emails.length === 0 ||
    (await confirm({
      message: "Add another email?",
      default: false,
    }));

  if (shouldAddManually) {
    const manualEmails = await collectEmailsManually();
    emails.push(...manualEmails);
  }

  return emails;
};

/**
 * Adds repos manually one at a time using the path search prompt
 */
export const collectReposManually = async (): Promise<Array<Repo>> => {
  const repos: Array<Repo> = [];
  let shouldAddMore = true;

  while (shouldAddMore) {
    const name = await input({
      message: repos.length === 0 ? "Enter repo name:" : "Enter another repo name:",
      validate: (value: string) =>
        value.trim().length > 0 ? true : "Name required",
    });

    const path = await search({
      message: `Enter path for ${name}:`,
      source: pathSearchSource,
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
 * Scans for git repos and presents a checkbox, with manual fallback
 */
export const collectRepos = async (): Promise<Array<Repo>> => {
  console.log("Scanning for git repositories...");
  const gitRepos = await scanGitRepos();

  let repos: Array<Repo> = [];

  if (gitRepos.length > 0) {
    const selectedPaths = await checkbox({
      message: `Select repositories to track (${String(gitRepos.length)} found):`,
      choices: gitRepos.map(repoPath => ({
        value: repoPath,
        name: basename(repoPath),
        description: toDisplay(repoPath),
      })),
      pageSize: 15,
    });

    repos = selectedPaths.map(repoPath => ({
      name: basename(repoPath),
      path: repoPath,
    }));
  } else {
    console.log("No git repositories found.");
  }

  const shouldAddManually =
    repos.length === 0 ||
    (await confirm({
      message: "Add more repos manually?",
      default: false,
    }));

  if (shouldAddManually) {
    const manualRepos = await collectReposManually();
    repos.push(...manualRepos);
  }

  return repos;
};
