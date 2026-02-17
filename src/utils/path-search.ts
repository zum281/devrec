import { readdir } from "node:fs/promises";
import os from "node:os";
import { basename, dirname, join } from "node:path";
import { scanGitRepos, toDisplay } from "@/utils/git-repo-scanner";

type PathChoice = { value: string; name: string; short: string };

/**
 * Creates a search choice from an absolute path.
 * Displays ~ prefix for home-relative paths.
 */
const toChoice = (fullPath: string): PathChoice => ({
  value: fullPath,
  name: toDisplay(fullPath) + "/",
  short: toDisplay(fullPath),
});

/**
 * Source function for \@inquirer/search path input.
 *
 * Two modes:
 * - Path mode: input starts with / or ~ leads to hierarchical directory listing
 * - Fuzzy mode: plain text searches git repos by folder name
 *
 * @param input - Current text typed by the user (undefined on first render)
 * @returns Matching entries as search choices
 */
export const pathSearchSource = async (
  input?: string,
): Promise<Array<PathChoice>> => {
  const home = os.homedir();
  const raw = (input ?? "").replace(/^~/, home);

  // Path mode: hierarchical navigation
  if (!raw || raw.startsWith("/")) {
    const expanded = raw || home + "/";
    const isTrailingSlash = expanded.endsWith("/");
    const dir = isTrailingSlash ? expanded : dirname(expanded);
    const prefix = isTrailingSlash ? "" : basename(expanded).toLowerCase();

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries
        .filter(
          entry =>
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            (prefix === "" || entry.name.toLowerCase().startsWith(prefix)),
        )
        .map(entry => toChoice(join(dir, entry.name)));
    } catch {
      return [];
    }
  }

  // Fuzzy mode: search git repos by folder name
  const repos = await scanGitRepos();
  const lower = raw.toLowerCase();
  return repos
    .filter(r => basename(r).toLowerCase().includes(lower))
    .map(r => toChoice(r));
};
