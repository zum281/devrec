import type { RepoValidationResult } from "./validate-repo";

/**
 * Logs appropriate warning message for invalid repository
 * @param repoName - Name of the repository
 * @param repoPath - Path to the repository
 * @param validation - Validation result containing failure reason
 */
export const logRepoValidationWarning = (
  repoName: string,
  repoPath: string,
  validation: Extract<RepoValidationResult, { valid: false }>,
): void => {
  switch (validation.reason) {
    case "not-found": {
      console.warn(`Warning: Repo '${repoName}' not found at path: ${repoPath}`);
      break;
    }
    case "not-git": {
      console.warn(
        `Warning: Path '${repoPath}' for repo '${repoName}' is not a git repository`,
      );
      break;
    }
    case "no-permission": {
      console.warn(
        `Warning: No permission to read repo '${repoName}' at path: ${repoPath}`,
      );
      break;
    }
  }
};
