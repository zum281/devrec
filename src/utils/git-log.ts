import git from "simple-git";
import type { Commit, CommitWithBranch, Config } from "@/types";
import { expandTilde } from "@/utils/path";

/**
 * Parses branch list from git command output
 * @param branchOutput - Raw git branch output
 * @returns Array of branch names
 */
const parseBranchList = (branchOutput: string): Array<string> => {
  return branchOutput
    .split("\n")
    .map(line => line.trim().replace(/^\* /, ""))
    .filter(Boolean);
};

/**
 * Enriches commit with branch information
 * @param gitRepo - Simple-git instance
 * @param commit - Commit to enrich
 * @param mainBranch - Name of the main branch
 * @returns Commit with branch information
 */
const enrichCommitWithBranchInfo = async (
  gitRepo: ReturnType<typeof git>,
  commit: Commit,
  mainBranch: string,
): Promise<CommitWithBranch> => {
  try {
    const branchesRaw = await gitRepo.raw([
      "branch",
      "--all",
      "--contains",
      commit.hash,
    ]);
    const branches = parseBranchList(branchesRaw);

    const isMerged = branches.some(
      b => b === mainBranch || b === `remotes/origin/${mainBranch}`,
    );

    const primaryBranch = isMerged
      ? undefined
      : branches.find(b => !b.includes("remotes/") && b !== mainBranch);

    return {
      ...commit,
      branches,
      isMerged,
      primaryBranch,
    };
  } catch {
    return {
      ...commit,
      branches: [],
      isMerged: false,
      primaryBranch: undefined,
    };
  }
};

/**
 * Deduplicates commits by hash
 * @param commits - Array of commits
 * @returns Deduplicated commits
 */
const deduplicateCommits = (commits: Array<Commit>): Array<Commit> => {
  const seen = new Set<string>();
  return commits.filter(commit => {
    if (seen.has(commit.hash)) {
      return false;
    }
    seen.add(commit.hash);
    return true;
  });
};

/**
 * Fetches git commits from a repository
 * @param author - Array of author email addresses to filter commits
 * @param repoPath - Absolute path to the git repository (supports tilde expansion)
 * @param dateRange - Optional date range (if not provided, fetches all commits)
 * @returns Array of commits with hash, date, and message
 */
export const getGitLog = async (
  author: Array<string>,
  repoPath: string,
  dateRange?: { since: string; until: string },
): Promise<Array<Commit>> => {
  const expandedPath = expandTilde(repoPath);
  const gitRepo = git(expandedPath);

  const logOptions: Record<string, string | Array<string>> = {
    "--author": author,
  };

  if (dateRange) {
    logOptions["--since"] = `${dateRange.since} 00:00:00`;
    logOptions["--until"] = `${dateRange.until} 23:59:59`;
  }

  try {
    const log = await gitRepo.log(logOptions);

    return log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
    }));
  } catch (error) {
    console.error("Error fetching git log:", error);
    throw error;
  }
};

/**
 * Fetches git commits with branch information
 * @param author - Array of author email addresses to filter commits
 * @param repoPath - Absolute path to the git repository (supports tilde expansion)
 * @param config - Configuration with branch strategy and main branch
 * @param dateRange - Optional date range (if not provided, fetches all commits)
 * @returns Array of commits with branch information
 */
export const getGitLogWithBranches = async (
  author: Array<string>,
  repoPath: string,
  config: Config,
  dateRange?: { since: string; until: string },
): Promise<Array<CommitWithBranch>> => {
  const expandedPath = expandTilde(repoPath);
  const gitRepo = git(expandedPath);

  const logOptions: Record<string, string | Array<string> | null> = {
    "--author": author,
  };

  if (dateRange) {
    logOptions["--since"] = `${dateRange.since} 00:00:00`;
    logOptions["--until"] = `${dateRange.until} 23:59:59`;
  }

  if (config.branchStrategy === "all") {
    logOptions["--all"] = null;
  } else {
    logOptions["--remotes"] = null;
  }

  try {
    const log = await gitRepo.log(logOptions);

    const commits = log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
    }));

    const uniqueCommits = deduplicateCommits(commits);

    const commitsWithBranches = await Promise.all(
      uniqueCommits.map(async commit =>
        enrichCommitWithBranchInfo(gitRepo, commit, config.mainBranch),
      ),
    );

    return commitsWithBranches;
  } catch (error) {
    console.error("Error fetching git log:", error);
    throw error;
  }
};
