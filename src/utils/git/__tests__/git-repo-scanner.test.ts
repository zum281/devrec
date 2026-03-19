import { exec } from "node:child_process";
import os from "node:os";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { scanGitRepos, toDisplay } from "../git-repo-scanner";

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

const HOME = os.homedir();

/**
 * Helper to mock exec with a given stdout result.
 */
const mockExecSuccess = (stdout: string): void => {
  vi.mocked(exec).mockImplementation(
    (_cmd: string, _opts: unknown, cb: unknown) => {
      (cb as (err: null, result: { stdout: string }) => void)(null, {
        stdout,
      });
      return {} as ReturnType<typeof exec>;
    },
  );
};

/**
 * Helper to mock exec with an error that still has stdout.
 */
const mockExecPartialError = (stdout: string): void => {
  vi.mocked(exec).mockImplementation(
    (_cmd: string, _opts: unknown, cb: unknown) => {
      const error = Object.assign(new Error("exit code 1"), {
        code: 1,
        stdout,
        stderr: "",
      });
      (cb as (err: Error) => void)(error);
      return {} as ReturnType<typeof exec>;
    },
  );
};

/**
 * Helper to mock exec with a full failure (no stdout).
 */
const mockExecFailure = (): void => {
  vi.mocked(exec).mockImplementation(
    (_cmd: string, _opts: unknown, cb: unknown) => {
      (cb as (err: Error) => void)(new Error("timeout"));
      return {} as ReturnType<typeof exec>;
    },
  );
};

describe("scanGitRepos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns sorted repo paths from find output", async () => {
    mockExecSuccess(`${HOME}/b-repo/.git\n${HOME}/a-repo/.git\n`);

    const repos = await scanGitRepos();

    expect(repos).toEqual([`${HOME}/a-repo`, `${HOME}/b-repo`]);
  });

  test("returns repos from stdout even on non-zero exit code", async () => {
    mockExecPartialError(`${HOME}/my-project/.git\n`);

    const repos = await scanGitRepos();

    expect(repos).toEqual([`${HOME}/my-project`]);
  });

  test("returns empty array on full failure", async () => {
    mockExecFailure();

    const repos = await scanGitRepos();

    expect(repos).toEqual([]);
  });

  test("returns empty array for empty stdout", async () => {
    mockExecSuccess("");

    const repos = await scanGitRepos();

    expect(repos).toEqual([]);
  });
});

describe("toDisplay", () => {
  test("replaces home directory with ~", () => {
    expect(toDisplay(`${HOME}/projects/my-app`)).toBe("~/projects/my-app");
  });

  test("leaves non-home paths unchanged", () => {
    expect(toDisplay("/tmp/some-repo")).toBe("/tmp/some-repo");
  });
});
