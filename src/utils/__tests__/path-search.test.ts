import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import os from "node:os";
import { basename, join } from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { pathSearchSource } from "../path-search";

vi.mock("node:fs/promises");
vi.mock("@/utils/git-repo-scanner", () => ({
  scanGitRepos: vi.fn().mockResolvedValue([]),
  toDisplay: (p: string) =>
    p.startsWith(os.homedir()) ? p.replace(os.homedir(), "~") : p,
}));

const makeDirent = (name: string, isDirectory: boolean): Dirent =>
  ({
    name,
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
  }) as unknown as Dirent;

describe("pathSearchSource – path mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns matching directories for a partial path", async () => {
    vi.mocked(readdir).mockResolvedValue([
      makeDirent("project-alpha", true),
      makeDirent("project-beta", true),
      makeDirent("other", true),
    ] as never);

    const results = await pathSearchSource("/Users/me/pr");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      value: join("/Users/me", "project-alpha"),
      name: "/Users/me/project-alpha/",
      short: "/Users/me/project-alpha",
    });
    expect(results[1]).toEqual({
      value: join("/Users/me", "project-beta"),
      name: "/Users/me/project-beta/",
      short: "/Users/me/project-beta",
    });
  });

  test("returns all directories when input ends with a slash", async () => {
    vi.mocked(readdir).mockResolvedValue([
      makeDirent("a", true),
      makeDirent("b", true),
    ] as never);

    const results = await pathSearchSource("/Users/me/");

    expect(results).toHaveLength(2);
  });

  test("returns empty array when readdir throws", async () => {
    vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));

    const results = await pathSearchSource("/Users/me/does-not-exist/pr");

    expect(results).toEqual([]);
  });

  test("excludes files, only returns directories", async () => {
    vi.mocked(readdir).mockResolvedValue([
      makeDirent("my-repo", true),
      makeDirent("readme.txt", false),
    ] as never);

    const results = await pathSearchSource("/Users/me/");

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(join("/Users/me", "my-repo"));
  });

  test("excludes hidden directories", async () => {
    vi.mocked(readdir).mockResolvedValue([
      makeDirent(".hidden", true),
      makeDirent("visible", true),
    ] as never);

    const results = await pathSearchSource("/Users/me/");

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(join("/Users/me", "visible"));
  });

  test("displays ~ prefix for home-relative paths", async () => {
    const home = os.homedir();
    vi.mocked(readdir).mockResolvedValue([
      makeDirent("projects", true),
    ] as never);

    const results = await pathSearchSource(`${home}/`);

    expect(results[0].name).toBe("~/projects/");
    expect(results[0].short).toBe("~/projects");
  });

  test("expands ~ in input", async () => {
    vi.mocked(readdir).mockResolvedValue([
      makeDirent("docs", true),
    ] as never);

    const results = await pathSearchSource("~/");

    expect(readdir).toHaveBeenCalledWith(os.homedir() + "/", {
      withFileTypes: true,
    });
    expect(results).toHaveLength(1);
  });
});

describe("pathSearchSource – fuzzy mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("searches git repos by folder name", async () => {
    const { scanGitRepos } = await import("@/utils/git-repo-scanner");
    vi.mocked(scanGitRepos).mockResolvedValue([
      "/Users/me/projects/my-app",
      "/Users/me/work/my-api",
      "/Users/me/other/unrelated",
    ]);

    const results = await pathSearchSource("my");

    expect(results).toHaveLength(2);
    expect(results.map(r => basename(r.value))).toEqual(["my-app", "my-api"]);
  });

  test("returns empty when no repos match", async () => {
    const { scanGitRepos } = await import("@/utils/git-repo-scanner");
    vi.mocked(scanGitRepos).mockResolvedValue([
      "/Users/me/projects/foo",
    ]);

    const results = await pathSearchSource("zzz");

    expect(results).toEqual([]);
  });
});
