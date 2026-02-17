import git from "simple-git";

/**
 * Reads the global git config user.email.
 * @returns The configured global email, or null if not set or on error
 */
export const scanGlobalGitEmail = async (): Promise<string | null> => {
  try {
    const config = await git().getConfig("user.email", "global");
    return config.value ?? null;
  } catch {
    return null;
  }
};
