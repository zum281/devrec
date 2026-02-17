import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { validateRepoPath } from "../validate-repo";

describe("validateRepoPath", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(os.tmpdir(), `devrec-test-${Date.now().toString()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("returns valid for existing git repository", async () => {
    const gitDir = join(testDir, ".git");
    await mkdir(gitDir);

    const result = await validateRepoPath(testDir);
    expect(result).toEqual({ valid: true });
  });

  test("returns not-found for non-existent path", async () => {
    const result = await validateRepoPath(join(testDir, "does-not-exist"));
    expect(result).toEqual({ valid: false, reason: "not-found" });
  });

  test("returns not-git for directory without .git", async () => {
    const result = await validateRepoPath(testDir);
    expect(result).toEqual({ valid: false, reason: "not-git" });
  });

  test("returns not-found for file instead of directory", async () => {
    const filePath = join(testDir, "file.txt");
    await writeFile(filePath, "test");

    const result = await validateRepoPath(filePath);
    expect(result).toEqual({ valid: false, reason: "not-found" });
  });

  test("expands tilde in path", async () => {
    const homeGitTest = join(os.homedir(), "test-git-repo");
    await mkdir(homeGitTest, { recursive: true });
    await mkdir(join(homeGitTest, ".git"));

    try {
      const result = await validateRepoPath("~/test-git-repo");
      expect(result).toEqual({ valid: true });
    } finally {
      await rm(homeGitTest, { recursive: true, force: true });
    }
  });

  test.skipIf(process.platform === "win32")(
    "handles permission errors gracefully",
    async () => {
      const restrictedDir = join(testDir, "restricted");
      await mkdir(restrictedDir);
      await mkdir(join(restrictedDir, ".git"));
      await chmod(restrictedDir, 0o000);

      try {
        const result = await validateRepoPath(restrictedDir);
        expect(result).toEqual({ valid: false, reason: "no-permission" });
      } finally {
        await chmod(restrictedDir, 0o755);
      }
    },
  );
});
