/* eslint-disable @typescript-eslint/promise-function-async -- vitest mock callbacks return Promise.resolve() without async */
/* eslint-disable unicorn/no-useless-undefined -- vitest mockResolvedValue requires explicit undefined for void returns */
import { Command } from "commander";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@inquirer/prompts");
vi.mock("node:fs/promises");
vi.mock("@/utils/validate-repo");
vi.mock("@/utils/process-exit");
vi.mock("@/utils/path-search");
vi.mock("@/utils/git-repo-scanner");
vi.mock("@/utils/init-prompts");

describe("registerInitCommand", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
    processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
  });

  /**
   * Sets up mocks for the standard flow.
   * collectAuthorEmails/collectRepos are mocked at the utility level.
   */
  const setupScanFlow = async (repoPaths: Array<string>) => {
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { collectAuthorEmails, collectRepos } = await import(
      "@/utils/init-prompts"
    );

    vi.mocked(access).mockRejectedValue(new Error("not found"));
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(collectAuthorEmails).mockResolvedValue(["test@example.com"]);
    vi.mocked(collectRepos).mockResolvedValue(
      repoPaths.map(p => ({ name: p.split("/").pop() ?? "", path: p })),
    );

    return { input, confirm, select, access, mkdir, writeFile, collectAuthorEmails, collectRepos };
  };

  test("happy path - scan finds repos, user selects one", async () => {
    const { writeFile, collectAuthorEmails, collectRepos } =
      await setupScanFlow(["/Users/me/projects/my-repo"]);

    const { input } = await import("@inquirer/prompts");
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(collectAuthorEmails).toHaveBeenCalled();
    expect(collectRepos).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    const writeCall = vi.mocked(writeFile).mock.calls[0];
    const configData = JSON.parse(writeCall[1] as string) as {
      repos: Array<{ name: string; path: string }>;
    };
    expect(configData.repos).toEqual([
      { name: "my-repo", path: "/Users/me/projects/my-repo" },
    ]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config created at:"),
    );
  });

  test("multiple emails, multiple scanned repos", async () => {
    const { writeFile, collectAuthorEmails } =
      await setupScanFlow(["/Users/me/repo1", "/Users/me/repo2"]);

    vi.mocked(collectAuthorEmails).mockResolvedValue([
      "a@example.com",
      "b@example.com",
    ]);

    const { input } = await import("@inquirer/prompts");
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(writeFile).toHaveBeenCalled();
    const writeCall = vi.mocked(writeFile).mock.calls[0];
    const configData = JSON.parse(writeCall[1] as string) as {
      authorEmails: Array<string>;
      repos: Array<unknown>;
    };
    expect(configData.authorEmails).toHaveLength(2);
    expect(configData.repos).toHaveLength(2);
  });

  test("config exists - overwrite confirmed", async () => {
    const { confirm, writeFile, access } = await setupScanFlow([
      "/Users/me/repo",
    ]);

    vi.mocked(access).mockResolvedValue(undefined);

    const { input } = await import("@inquirer/prompts");
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    vi.mocked(confirm).mockResolvedValue(true);

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(writeFile).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config created at:"),
    );
  });

  test("config exists - overwrite rejected", async () => {
    const { confirm } = await import("@inquirer/prompts");
    const { access } = await import("node:fs/promises");

    vi.mocked(access).mockResolvedValue(undefined);
    vi.mocked(confirm).mockResolvedValue(false);

    const { registerInitCommand } = await import("../init");

    const program = new Command();
    registerInitCommand(program);

    try {
      await program.parseAsync(["node", "test", "init"]);
    } catch (error) {
      expect((error as Error).message).toBe("process.exit called");
    }

    expect(consoleLogSpy).toHaveBeenCalledWith("Init cancelled.");
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  test("user cancels with ExitPromptError", async () => {
    const { access } = await import("node:fs/promises");
    const { collectAuthorEmails } = await import("@/utils/init-prompts");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    const exitError = new Error("User cancelled");
    exitError.name = "ExitPromptError";
    vi.mocked(collectAuthorEmails).mockRejectedValue(exitError);

    const { registerInitCommand } = await import("../init");

    const program = new Command();
    registerInitCommand(program);

    try {
      await program.parseAsync(["node", "test", "init"]);
    } catch (error) {
      expect((error as Error).message).toBe("process.exit called");
    }

    expect(consoleLogSpy).toHaveBeenCalledWith("\nInit cancelled.");
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  test("no repos found - falls back to manual entry", async () => {
    const { input, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { collectAuthorEmails, collectRepos } = await import(
      "@/utils/init-prompts"
    );

    vi.mocked(access).mockRejectedValue(new Error("not found"));
    vi.mocked(collectAuthorEmails).mockResolvedValue(["test@example.com"]);
    vi.mocked(collectRepos).mockResolvedValue([
      { name: "my-repo", path: "/path/to/repo" },
    ]);

    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(writeFile).toHaveBeenCalled();
    const writeCall = vi.mocked(writeFile).mock.calls[0];
    const configData = JSON.parse(writeCall[1] as string) as {
      repos: Array<{ name: string; path: string }>;
    };
    expect(configData.repos).toEqual([
      { name: "my-repo", path: "/path/to/repo" },
    ]);
  });

  test("handles file system error", async () => {
    const { confirm } = await setupScanFlow(["/Users/me/repo"]);
    const { mkdir } = await import("node:fs/promises");
    const { handleCommandError } = await import("@/utils/process-exit");

    const { input } = await import("@inquirer/prompts");
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    vi.mocked(confirm).mockResolvedValue(false);

    const fsError = new Error("Permission denied");
    vi.mocked(mkdir).mockRejectedValue(fsError);

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(handleCommandError).toHaveBeenCalledWith(
      fsError,
      "Failed to create config",
    );
  });

  test("selects remote branch strategy", async () => {
    const { select, writeFile } = await setupScanFlow(["/Users/me/repo"]);

    const { input } = await import("@inquirer/prompts");
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) =>
        Promise.resolve(config.default ?? "main"),
    );

    vi.mocked(select).mockResolvedValue("remote");

    const { registerInitCommand } = await import("../init");
    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    const writeCall = vi.mocked(writeFile).mock.calls[0];
    const configData = JSON.parse(writeCall[1] as string) as {
      branchStrategy: string;
    };
    expect(configData.branchStrategy).toBe("remote");
  });
});
