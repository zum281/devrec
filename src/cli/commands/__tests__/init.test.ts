/* eslint-disable @typescript-eslint/promise-function-async */

/* eslint-disable @typescript-eslint/require-await */

/* eslint-disable unicorn/no-useless-undefined */
import { Command } from "commander";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@inquirer/prompts");
vi.mock("node:fs/promises");
vi.mock("@/utils/validate-repo");
vi.mock("@/utils/process-exit");

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

  test("happy path - single email and repo", async () => {
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) => {
        inputCallCount++;
        if (inputCallCount === 1) return Promise.resolve("test@example.com");
        if (inputCallCount === 2) return Promise.resolve("my-repo");
        if (inputCallCount === 3) return Promise.resolve("/path/to/repo");
        if (inputCallCount === 4) return Promise.resolve(config.default ?? "main");
        return Promise.resolve("");
      },
    );

    vi.mocked(confirm).mockImplementation(() => Promise.resolve(false));

    vi.mocked(select).mockResolvedValue("all");

    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const { registerInitCommand } = await import("../init");

    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(writeFile).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config created at:"),
    );
  });

  test("multiple emails and repos", async () => {
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) => {
        inputCallCount++;
        if (inputCallCount === 1) return Promise.resolve("test1@example.com");
        if (inputCallCount === 2) return Promise.resolve("test2@example.com");
        if (inputCallCount === 3) return Promise.resolve("repo1");
        if (inputCallCount === 4) return Promise.resolve("/path1");
        if (inputCallCount === 5) return Promise.resolve("repo2");
        if (inputCallCount === 6) return Promise.resolve("/path2");
        if (inputCallCount === 7) return Promise.resolve(config.default ?? "main");
        return Promise.resolve("");
      },
    );

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      if (confirmCallCount === 1) return Promise.resolve(true);
      if (confirmCallCount === 2) return Promise.resolve(false);
      if (confirmCallCount === 3) return Promise.resolve(true);
      return Promise.resolve(false);
    });

    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

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
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(access).mockResolvedValue(undefined);

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(
      (config: { message: string; default?: string }) => {
        inputCallCount++;
        if (inputCallCount === 1) return Promise.resolve("test@example.com");
        if (inputCallCount === 2) return Promise.resolve("my-repo");
        if (inputCallCount === 3) return Promise.resolve("/path/to/repo");
        if (inputCallCount === 4) return Promise.resolve(config.default ?? "main");
        return Promise.resolve("");
      },
    );

    let confirmCallCount = 0;
    vi.mocked(confirm).mockImplementation(() => {
      confirmCallCount++;
      if (confirmCallCount === 1) return Promise.resolve(true);
      return Promise.resolve(false);
    });

    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

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
    const { input } = await import("@inquirer/prompts");
    const { access } = await import("node:fs/promises");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    const exitError = new Error("User cancelled");
    exitError.name = "ExitPromptError";
    vi.mocked(input).mockRejectedValue(exitError);

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

  test("handles repo validation error - not-found", async () => {
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    let inputCallCount = 0;
    let pathValidateCallCount = 0;
    vi.mocked(input).mockImplementation(
      async (config: {
        message: string;
        default?: string;
        validate?: (value: string) => boolean | string | Promise<boolean | string>;
      }) => {
        inputCallCount++;
        if (inputCallCount === 1) return "test@example.com";
        if (inputCallCount === 2) return "my-repo";
        if (inputCallCount === 3) {
          if (config.validate) {
            pathValidateCallCount++;
            if (pathValidateCallCount === 1) {
              const result = await config.validate("/invalid/path");
              expect(result).toBe("Path does not exist");
            }
          }
          return "/valid/path";
        }
        if (inputCallCount === 4) return config.default ?? "main";
        return "";
      },
    );

    let validateCallCount = 0;
    vi.mocked(validateRepoPath).mockImplementation(() => {
      validateCallCount++;
      if (validateCallCount === 1) {
        return Promise.resolve({ valid: false, reason: "not-found" });
      }
      return Promise.resolve({ valid: true });
    });

    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const { registerInitCommand } = await import("../init");

    const program = new Command();
    registerInitCommand(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(writeFile).toHaveBeenCalled();
  });

  test("handles file system error", async () => {
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");
    const { handleCommandError } = await import("@/utils/process-exit");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(
      async (config: { message: string; default?: string }) => {
        inputCallCount++;
        if (inputCallCount === 1) return "test@example.com";
        if (inputCallCount === 2) return "my-repo";
        if (inputCallCount === 3) return "/path/to/repo";
        if (inputCallCount === 4) return config.default ?? "main";
        return "";
      },
    );

    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(select).mockResolvedValue("all");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });

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
    const { input, confirm, select } = await import("@inquirer/prompts");
    const { access, mkdir, writeFile } = await import("node:fs/promises");
    const { validateRepoPath } = await import("@/utils/validate-repo");

    vi.mocked(access).mockRejectedValue(new Error("not found"));

    let inputCallCount = 0;
    vi.mocked(input).mockImplementation(
      async (config: { message: string; default?: string }) => {
        inputCallCount++;
        if (inputCallCount === 1) return "test@example.com";
        if (inputCallCount === 2) return "my-repo";
        if (inputCallCount === 3) return "/path/to/repo";
        if (inputCallCount === 4) return config.default ?? "main";
        return "";
      },
    );

    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(select).mockResolvedValue("remote");
    vi.mocked(validateRepoPath).mockResolvedValue({ valid: true });
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

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
