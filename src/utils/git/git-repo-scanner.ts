import { exec } from "node:child_process";
import os from "node:os";
import { dirname } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const HOME = os.homedir();

/**
 * Parses find output into sorted repo root paths.
 * @param stdout - Raw output from find command
 * @returns Sorted array of absolute paths to git repo roots
 */
const parseGitDirs = (stdout: string): Array<string> =>
  stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(gitDir => dirname(gitDir))
    .sort();

/**
 * Scans for git repositories under the home directory.
 * Searches up to 4 levels deep with a 10 second timeout.
 * @returns Array of absolute paths to git repo roots, sorted alphabetically
 */
export const scanGitRepos = async (): Promise<Array<string>> => {
  try {
    const { stdout } = await execAsync(
      `find "${HOME}" -maxdepth 4 -type d -name ".git" 2>/dev/null`,
      { timeout: 10_000 },
    );
    return parseGitDirs(stdout);
  } catch (error: unknown) {
    // find exits non-zero on permission errors but still produces output
    const stdout = (error as { stdout?: string }).stdout;
    if (stdout) return parseGitDirs(stdout);
    return [];
  }
};

/**
 * Replaces home directory prefix with ~ for display.
 * @param fullPath - Absolute path
 * @returns Path with ~ prefix if under home directory
 */
export const toDisplay = (fullPath: string): string =>
  fullPath.startsWith(HOME) ? fullPath.replace(HOME, "~") : fullPath;
