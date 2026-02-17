import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import { join } from "node:path";
import { expandTilde } from "@/utils/path";

export type RepoValidationResult =
  | { valid: true }
  | { valid: false; reason: "not-found" | "not-git" | "no-permission" };

/**
 * Validates that a repository path exists and is a git repository
 * @param repoPath - Path to validate (supports tilde expansion)
 * @returns Validation result with reason if invalid
 */
export const validateRepoPath = async (
  repoPath: string,
): Promise<RepoValidationResult> => {
  const expandedPath = expandTilde(repoPath);

  try {
    await access(expandedPath, constants.R_OK);
  } catch {
    try {
      await access(expandedPath, constants.F_OK);
      return { valid: false, reason: "no-permission" };
    } catch {
      return { valid: false, reason: "not-found" };
    }
  }

  try {
    const stats = await stat(expandedPath);
    if (!stats.isDirectory()) {
      return { valid: false, reason: "not-found" };
    }
  } catch {
    return { valid: false, reason: "not-found" };
  }

  const gitPath = join(expandedPath, ".git");
  try {
    await access(gitPath, constants.F_OK);
  } catch {
    return { valid: false, reason: "not-git" };
  }

  return { valid: true };
};
