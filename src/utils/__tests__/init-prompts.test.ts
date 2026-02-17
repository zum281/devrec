/* eslint-disable @typescript-eslint/promise-function-async -- vitest mock callbacks return Promise.resolve() without async */
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@inquirer/prompts");
vi.mock("@/utils/validate-repo");
vi.mock("@/utils/path-search");
vi.mock("@/utils/git-repo-scanner");
vi.mock("@/utils/git-email-scanner");

describe("collectEmailsManually", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("collects a single email", async () => {
    const { input, confirm } = await import("@inquirer/prompts");

    vi.mocked(input).mockResolvedValue("test@example.com");
    vi.mocked(confirm).mockResolvedValue(false);

    const { collectEmailsManually } = await import("../init-prompts");
    const result = await collectEmailsManually();

    expect(result).toEqual(["test@example.com"]);
    expect(input).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Enter your git email address:" }),
    );
  });

  test("collects multiple emails", async () => {
    const { input, confirm } = await import("@inquirer/prompts");

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(() => {
      inputCallCount++;
      if (inputCallCount === 1) return Promise.resolve("a@example.com");
      return Promise.resolve("b@example.com");
    });

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      return Promise.resolve(confirmCallCount === 1);
    });

    const { collectEmailsManually } = await import("../init-prompts");
    const result = await collectEmailsManually();

    expect(result).toEqual(["a@example.com", "b@example.com"]);
    expect(input).toHaveBeenCalledTimes(2);
    expect(input).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: "Enter another email address:" }),
    );
  });
});

describe("collectAuthorEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("pre-fills global email when user confirms", async () => {
    const { confirm } = await import("@inquirer/prompts");
    const { scanGlobalGitEmail } = await import("@/utils/git-email-scanner");

    vi.mocked(scanGlobalGitEmail).mockResolvedValue("global@example.com");

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      if (confirmCallCount === 1) return Promise.resolve(true); // use global email
      return Promise.resolve(false); // don't add more
    });

    const { collectAuthorEmails } = await import("../init-prompts");
    const result = await collectAuthorEmails();

    expect(result).toEqual(["global@example.com"]);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Use global@example.com from git config?",
      }),
    );
  });

  test("skips global email when user declines", async () => {
    const { confirm, input } = await import("@inquirer/prompts");
    const { scanGlobalGitEmail } = await import("@/utils/git-email-scanner");

    vi.mocked(scanGlobalGitEmail).mockResolvedValue("global@example.com");
    vi.mocked(confirm).mockResolvedValue(false); // decline global, then decline "add another"
    vi.mocked(input).mockResolvedValue("manual@example.com");

    const { collectAuthorEmails } = await import("../init-prompts");
    const result = await collectAuthorEmails();

    expect(result).toEqual(["manual@example.com"]);
  });

  test("falls back to manual when no global email found", async () => {
    const { confirm, input } = await import("@inquirer/prompts");
    const { scanGlobalGitEmail } = await import("@/utils/git-email-scanner");

    vi.mocked(scanGlobalGitEmail).mockResolvedValue(null);
    vi.mocked(input).mockResolvedValue("typed@example.com");
    vi.mocked(confirm).mockResolvedValue(false);

    const { collectAuthorEmails } = await import("../init-prompts");
    const result = await collectAuthorEmails();

    expect(result).toEqual(["typed@example.com"]);
  });

  test("combines global email with manual additions", async () => {
    const { confirm, input } = await import("@inquirer/prompts");
    const { scanGlobalGitEmail } = await import("@/utils/git-email-scanner");

    vi.mocked(scanGlobalGitEmail).mockResolvedValue("global@example.com");
    vi.mocked(input).mockResolvedValue("extra@example.com");

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      if (confirmCallCount === 1) return Promise.resolve(true); // use global email
      if (confirmCallCount === 2) return Promise.resolve(true); // add more manually
      return Promise.resolve(false); // don't add another
    });

    const { collectAuthorEmails } = await import("../init-prompts");
    const result = await collectAuthorEmails();

    expect(result).toEqual(["global@example.com", "extra@example.com"]);
  });
});

describe("collectReposManually", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("collects a single repo", async () => {
    const { input, confirm, search } = await import("@inquirer/prompts");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(input).mockResolvedValue("my-repo");
    vi.mocked(search).mockResolvedValue("/path/to/repo");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });
    vi.mocked(confirm).mockResolvedValue(false);

    const { collectReposManually } = await import("../init-prompts");
    const result = await collectReposManually();

    expect(result).toEqual([{ name: "my-repo", path: "/path/to/repo" }]);
  });

  test("collects multiple repos", async () => {
    const { input, confirm, search } = await import("@inquirer/prompts");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(() => {
      inputCallCount++;
      return Promise.resolve(inputCallCount === 1 ? "repo-a" : "repo-b");
    });

    let searchCallCount = 0;
    vi.mocked(search).mockImplementation(() => {
      searchCallCount++;
      return Promise.resolve(searchCallCount === 1 ? "/path/a" : "/path/b");
    });

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      return Promise.resolve(confirmCallCount === 1);
    });

    const { collectReposManually } = await import("../init-prompts");
    const result = await collectReposManually();

    expect(result).toEqual([
      { name: "repo-a", path: "/path/a" },
      { name: "repo-b", path: "/path/b" },
    ]);
  });
});

describe("collectRepos", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  test("presents scanned repos as checkbox choices", async () => {
    const { checkbox, confirm } = await import("@inquirer/prompts");
    const { scanGitRepos } = await import("@/utils/git-repo-scanner");

    vi.mocked(scanGitRepos).mockResolvedValue([
      "/Users/me/projects/repo-a",
      "/Users/me/projects/repo-b",
    ]);
    vi.mocked(checkbox).mockResolvedValue(["/Users/me/projects/repo-a"]);
    vi.mocked(confirm).mockResolvedValue(false);

    const { collectRepos } = await import("../init-prompts");
    const result = await collectRepos();

    expect(result).toEqual([
      { name: "repo-a", path: "/Users/me/projects/repo-a" },
    ]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Scanning for git repositories...",
    );
  });

  test("falls back to manual entry when no repos found", async () => {
    const { input, confirm, search } = await import("@inquirer/prompts");
    const { scanGitRepos } = await import("@/utils/git-repo-scanner");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(scanGitRepos).mockResolvedValue([]);
    vi.mocked(input).mockResolvedValue("manual-repo");
    vi.mocked(search).mockResolvedValue("/manual/path");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });
    vi.mocked(confirm).mockResolvedValue(false);

    const { collectRepos } = await import("../init-prompts");
    const result = await collectRepos();

    expect(result).toEqual([{ name: "manual-repo", path: "/manual/path" }]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "No git repositories found.",
    );
  });

  test("allows adding manual repos after scan selection", async () => {
    const { checkbox, confirm, input, search } = await import(
      "@inquirer/prompts"
    );
    const { scanGitRepos } = await import("@/utils/git-repo-scanner");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(scanGitRepos).mockResolvedValue(["/Users/me/scanned-repo"]);
    vi.mocked(checkbox).mockResolvedValue(["/Users/me/scanned-repo"]);

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      if (confirmCallCount === 1) return Promise.resolve(true);
      return Promise.resolve(false);
    });

    vi.mocked(input).mockResolvedValue("extra-repo");
    vi.mocked(search).mockResolvedValue("/extra/path");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    const { collectRepos } = await import("../init-prompts");
    const result = await collectRepos();

    expect(result).toEqual([
      { name: "scanned-repo", path: "/Users/me/scanned-repo" },
      { name: "extra-repo", path: "/extra/path" },
    ]);
  });
});
