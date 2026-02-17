import { readFile } from "node:fs/promises";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { setupConsoleSpy, setupProcessExitSpy } from "@/utils/__tests__/fixtures";

vi.mock("node:fs/promises");

describe("readConfig", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = setupConsoleSpy("error");
    processExitSpy = setupProcessExitSpy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads and validates config file", async () => {
    const mockConfig = {
      authorEmails: ["test@example.com"],
      repos: [{ name: "repo1", path: "/path/to/repo" }],
      sprintLength: 2,
      groupBy: "repo",
      locale: "en-US",
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockConfig));

    const { readConfig } = await import("../read-config");
    const result = await readConfig();

    expect(readFile).toHaveBeenCalledWith(
      `${os.homedir()}/.config/devrec/config.json`,
      "utf8",
    );
    expect(result).toEqual({
      ...mockConfig,
      mainBranch: "main",
      branchStrategy: "all",
    });
  });

  test("exits on missing config file", async () => {
    const error = new Error("ENOENT") as NodeJS.ErrnoException;
    error.code = "ENOENT";
    vi.mocked(readFile).mockRejectedValue(error);

    const { readConfig } = await import("../read-config");
    await readConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config file not found"),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("drec init"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits on invalid JSON", async () => {
    vi.mocked(readFile).mockResolvedValue("invalid json");

    const { readConfig } = await import("../read-config");
    await readConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse Config as JSON"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits on schema validation failure", async () => {
    const invalidConfig = {
      authorEmails: ["not-an-email"],
      repos: [],
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidConfig));

    const { readConfig } = await import("../read-config");
    await readConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config validation failed:"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles missing required fields", async () => {
    const invalidConfig = {
      repos: [{ name: "repo1", path: "/path" }],
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidConfig));

    const { readConfig } = await import("../read-config");
    await readConfig();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Config validation failed:"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
